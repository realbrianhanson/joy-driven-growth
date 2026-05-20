import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Testimonial {
  id: string;
  name: string;
  company: string;
  content: string;
  rating: number;
  revenue?: number;
}

interface ContentRequest {
  testimonials: Testimonial[];
  contentType: string;
  contentTypeInfo: {
    title: string;
    subtitle: string;
  };
}

const JSON_ONLY = `\n\nRespond with ONLY valid JSON matching the exact schema below. No markdown fences, no commentary, no preamble. Just the JSON object.`;

const getSystemPrompt = (contentType: string): string => {
  const prompts: Record<string, string> = {
    twitter: `You are an expert social media copywriter who creates viral Twitter threads.
Write a thread of 5-8 tweets. First tweet must be a strong scroll-stopping hook. Each tweet under 270 characters. Last tweet is a clear CTA. Use emojis sparingly. Storytelling tone.
Schema: { "tweets": string[], "hashtags": string[] }${JSON_ONLY}`,

    linkedin: `You are a LinkedIn content strategist who writes professional, engaging posts.
Write a hook (one compelling first line), a body with proper \\n line breaks for readability, 3-5 hashtags, and a closing CTA or question.
Schema: { "hook": string, "body": string, "hashtags": string[], "cta": string }${JSON_ONLY}`,

    email: `You are an email marketing expert who writes high-converting sales sequences.
Provide 3 subject line options, a preheader, an email body using {first_name} placeholder and warm professional tone, and a button label.
Schema: { "subjectLines": string[], "preheader": string, "body": string, "cta": string }${JSON_ONLY}`,

    casestudy: `You are a B2B content writer creating compelling mini case studies.
Use Challenge → Solution → Results format with a strong headline and a pull quote drawn verbatim from the testimonial. Only include metrics that are real or directly derivable from the input — never invent numbers. If a testimonial has revenue attributed, include it as a metric.
Schema: { "headline": string, "challenge": string, "solution": string, "results": string, "metrics": { "label": string, "value": string }[], "pullQuote": string }${JSON_ONLY}`,

    quote: `You are a brand copywriter crafting shareable quote graphics. Pull the single punchiest quote (under 20 words) from the testimonial.
Schema: { "quote": string, "author": string, "company": string, "rating": number }${JSON_ONLY}`,
  };

  return prompts[contentType] || prompts.twitter;
};

const parseJson = (raw: string): unknown | null => {
  let s = raw.trim();
  // Strip code fences defensively
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Find outermost braces
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  try { return JSON.parse(s); } catch { return null; }
};

const getUserPrompt = (testimonials: Testimonial[], contentType: string, contentTypeInfo: any): string => {
  const testimonialSummary = testimonials.map(t => 
    `- ${t.name} from ${t.company} (${t.rating} stars${t.revenue ? `, $${t.revenue} attributed` : ''}): "${t.content}"`
  ).join('\n');

  return `Based on the following customer testimonial(s), create a ${contentTypeInfo.title} (${contentTypeInfo.subtitle}):

${testimonialSummary}

Please create compelling content that highlights the customer's experience and results. Make it authentic and engaging.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { testimonials, contentType, contentTypeInfo }: ContentRequest = await req.json();

    if (!testimonials || testimonials.length === 0) {
      throw new Error('No testimonials provided');
    }

    if (!Array.isArray(testimonials) || testimonials.length > 10) {
      return new Response(
        JSON.stringify({ error: 'testimonials must be an array of <= 10 entries' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contentType) {
      throw new Error('Content type is required');
    }

    const systemPrompt = getSystemPrompt(contentType);
    const userPrompt = getUserPrompt(testimonials, contentType, contentTypeInfo);

    const callModel = async () => {
      const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-pro-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_completion_tokens: 2000,
          temperature: 0.7,
        }),
      });
      return r;
    };

    let response = await callModel();

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate content');
    }

    let data = await response.json();
    let raw = data.choices?.[0]?.message?.content;
    let parsed = raw ? parseJson(raw) : null;

    if (!parsed) {
      // Retry once
      const retry = await callModel();
      if (retry.ok) {
        const d2 = await retry.json();
        const r2 = d2.choices?.[0]?.message?.content;
        parsed = r2 ? parseJson(r2) : null;
      }
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'generation_failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content: parsed, contentType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
