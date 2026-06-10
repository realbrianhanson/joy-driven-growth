import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { PLAN_RANK, type PlanId } from "@/lib/billing-plans";

/**
 * Shared plan-gating hook. Resolves the active plan for the current workspace
 * (owner-scoped) via the get_user_plan SECURITY DEFINER RPC.
 *
 * In demo mode we return "pro" so showcase UI is unlocked without touching live data.
 */
export const usePlan = () => {
  const { workspaceOwnerId } = useWorkspace();
  const { isDemoMode } = useDemoMode();

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-plan", workspaceOwnerId, isDemoMode],
    enabled: !!workspaceOwnerId && !isDemoMode,
    queryFn: async (): Promise<PlanId> => {
      const { data, error } = await supabase.rpc("get_user_plan", { p_user_id: workspaceOwnerId! });
      if (error) throw error;
      return ((data as string) || "free") as PlanId;
    },
  });

  const plan: PlanId = isDemoMode ? "pro" : (data ?? "free");

  return {
    plan,
    isLoading: !isDemoMode && isLoading,
    meetsPlan: (required: PlanId) => PLAN_RANK[plan] >= PLAN_RANK[required],
    isPro: plan === "pro" || plan === "scale",
    isFreeOrStarter: plan === "free" || plan === "starter",
  };
};