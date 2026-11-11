import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLAN_RANK, type PlanId } from "@/lib/billing-plans";

/**
 * The active plan for the current workspace. Team members get the plan of the
 * account they work in, through the get_user_plan database function.
 */
export const usePlan = () => {
  const { workspaceOwnerId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-plan", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async (): Promise<PlanId> => {
      const { data, error } = await supabase.rpc("get_user_plan", { p_user_id: workspaceOwnerId! });
      if (error) throw error;
      return ((data as string) || "free") as PlanId;
    },
  });

  const plan: PlanId = data ?? "free";

  return {
    plan,
    isLoading,
    meetsPlan: (required: PlanId) => PLAN_RANK[plan] >= PLAN_RANK[required],
    isPro: plan === "pro" || plan === "scale",
    isFreeOrStarter: plan === "free" || plan === "starter",
  };
};
