import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PLAN_RANK, type PlanId } from "@/lib/billing-plans";

interface SubscriptionRow {
  plan: PlanId;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SubscriptionRow | null> => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("subscriptions")
        .select("plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end, trial_end")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("useSubscription error:", error);
        return null;
      }
      return data as SubscriptionRow | null;
    },
  });

  const plan: PlanId = (data?.plan ?? "free") as PlanId;
  const isActive = data?.status === "active" || data?.status === "trialing";

  return {
    plan,
    status: data?.status ?? "inactive",
    isActive,
    isFree: plan === "free" || !isActive,
    isStarter: isActive && plan === "starter",
    isPro: isActive && plan === "pro",
    isScale: isActive && plan === "scale",
    hasStripeCustomer: !!data?.stripe_customer_id,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    trialEnd: data?.trial_end ?? null,
    isLoading,
    meetsPlan: (required: PlanId) => PLAN_RANK[plan] >= PLAN_RANK[required] && isActive,
  };
};