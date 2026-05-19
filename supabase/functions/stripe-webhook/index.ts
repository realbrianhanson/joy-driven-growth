import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

  // Replay protection: reject if timestamp is more than 300s old
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

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

  return timingSafeEqual(expectedSignature, v1Signature);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signature = req.headers.get("stripe-signature");
    const payload = await req.text();

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

        const testimonialId = metadata.testimonial_id;
        const widgetId = metadata.widget_id;
        const userId = metadata.user_id;

        if (userId && amount > 0) {
          const paymentId = session.payment_intent || session.id;

          // Idempotency check
          const { data: existing } = await supabase
            .from("revenue_events")
            .select("id")
            .eq("stripe_payment_id", paymentId)
            .maybeSingle();
          if (existing) {
            console.log("Duplicate webhook for", paymentId, "— skipping");
            return new Response(
              JSON.stringify({ received: true, duplicate: true }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          await supabase.from("revenue_events").insert({
            user_id: userId,
            testimonial_id: testimonialId || null,
            widget_id: widgetId || null,
            amount,
            currency: session.currency?.toUpperCase() || "USD",
            source: "stripe",
            customer_email: customerEmail,
            stripe_payment_id: paymentId,
            metadata: {
              event_type: event.type,
              session_id: session.id,
            },
          });

          if (testimonialId) {
            await supabase.rpc("increment_testimonial_revenue", {
              p_testimonial_id: testimonialId,
              p_amount: amount,
            });
          }
          if (widgetId) {
            await supabase.rpc("increment_widget_revenue", {
              p_widget_id: widgetId,
              p_amount: amount,
            });
          }

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
