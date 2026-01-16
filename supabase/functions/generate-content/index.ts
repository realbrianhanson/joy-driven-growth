import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

const getSystemPrompt = (contentType: string): string => {
  const prompts: Record<string, string> = {
    twitter: `You are an expert social media copywriter who creates viral Twitter threads. 
Create engaging Twitter threads that:
- Start with a strong hook that grabs attention
- Use emojis strategically but not excessively
- Include numbered tweets for easy reading
- End with a call to action
- Keep each tweet under 280 characters
- Use storytelling to make testimonials relatable`,

    linkedin: `You are a LinkedIn content strategist who writes professional, engaging posts.
Create LinkedIn posts that:
- Start with a compelling opening line
- Tell a story that resonates with professionals
- Use proper formatting with line breaks for readability
- Include relevant hashtags at the end
- Maintain a professional yet personable tone
- End with a thought-provoking question or CTA`,

    email: `You are an email marketing expert who writes high-converting sales sequences.
Create email snippets that:
- Have attention-grabbing subject line suggestions
- Use personalization placeholders like {first_name}
- Include social proof naturally
- Have clear CTAs
- Keep the tone warm and professional
- Be concise and scannable`,

    casestudy: `You are a B2B content writer who creates compelling mini case studies.
Create case studies that:
- Follow the Challenge → Solution → Results format
- Include specific metrics and outcomes
- Use direct quotes from the testimonial
- Highlight the transformation
- Be concise but impactful
- Include a compelling headline`,

    quote: `You are a brand copywriter who crafts shareable quote graphics.
Create quote content that:
- Extract the most impactful quote from the testimonial
- Keep it short and memorable (under 20 words ideally)
- Focus on results and emotions
- Include attribution with name and company
- Make it visually balanced for graphics`,
  };

  return prompts[contentType] || prompts.twitter;
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { testimonials, contentType, contentTypeInfo }: ContentRequest = await req.json();

    if (!testimonials || testimonials.length === 0) {
      throw new Error('No testimonials provided');
    }

    if (!contentType) {
      throw new Error('Content type is required');
    }

    const systemPrompt = getSystemPrompt(contentType);
    const userPrompt = getUserPrompt(testimonials, contentType, contentTypeInfo);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 1000,
        temperature: 0.7,
      }),
    });

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

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated');
    }

    return new Response(
      JSON.stringify({ content: generatedContent }),
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
