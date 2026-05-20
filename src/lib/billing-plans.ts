// Stripe price IDs. Replace these placeholders with real IDs from your Stripe dashboard
// once you've created the products. See README → "Enabling billing".
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
    features: ["25 testimonials", "1 widget", "Email collection", "Basic forms"],
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
    features: ["Everything in Starter", "Revenue attribution", "Smart review routing", "AI content generator", "Advanced analytics"],
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

export const meetsPlan = (current: PlanId, required: PlanId) => PLAN_RANK[current] >= PLAN_RANK[required];