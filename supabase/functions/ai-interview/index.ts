import { createClient } from "npm:@supabase/supabase-js@2";
import { aiErrorBody, chatCompletion, parseJsonObject } from "../_shared/ai.ts";
import { clientIp, json, preflight } from "../_shared/http.ts";
import { buildInterviewPrompt, interviewContext, readInterviewAnswer, sanitizeMessages } from "../_shared/interview.ts";

/**
 * Public endpoint behind the guided interview on a collection form.
 *
 * It takes the conversation so far and returns either the next question
 * ({ response }) or a finished draft ({ complete, testimonial, pull_quote,
 * one_liner }). The customer reads and approves the draft in the browser
 * before anything is saved.
 *
 * The form settings come from the database, never from the request, so a
 * caller cannot change the instructions or use a form that has the
 * interview turned off.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    let body: { messages?: unknown; form_slug?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const slug = typeof body.form_slug === "string" ? body.form_slug.trim() : "";
    if (!slug || slug.length > 200) return json({ error: "form_slug required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, is_published, custom_questions")
      .eq("slug", slug)
      .maybeSingle();

    const context = interviewContext(form?.custom_questions);
    if (formError || !form || !form.is_published || !context.enabled) {
      return json({ error: "form_not_found_or_unpublished" }, 403);
    }

    // 10 requests per minute for each IP address.
    const { data: allowed, error: limitError } = await supabase.rpc("check_rate_limit", {
      p_key: `ai-interview:${clientIp(req)}`,
      p_max: 10,
      p_window_seconds: 60,
    });
    if (limitError) console.error("rate limit check failed", limitError);
    if (allowed === false) return json({ error: "rate_limited" }, 429);

    const turns = sanitizeMessages(body.messages);
    if (!turns) return json({ error: "invalid_messages" }, 400);

    const { data: company } = await supabase.rpc("get_form_owner_company", { p_slug: slug });

    const { content } = await chatCompletion({
      tier: "fast",
      apiKey: Deno.env.get("LOVABLE_API_KEY"),
      override: Deno.env.get("AI_MODEL_FAST"),
      messages: [
        { role: "system", content: buildInterviewPrompt(typeof company === "string" ? company : null, context.prompt) },
        ...turns,
      ],
    });

    const result = readInterviewAnswer(content, parseJsonObject);
    if (result.complete) {
      return json({
        complete: true,
        testimonial: result.testimonial,
        pull_quote: result.pull_quote ?? null,
        one_liner: result.one_liner ?? null,
      });
    }
    return json({ response: result.response });
  } catch (error) {
    console.error("ai-interview error:", error);
    const { status, body } = aiErrorBody(error);
    return json(body, status);
  }
});
