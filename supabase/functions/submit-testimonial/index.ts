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
    const { 
      form_slug,
      content,
      rating,
      author_name,
      author_email,
      author_title,
      author_company,
      type = "text",
      video_url,
      audio_url,
      custom_fields = {}
    } = await req.json();

    if (!form_slug || !author_name) {
      return new Response(
        JSON.stringify({ error: "form_slug and author_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get form by slug
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, user_id, name")
      .eq("slug", form_slug)
      .eq("is_published", true)
      .single();

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: "Form not found or not published" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Analyze sentiment using AI
    let sentiment = "positive";
    let aiSummary = null;

    if (content) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `Analyze this testimonial and respond with JSON: {"sentiment": "positive"|"neutral"|"negative", "summary": "one sentence summary"}`,
                },
                { role: "user", content },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiContent = aiData.choices?.[0]?.message?.content || "";
            try {
              const parsed = JSON.parse(aiContent.replace(/```json\n?|\n?```/g, "").trim());
              sentiment = parsed.sentiment || "positive";
              aiSummary = parsed.summary;
            } catch {
              // Keep defaults
            }
          }
        } catch (aiError) {
          console.error("AI analysis error:", aiError);
        }
      }
    }

    // Create testimonial
    const { data: testimonial, error: insertError } = await supabase
      .from("testimonials")
      .insert({
        user_id: form.user_id,
        form_id: form.id,
        type,
        status: "pending",
        content,
        rating,
        author_name,
        author_email,
        author_title,
        author_company,
        video_url,
        audio_url,
        sentiment,
        ai_summary: aiSummary,
        source: "form",
        custom_fields,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Increment form submission count
    await supabase.rpc("increment_form_submissions", { form_id: form.id });

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: form.user_id,
      action: "testimonial_submitted",
      entity_type: "testimonial",
      entity_id: testimonial.id,
      metadata: {
        form_name: form.name,
        author_name,
        rating,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        testimonial_id: testimonial.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("submit-testimonial error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
