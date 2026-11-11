import { createClient } from "npm:@supabase/supabase-js@2";
import { clientIp, json, preflight } from "../_shared/http.ts";
import {
  cleanCustomFields,
  cleanEmail,
  cleanOptionalText,
  cleanRating,
  formSource,
  isAllowedMediaUrl,
} from "../_shared/submission.ts";

async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Saves a new testimonial as "pending" for the owner to review.
 *
 * Two callers reach it: a public collection form (identified by form_slug)
 * and the developer API (identified by an x-api-key header). Every field is
 * checked and trimmed here, because neither caller is trusted.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  let storageHost = "";
  try {
    storageHost = new URL(supabaseUrl).hostname;
  } catch {
    return json({ error: "server_misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 20 submissions per minute for each IP address.
  const { data: allowed, error: limitError } = await supabase.rpc("check_rate_limit", {
    p_key: `submit-testimonial:${clientIp(req)}`,
    p_max: 20,
    p_window_seconds: 60,
  });
  if (limitError) console.error("rate limit check failed", limitError);
  if (allowed === false) return json({ error: "rate_limited" }, 429);

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid_json" }, 400);
  const body = parsed as Record<string, unknown>;

  // Find the account this testimonial belongs to: by form, or by API key.
  let ownerUserId: string;
  let formId: string | null = null;
  let source = "api";
  let apiKeyRowId: string | null = null;

  const formSlug = body.form_slug ? String(body.form_slug).slice(0, 200) : null;
  const apiKey = req.headers.get("x-api-key") || "";

  if (formSlug) {
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, user_id, is_published")
      .eq("slug", formSlug)
      .maybeSingle();
    if (formError || !form) return json({ error: "form_not_found" }, 404);
    if (!form.is_published) return json({ error: "form_not_published" }, 403);
    ownerUserId = form.user_id;
    formId = form.id;
    source = formSource(body.source);
  } else {
    if (!apiKey || apiKey.length < 20) return json({ error: "missing_api_key_or_form_slug" }, 401);
    const { data: keyRow, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id, revoked_at")
      .eq("key_hash", await sha256Hex(apiKey))
      .maybeSingle();
    if (keyError || !keyRow) return json({ error: "invalid_api_key" }, 401);
    if (keyRow.revoked_at) return json({ error: "revoked_api_key" }, 401);
    ownerUserId = keyRow.user_id;
    apiKeyRowId = keyRow.id;
  }

  const authorName = (body.author_name ?? "").toString().trim();
  const content = (body.content ?? "").toString().trim();
  if (!authorName || authorName.length > 200) return json({ error: "invalid_author_name" }, 400);
  if (content.length > 4000) return json({ error: "invalid_content" }, 400);

  const type = body.type === "video" || body.type === "audio" ? body.type : "text";
  // A written testimonial needs words. A recording can stand alone.
  if (type === "text" && !content) return json({ error: "invalid_content" }, 400);
  if (type === "video" && !body.video_url) return json({ error: "missing_video_url" }, 400);
  if (type === "audio" && !body.audio_url) return json({ error: "missing_audio_url" }, 400);

  // Media must be a public file in this project's own storage.
  if (body.video_url != null && !isAllowedMediaUrl(body.video_url, storageHost)) {
    return json({ error: "invalid_video_url" }, 400);
  }
  if (body.audio_url != null && !isAllowedMediaUrl(body.audio_url, storageHost)) {
    return json({ error: "invalid_audio_url" }, 400);
  }
  if (body.author_avatar != null && !isAllowedMediaUrl(body.author_avatar, storageHost)) {
    return json({ error: "invalid_author_avatar" }, 400);
  }

  const customFields = cleanCustomFields(body.custom_fields);
  if (customFields === null) return json({ error: "invalid_custom_fields" }, 400);

  const displayPreference =
    body.display_preference === "first_initial" || body.display_preference === "anonymous" ? body.display_preference : "full";

  const consentGiven = body.consent_given === true;
  const consentText = body.consent_text != null ? String(body.consent_text) : null;
  if (consentText && consentText.length > 2000) return json({ error: "invalid_consent_text" }, 400);

  // The guided interview sends a draft that the customer has read and approved.
  const alreadyDeveloped = body.already_developed === true;
  const developedContent = typeof body.developed_content === "string" ? body.developed_content.slice(0, 8000) : null;
  const developedPullQuote = typeof body.developed_pull_quote === "string" ? body.developed_pull_quote.slice(0, 300) : null;
  const developedOneLiner = typeof body.developed_one_liner === "string" ? body.developed_one_liner.slice(0, 200) : null;

  const { data: inserted, error: insertError } = await supabase
    .from("testimonials")
    .insert({
      user_id: ownerUserId,
      form_id: formId,
      author_name: authorName,
      author_email: cleanEmail(body.author_email),
      author_title: cleanOptionalText(body.author_title, 200),
      author_company: cleanOptionalText(body.author_company, 200),
      content: content || null,
      rating: cleanRating(body.rating),
      type,
      video_url: body.video_url ? String(body.video_url) : null,
      audio_url: body.audio_url ? String(body.audio_url) : null,
      author_avatar: body.author_avatar ? String(body.author_avatar) : null,
      custom_fields: customFields,
      status: "pending",
      source,
      consent_given: consentGiven,
      consent_text: consentText,
      consent_timestamp: consentGiven ? new Date().toISOString() : null,
      display_preference: displayPreference,
      developed_content: alreadyDeveloped ? developedContent : null,
      developed_pull_quote: alreadyDeveloped ? developedPullQuote : null,
      developed_one_liner: alreadyDeveloped ? developedOneLiner : null,
      developed_at: alreadyDeveloped && developedContent ? new Date().toISOString() : null,
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("submit-testimonial insert error:", insertError);
    return json({ error: "insert_failed" }, 500);
  }

  if (apiKeyRowId) {
    await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", apiKeyRowId);
  }
  if (formId) {
    await supabase.rpc("increment_form_submissions", { form_id: formId });
  }

  return json({ ok: true, testimonial: inserted });
});
