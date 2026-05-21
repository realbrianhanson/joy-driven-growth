import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim();
  return ip || "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, form_context, form_slug } = await req.json();

    if (!form_slug || typeof form_slug !== "string") {
      return new Response(
        JSON.stringify({ error: "form_slug required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the form exists and is published.
    const { data: form, error: formErr } = await supabase
      .from("forms")
      .select("id, is_published")
      .eq("slug", form_slug)
      .maybeSingle();
    if (formErr || !form || !form.is_published) {
      return new Response(
        JSON.stringify({ error: "form_not_found_or_unpublished" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // IP-based rate limit: 10 requests / 60s.
    const ip = getClientIp(req);
    const { data: allowed, error: rlErr } = await supabase.rpc("check_rate_limit", {
      p_key: `ai-interview:${ip}`,
      p_max: 10,
      p_window_seconds: 60,
    });
    if (rlErr) console.error("rate_limit error", rlErr);
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "rate_limited" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(messages) || messages.length > 30) {
      return new Response(
        JSON.stringify({ error: "messages must be an array of <= 30 entries" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const totalChars = messages.reduce(
      (sum: number, m: { content?: string }) => sum + (typeof m?.content === "string" ? m.content.length : 0),
      0
    );
    if (totalChars > 50000) {
      return new Response(
        JSON.stringify({ error: "Total message content exceeds 50000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contextBlock = typeof form_context === "string" && form_context.trim().length > 0
      ? `\n\nContext about what the customer used:\n"""${String(form_context).slice(0, 2000)}"""\n`
      : "";

    const systemPrompt = `You are a warm, sharp testimonial interviewer. Your job is to pull HONEST, context-rich answers from a real customer so they can be developed into a great written testimonial. You are not a sales person — you are a careful listener.${contextBlock}

Walk this arc across the conversation:
1. The situation BEFORE — what was going on, what were they struggling with?
2. Any hesitation they had before starting.
3. What specifically changed / what results — gently push for concrete specifics: numbers, timeframes, before-vs-after. If they don't have a number, that's completely fine; move on.
4. How that change feels for them day to day.
5. What they'd say to someone in the position they were in before.

Rules:
- Keep each message short (1-2 sentences), warm, conversational. Emojis sparingly.
- If an answer is vague ("it was great"), ask ONE warm follow-up to get specificity ("Love that — can you give me a concrete example?"). Never more than one follow-up per topic. Never interrogate.
- NEVER pressure the customer to invent, exaggerate, or say anything they didn't mean. The honesty bar is absolute. If they're lukewarm, capture that honestly.
- Do not put words in their mouth. Reflect back, don't lead.

After the arc is covered (~5-7 exchanges) OR when the user signals they're done, compile and respond with JSON ONLY (no markdown fences, no preamble, no commentary):
{"complete": true, "testimonial": "<full polished copy-paste testimonial, first person, the customer's authentic voice, well-structured paragraph(s) that read naturally>", "pull_quote": "<single strongest sentence, max 160 chars>", "one_liner": "<punchy version, max 100 chars>"}

The compiled testimonial MUST be faithful to what the customer actually said. Develop and structure their words; never fabricate facts, numbers, names, or sentiment. If they were thin or lukewarm, the testimonial stays thin or lukewarm — just cleaned up and readable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Check if interview is complete
    if (content.includes('"complete": true') || content.includes('"complete":true')) {
      try {
        const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({
          complete: true,
          testimonial: parsed.testimonial ?? "",
          pull_quote: parsed.pull_quote ?? null,
          one_liner: parsed.one_liner ?? null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        // Not valid JSON, continue conversation
      }
    }

    return new Response(JSON.stringify({ response: content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("ai-interview error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
