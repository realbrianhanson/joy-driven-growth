import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { mapDashboardStats, type DashboardStats } from "./dashboard-mapping";

/** Sales totals and top earners for the workspace, from one database function. */
export function useDashboard() {
  const { workspaceOwnerId } = useWorkspace();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-stats", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async (): Promise<DashboardStats | null> => {
      const { data, error } = await supabase.rpc("get_dashboard_stats", { p_owner_id: workspaceOwnerId! });
      if (error) throw error;
      return (data as unknown as DashboardStats) ?? null;
    },
  });

  const computed = useMemo(() => mapDashboardStats(stats ?? null), [stats]);

  return { ...computed, isLoading, error, refetch };
}
