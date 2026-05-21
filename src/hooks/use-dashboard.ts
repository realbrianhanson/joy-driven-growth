import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { mapDashboardStats, type DashboardStats } from "./dashboard-mapping";

export function useDashboard() {
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const userId = workspaceOwnerId;

  const queryKey = useMemo(() => ["dashboard-stats", userId] as const, [userId]);

  const { data: stats, isLoading } = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async (): Promise<DashboardStats | null> => {
      const { data, error } = await supabase.rpc("get_dashboard_stats", { p_owner_id: userId! });
      if (error) throw error;
      return (data as unknown as DashboardStats) ?? null;
    },
  });

  // Realtime: invalidate the single stats query on any relevant insert.
  useEffect(() => {
    if (!userId) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey });
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "testimonials", filter: `user_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "revenue_events", filter: `user_id=eq.${userId}` }, invalidate)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log", filter: `user_id=eq.${userId}` }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, queryKey]);

  const computed = useMemo(() => mapDashboardStats(stats ?? null), [stats]);

  return { ...computed, isLoading };
}
