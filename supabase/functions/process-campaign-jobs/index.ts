import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const internalKey = req.headers.get("x-internal-key");
    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey!);

    let workerKey = Deno.env.get("INTERNAL_WORKER_KEY");
    if (!workerKey) {
      const { data: settingRow } = await supabaseAdmin
        .from("app_settings")
        .select("value")
        .eq("key", "internal_worker_key")
        .maybeSingle();
      workerKey = (settingRow as { value?: string } | null)?.value ?? undefined;
    }

    const hasServiceAuth = authHeader === `Bearer ${serviceKey}`;
    const hasInternalKey = workerKey && internalKey === workerKey;
    if (!hasInternalKey && !hasServiceAuth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(JSON.stringify({ error: "Twilio not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = supabaseAdmin;

    const { data: jobs, error: claimError } = await supabase.rpc("claim_pending_jobs", { p_limit: 50 });
    if (claimError) {
      console.error("claim_pending_jobs error:", claimError);
      throw new Error(claimError.message);
    }
    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusCallbackUrl = `${supabaseUrl}/functions/v1/twilio-status-webhook`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const affectedCampaigns = new Set<string>();
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs as Array<{ id: string; campaign_id: string; phone: string; message: string }>) {
      affectedCampaigns.add(job.campaign_id);
      try {
        const form = new URLSearchParams();
        form.append("To", job.phone);
        form.append("From", TWILIO_PHONE_NUMBER);
        form.append("Body", job.message);
        form.append("StatusCallback", statusCallbackUrl);

        const resp = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        });
        const result = await resp.json();
        if (!resp.ok) {
          await supabase.from("campaign_jobs").update({
            status: "failed",
            error_code: String(result.code ?? resp.status),
            error_message: result.message ?? "Twilio request failed",
          }).eq("id", job.id);
          failed++;
        } else {
          await supabase.from("campaign_jobs").update({
            status: "sent",
            twilio_message_sid: result.sid,
          }).eq("id", job.id);
          succeeded++;
        }
      } catch (err) {
        console.error("Job send error:", job.id, err);
        await supabase.from("campaign_jobs").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        }).eq("id", job.id);
        failed++;
      }
    }

    for (const campaignId of affectedCampaigns) {
      await supabase.rpc("refresh_campaign_counts", { p_campaign_id: campaignId });
    }

    return new Response(JSON.stringify({ processed: jobs.length, succeeded, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-campaign-jobs error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});