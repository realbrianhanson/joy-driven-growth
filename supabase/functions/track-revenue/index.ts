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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const {
      testimonial_id,
      widget_id,
      amount,
      currency = "USD",
      source = "manual",
      customer_email,
      metadata = {},
    } = body;

    if (typeof amount !== "number" || !(amount > 0)) {
      return new Response(
        JSON.stringify({ error: "amount must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    if (testimonial_id) {
      const { data: t } = await supabase
        .from("testimonials")
        .select("id")
        .eq("id", testimonial_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!t) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (widget_id) {
      const { data: w } = await supabase
        .from("widgets")
        .select("id")
        .eq("id", widget_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!w) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data: revenueEvent, error: insertError } = await supabase
      .from("revenue_events")
      .insert({
        user_id: userId,
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

    if (testimonial_id) {
      await supabase.rpc("increment_testimonial_revenue", {
        p_testimonial_id: testimonial_id,
        p_amount: amount,
      });
    }

    if (widget_id) {
      await supabase.rpc("increment_widget_revenue", {
        p_widget_id: widget_id,
        p_amount: amount,
      });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
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
