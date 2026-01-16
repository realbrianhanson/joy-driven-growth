import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify Stripe webhook signature
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const v1Signature = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !v1Signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSignature === v1Signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const signature = req.headers.get("stripe-signature");
    const payload = await req.text();

    // Verify webhook signature if secret is configured
    if (STRIPE_WEBHOOK_SECRET && signature) {
      const isValid = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const event = JSON.parse(payload);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Stripe webhook received:", event.type);

    switch (event.type) {
      case "checkout.session.completed":
      case "payment_intent.succeeded": {
        const session = event.data.object;
        const amount = (session.amount_total || session.amount || 0) / 100;
        const customerEmail = session.customer_email || session.receipt_email;
        const metadata = session.metadata || {};

        // Check for testimonial/widget attribution
        const testimonialId = metadata.testimonial_id;
        const widgetId = metadata.widget_id;
        const userId = metadata.user_id;

        if (userId && amount > 0) {
          // Create revenue event
          await supabase.from("revenue_events").insert({
            user_id: userId,
            testimonial_id: testimonialId || null,
            widget_id: widgetId || null,
            amount,
            currency: session.currency?.toUpperCase() || "USD",
            source: "stripe",
            customer_email: customerEmail,
            stripe_payment_id: session.payment_intent || session.id,
            metadata: {
              event_type: event.type,
              session_id: session.id,
            },
          });

          // Update testimonial revenue if attributed
          if (testimonialId) {
            const { data: testimonial } = await supabase
              .from("testimonials")
              .select("revenue_attributed")
              .eq("id", testimonialId)
              .single();

            if (testimonial) {
              await supabase
                .from("testimonials")
                .update({
                  revenue_attributed: (testimonial.revenue_attributed || 0) + amount,
                })
                .eq("id", testimonialId);
            }
          }

          // Update widget revenue if attributed
          if (widgetId) {
            const { data: widget } = await supabase
              .from("widgets")
              .select("revenue_attributed")
              .eq("id", widgetId)
              .single();

            if (widget) {
              await supabase
                .from("widgets")
                .update({
                  revenue_attributed: (widget.revenue_attributed || 0) + amount,
                })
                .eq("id", widgetId);
            }
          }

          // Log activity
          await supabase.from("activity_log").insert({
            user_id: userId,
            action: "revenue_attributed",
            entity_type: testimonialId ? "testimonial" : widgetId ? "widget" : "payment",
            entity_id: testimonialId || widgetId,
            metadata: {
              amount,
              currency: session.currency?.toUpperCase() || "USD",
              customer_email: customerEmail,
            },
          });

          console.log(`Revenue attributed: $${amount} to user ${userId}`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("Subscription event:", subscription.id, subscription.status);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("stripe-webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
