// Pure, framework-free helpers shared between the stripe-webhook edge
// function and the vitest test suite. No Deno-specific APIs here.

export type Plan = "free" | "starter" | "pro" | "scale";

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function planFromPriceId(
  priceId: string | null | undefined,
  priceMap: Record<string, "starter" | "pro"> = {},
): Plan {
  if (!priceId) return "free";
  return priceMap[priceId] ?? "free";
}

export async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const encoder = new TextEncoder();
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const v1Signature = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !v1Signature) return false;

  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(nowSeconds - ts) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload),
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expectedSignature, v1Signature);
}

/** Derive a dollar amount from a Stripe session/payment object.
 *  Uses `amount_total` first, then `amount`, divided by 100. */
export function amountFromSession(session: { amount_total?: number | null; amount?: number | null } | null | undefined): number {
  if (!session) return 0;
  const cents = session.amount_total ?? session.amount ?? 0;
  return (Number(cents) || 0) / 100;
}

/** Helper to sign a payload for tests. */
export async function signStripePayload(payload: string, secret: string, timestamp: number): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const hex = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${hex}`;
}