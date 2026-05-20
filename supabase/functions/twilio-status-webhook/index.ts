import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-twilio-signature",
};

async function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): Promise<boolean> {
  const sortedKeys = Object.keys(params).sort();
  const data = url + sortedKeys.map((k) => k + params[k]).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(authToken), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

const TERMINAL_STATUSES = new Set(["delivered", "failed", "undelivered"]);
const FAILURE_STATUSES = new Set(["failed", "undelivered"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!TWILIO_AUTH_TOKEN) {
      console.error("TWILIO_AUTH_TOKEN missing");
      return new Response("Twilio not configured", { status: 503 });
    }

    const signature = req.headers.get("x-twilio-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const rawBody = await req.text();
    const params: Record<string, string> = {};
    new URLSearchParams(rawBody).forEach((v, k) => { params[k] = v; });

    const fullUrl = req.url;
    const isValid = await verifyTwilioSignature(fullUrl, params, signature, TWILIO_AUTH_TOKEN);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const messageSid = params.MessageSid;
    const status = params.MessageStatus;
    const errorCode = params.ErrorCode;
    if (!messageSid || !status) {
      return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const update: Record<string, unknown> = { status };
    if (status === "delivered") update.delivered_at = new Date().toISOString();
    if (FAILURE_STATUSES.has(status) && errorCode) update.error_code = errorCode;

    const { data: row } = await supabase
      .from("campaign_jobs")
      .update(update)
      .eq("twilio_message_sid", messageSid)
      .select("campaign_id")
      .maybeSingle();

    if (row?.campaign_id && TERMINAL_STATUSES.has(status)) {
      await supabase.rpc("refresh_campaign_counts", { p_campaign_id: row.campaign_id });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("twilio-status-webhook error:", error);
    return new Response("Error", { status: 500 });
  }
});