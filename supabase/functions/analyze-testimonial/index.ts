import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, name, company, rating } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!content) {
      throw new Error("Testimonial content is required");
    }

    const systemPrompt = `You are an expert testimonial analyst for a SaaS business. Analyze the following customer testimonial and extract insights.

You must respond with a JSON object containing:
- happinessScore: number from 1-10 indicating how happy the customer is
- conversionPower: "low", "medium", or "high" - how persuasive this testimonial would be for prospects
- themes: array of 3-5 short phrases (2-3 words each) representing what the customer loves
- goldenQuotes: array of 2-3 short, impactful quotes (exact phrases from the testimonial) that would work well in marketing
- summary: one paragraph summarizing the testimonial's key message
- bestUsedFor: array of 2-4 placements where this testimonial would work best (e.g., "Homepage", "Pricing Page", "Sales Deck", "Email", "Social Media")

Respond ONLY with valid JSON, no markdown or other text.`;

    const userPrompt = `Analyze this testimonial:

Customer: ${name} at ${company}
Rating: ${rating}/5 stars
Testimonial: "${content}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, "").trim();
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("Invalid AI response format");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-testimonial error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
