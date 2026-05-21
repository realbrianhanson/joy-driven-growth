import { describe, it, expect } from "vitest";
import {
  timingSafeEqual,
  planFromPriceId,
  verifyStripeSignature,
  amountFromSession,
  signStripePayload,
} from "../stripe-utils";

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });
  it("returns false for different strings of same length", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });
  it("returns false for different lengths", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("planFromPriceId", () => {
  const map = { price_starter_123: "starter" as const, price_pro_456: "pro" as const };
  it("maps starter price id", () => {
    expect(planFromPriceId("price_starter_123", map)).toBe("starter");
  });
  it("maps pro price id", () => {
    expect(planFromPriceId("price_pro_456", map)).toBe("pro");
  });
  it("returns free for null", () => {
    expect(planFromPriceId(null, map)).toBe("free");
  });
  it("returns free for undefined", () => {
    expect(planFromPriceId(undefined, map)).toBe("free");
  });
  it("returns free for unknown id", () => {
    expect(planFromPriceId("price_unknown", map)).toBe("free");
  });
  it("returns free when map is empty", () => {
    expect(planFromPriceId("price_starter_123")).toBe("free");
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });

  it("verifies a correctly signed payload", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await signStripePayload(payload, secret, ts);
    expect(await verifyStripeSignature(payload, sig, secret, ts)).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await signStripePayload(payload, secret, ts);
    expect(await verifyStripeSignature(payload + "x", sig, secret, ts)).toBe(false);
  });

  it("rejects with wrong secret", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await signStripePayload(payload, secret, ts);
    expect(await verifyStripeSignature(payload, sig, "whsec_wrong", ts)).toBe(false);
  });

  it("rejects timestamp older than 300s", async () => {
    const ts = Math.floor(Date.now() / 1000) - 400;
    const sig = await signStripePayload(payload, secret, ts);
    expect(await verifyStripeSignature(payload, sig, secret, ts + 400)).toBe(false);
  });

  it("returns false for header missing t=", async () => {
    expect(await verifyStripeSignature(payload, "v1=deadbeef", secret)).toBe(false);
  });

  it("returns false for header missing v1=", async () => {
    expect(await verifyStripeSignature(payload, "t=12345", secret)).toBe(false);
  });

  it("returns false for malformed timestamp", async () => {
    expect(await verifyStripeSignature(payload, "t=notanumber,v1=abc", secret)).toBe(false);
  });
});

describe("amountFromSession", () => {
  it("converts amount_total cents to dollars", () => {
    expect(amountFromSession({ amount_total: 12345 })).toBe(123.45);
  });
  it("falls back to amount when amount_total missing", () => {
    expect(amountFromSession({ amount: 5000 })).toBe(50);
  });
  it("prefers amount_total over amount", () => {
    expect(amountFromSession({ amount_total: 1000, amount: 2000 })).toBe(10);
  });
  it("returns 0 for empty object", () => {
    expect(amountFromSession({})).toBe(0);
  });
  it("returns 0 for null", () => {
    expect(amountFromSession(null)).toBe(0);
  });
  it("returns 0 for null amount fields", () => {
    expect(amountFromSession({ amount_total: null, amount: null })).toBe(0);
  });
});