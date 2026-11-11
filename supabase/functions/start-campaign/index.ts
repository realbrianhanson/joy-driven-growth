import { createClient } from "npm:@supabase/supabase-js@2";
import { json, preflight } from "../_shared/http.ts";
import { allowedCountryCodes, checkCampaign, cleanRecipients, monthStartIso, renderMessage } from "../_shared/sms.ts";

const APP_URL = (Deno.env.get("PUBLIC_APP_URL") || "https://happyclient.io").replace(/\/$/, "");

/**
 * Starts a text campaign that was saved as a draft.
 *
 * This is the only way texts enter the sending queue. The browser cannot
 * write to the queue, so every rule is enforced here: who may send, the
 * plan's monthly allowance, the countries that may be texted, the message
 * length, and that every text carries the owner's own form link.
 *
 * Body: { campaign_id, scheduled_at? }. Returns { ok, queued, status }.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
    const callerId = userData.user.id;

    let body: { campaign_id?: unknown; scheduled_at?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (typeof body.campaign_id !== "string") return json({ error: "missing_campaign_id" }, 400);

    let scheduledAt: string | null = null;
    if (typeof body.scheduled_at === "string" && body.scheduled_at) {
      const time = new Date(body.scheduled_at).getTime();
      if (!Number.isFinite(time)) return json({ error: "invalid_schedule" }, 400);
      // A time that has just passed means "now".
      if (time > Date.now() + 60_000) scheduledAt = new Date(time).toISOString();
    }

    // Without Twilio the queue would fill and nothing would ever send.
    if (!Deno.env.get("TWILIO_ACCOUNT_SID") || !Deno.env.get("TWILIO_AUTH_TOKEN") || !Deno.env.get("TWILIO_PHONE_NUMBER")) {
      return json({ error: "sms_not_configured" }, 503);
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: allowed } = await admin.rpc("check_rate_limit", {
      p_key: `start-campaign:${callerId}`,
      p_max: 10,
      p_window_seconds: 60,
    });
    if (allowed === false) return json({ error: "rate_limited" }, 429);

    const { data: campaign, error: campaignError } = await admin
      .from("campaigns")
      .select("id, user_id, status, form_id, message_template, recipients")
      .eq("id", body.campaign_id)
      .maybeSingle();
    if (campaignError || !campaign) return json({ error: "campaign_not_found" }, 404);

    // The owner may send. So may a team member who has the admin role.
    const ownerId = campaign.user_id as string;
    if (ownerId !== callerId) {
      const { data: member } = await admin
        .from("team_members")
        .select("role")
        .eq("owner_user_id", ownerId)
        .eq("member_user_id", callerId)
        .maybeSingle();
      if (!member || member.role !== "admin") return json({ error: "forbidden" }, 403);
    }

    if (campaign.status !== "draft") return json({ error: "campaign_already_started" }, 409);

    const { data: form } = campaign.form_id
      ? await admin.from("forms").select("slug, is_published, user_id").eq("id", campaign.form_id).maybeSingle()
      : { data: null };
    if (!form || form.user_id !== ownerId || !form.is_published) return json({ error: "form_not_ready" }, 400);
    const formLink = `${APP_URL}/collect/${form.slug}`;

    const recipients = cleanRecipients(campaign.recipients);
    const template = typeof campaign.message_template === "string" ? campaign.message_template.trim() : "";

    const { data: plan } = await admin.rpc("get_user_plan", { p_user_id: ownerId });
    const { count: usedThisMonth, error: usageError } = await admin
      .from("campaign_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .gte("created_at", monthStartIso());
    if (usageError) {
      console.error("start-campaign usage error:", usageError);
      return json({ error: "start_failed" }, 500);
    }

    const problem = checkCampaign({
      recipients,
      template,
      formLink,
      plan: typeof plan === "string" ? plan : null,
      usedThisMonth: usedThisMonth ?? 0,
      countryCodes: allowedCountryCodes(Deno.env.get("SMS_ALLOWED_COUNTRY_CODES")),
    });
    if (problem) {
      const status = problem.error === "sms_not_in_plan" || problem.error === "sms_allowance_exceeded" ? 403 : 400;
      return json(problem, status);
    }

    // Claim the draft first, so two clicks can never queue the list twice.
    const { data: claimed, error: claimError } = await admin
      .from("campaigns")
      .update({ status: "paused", total_recipients: recipients.length })
      .eq("id", campaign.id)
      .eq("status", "draft")
      .select("id");
    if (claimError || !claimed || claimed.length === 0) return json({ error: "campaign_already_started" }, 409);

    const jobs = recipients.map((person) => ({
      campaign_id: campaign.id,
      user_id: ownerId,
      phone: person.phone,
      first_name: person.first_name || null,
      message: renderMessage(template, person.first_name, formLink),
    }));

    for (let start = 0; start < jobs.length; start += 500) {
      const { error: insertError } = await admin.from("campaign_jobs").insert(jobs.slice(start, start + 500));
      if (insertError) {
        console.error("start-campaign queue error:", insertError);
        // Nothing has been sent yet. Clear the queue and hand the draft back.
        await admin.from("campaign_jobs").delete().eq("campaign_id", campaign.id).eq("status", "pending");
        await admin.from("campaigns").update({ status: "draft" }).eq("id", campaign.id);
        return json({ error: "start_failed" }, 500);
      }
    }

    // Only now may the queue be picked up: the worker sends for "active" campaigns alone.
    const status = scheduledAt ? "scheduled" : "active";
    const { error: startError } = await admin
      .from("campaigns")
      .update({ status, scheduled_at: scheduledAt })
      .eq("id", campaign.id);
    if (startError) {
      console.error("start-campaign start error:", startError);
      await admin.from("campaign_jobs").delete().eq("campaign_id", campaign.id).eq("status", "pending");
      await admin.from("campaigns").update({ status: "draft" }).eq("id", campaign.id);
      return json({ error: "start_failed" }, 500);
    }

    return json({ ok: true, queued: jobs.length, status, scheduled_at: scheduledAt });
  } catch (error) {
    console.error("start-campaign error:", error);
    return json({ error: "start_failed" }, 500);
  }
});
