import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

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

    const systemPrompt = `You are a friendly AI interviewer collecting a testimonial. Have a natural conversation to extract a great testimonial.

Your conversation flow:
1. Ask about their overall experience
2. Probe for specific results or outcomes
3. Ask about favorite features
4. Get a recommendation quote

After 4-5 exchanges, compile their responses into a polished testimonial. When ready to complete, respond with JSON: {"complete": true, "testimonial": "compiled testimonial here"}

Keep responses warm, brief (1-2 sentences), and conversational. Use emojis sparingly.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
        return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
