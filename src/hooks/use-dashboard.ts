import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { Star, DollarSign, Megaphone, Puzzle, MessageSquare, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type RecentTestimonial = {
  id: string;
  author_name: string;
  author_company: string | null;
  content: string | null;
  rating: number | null;
  sentiment: string | null;
  revenue_attributed: number | string | null;
};

type TopDriverRow = {
  id: string;
  author_name: string;
  author_company: string | null;
  content: string | null;
  revenue_attributed: number | string | null;
};

type ActivityRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type DashboardStats = {
  total_testimonials: number;
  testimonials_this_month: number;
  testimonials_trend: number;
  this_week_count: number;
  avg_rating: number | string;
  approved_count: number;
  collection_rate: number | null;
  revenue_this_month: number | string;
  revenue_last_month: number | string;
  revenue_trend: number;
  weekly_revenue: number | string;
  widget_ctr: number | string;
  recent_5: RecentTestimonial[];
  top_drivers: TopDriverRow[];
  recent_activity: ActivityRow[];
  error?: string;
};

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

  const computed = useMemo(() => {
    const recent5 = (stats?.recent_5 ?? []).map((t) => ({
      id: t.id,
      name: t.author_name,
      company: t.author_company ?? "",
      quote: t.content ?? "",
      rating: t.rating ?? 0,
      sentiment: (t.sentiment === "positive" ? "happy" : t.sentiment === "negative" ? "sad" : "neutral") as "happy" | "neutral" | "sad",
      revenue: t.revenue_attributed != null ? Number(t.revenue_attributed) : undefined,
    }));

    const drivers = (stats?.top_drivers ?? []).map((d, i) => ({
      id: d.id,
      name: d.author_name,
      company: d.author_company ?? "",
      snippet: (d.content ?? "").slice(0, 60) + "...",
      placement: "—",
      views: 0,
      conversions: 0,
      revenue: Number(d.revenue_attributed ?? 0),
      rank: i + 1,
    }));

    const iconMap: Record<string, typeof Star> = {
      testimonial: Star,
      revenue: DollarSign,
      campaign: Megaphone,
      widget: Puzzle,
      form: FileText,
    };
    const typeMap: Record<string, "testimonial" | "revenue" | "campaign" | "widget" | "other"> = {
      testimonial: "testimonial",
      revenue: "revenue",
      campaign: "campaign",
      widget: "widget",
    };

    const activities = (stats?.recent_activity ?? []).map((a) => ({
      id: a.id,
      icon: iconMap[a.entity_type ?? ""] ?? MessageSquare,
      message: a.action,
      time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
      type: typeMap[a.entity_type ?? ""] ?? ("other" as const),
    }));

    const totalTestimonials = stats?.total_testimonials ?? 0;
    const avgRatingNum = Number(stats?.avg_rating ?? 0);
    const ctrNum = Number(stats?.widget_ctr ?? 0);

    return {
      totalTestimonials,
      testimonialsThisMonth: stats?.testimonials_this_month ?? 0,
      testimonialsTrend: stats?.testimonials_trend ?? 0,
      thisWeekCount: stats?.this_week_count ?? 0,
      avgRating: avgRatingNum > 0 ? avgRatingNum.toFixed(1) : "0",
      collectionRate: stats?.collection_rate ?? null,
      approvedCount: stats?.approved_count ?? 0,
      widgetCTR: `${ctrNum.toFixed(1)}%`,
      revenueThisMonth: Number(stats?.revenue_this_month ?? 0),
      revenueTrend: stats?.revenue_trend ?? 0,
      weeklyRevenue: Number(stats?.weekly_revenue ?? 0),
      recent5,
      drivers,
      activities,
      hasTestimonials: totalTestimonials > 0,
    };
  }, [stats]);

  return { ...computed, isLoading };
}
