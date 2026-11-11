// Stripe price IDs. Replace these placeholders with the real IDs from your Stripe
// dashboard after you create the products. See "Turn on billing" in the README.
export const STRIPE_PRICE_IDS = {
  starter: "price_REPLACE_ME_STARTER",
  pro: "price_REPLACE_ME_PRO",
} as const;

export type PlanId = "free" | "starter" | "pro" | "scale";

export const PLANS: Record<PlanId, {
  name: string;
  price: string;
  period: string;
  priceId: string | null;
  features: string[];
  popular?: boolean;
}> = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    priceId: null,
    features: ["25 testimonials", "1 widget", "Shareable collection link", "Guided question templates"],
  },
  starter: {
    name: "Starter",
    price: "$29",
    period: "/mo",
    priceId: STRIPE_PRICE_IDS.starter,
    features: ["Unlimited testimonials", "Video + audio + text", "100 SMS/mo", "5 widgets", "AI interview mode"],
  },
  pro: {
    name: "Pro",
    price: "$79",
    period: "/mo",
    priceId: STRIPE_PRICE_IDS.pro,
    popular: true,
    features: ["Everything in Starter", "500 SMS/mo", "Sales results tracking", "AI content generator"],
  },
  scale: {
    name: "Scale",
    price: "Custom",
    period: "",
    priceId: null,
    features: ["Everything in Pro", "Unlimited SMS", "Priority support", "Dedicated success manager"],
  },
};

export const PLAN_RANK: Record<PlanId, number> = { free: 0, starter: 1, pro: 2, scale: 3 };

/**
 * Texts each plan may send in a calendar month. null means no monthly cap.
 * The server enforces these numbers in supabase/functions/_shared/sms.ts.
 * A test keeps the two lists the same.
 */
export const SMS_MONTHLY_ALLOWANCE: Record<PlanId, number | null> = { free: 0, starter: 100, pro: 500, scale: null };

export const meetsPlan = (current: PlanId, required: PlanId) => PLAN_RANK[current] >= PLAN_RANK[required];