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
      user_id,
      testimonial_id,
      widget_id,
      amount,
      currency = "USD",
      source = "manual",
      customer_email,
      metadata = {}
    } = await req.json();

    if (!user_id || !amount) {
      return new Response(
        JSON.stringify({ error: "user_id and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create revenue event
    const { data: revenueEvent, error: insertError } = await supabase
      .from("revenue_events")
      .insert({
        user_id,
        testimonial_id,
        widget_id,
        amount,
        currency,
        source,
        customer_email,
        metadata,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    // Update testimonial revenue if attributed
    if (testimonial_id) {
      const { data: testimonial } = await supabase
        .from("testimonials")
        .select("revenue_attributed")
        .eq("id", testimonial_id)
        .single();

      if (testimonial) {
        await supabase
          .from("testimonials")
          .update({
            revenue_attributed: (testimonial.revenue_attributed || 0) + amount,
          })
          .eq("id", testimonial_id);
      }
    }

    // Update widget revenue if attributed
    if (widget_id) {
      const { data: widget } = await supabase
        .from("widgets")
        .select("revenue_attributed")
        .eq("id", widget_id)
        .single();

      if (widget) {
        await supabase
          .from("widgets")
          .update({
            revenue_attributed: (widget.revenue_attributed || 0) + amount,
          })
          .eq("id", widget_id);
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id,
      action: "revenue_tracked",
      entity_type: testimonial_id ? "testimonial" : widget_id ? "widget" : "manual",
      entity_id: testimonial_id || widget_id,
      metadata: {
        amount,
        currency,
        source,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        revenue_event: revenueEvent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("track-revenue error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
