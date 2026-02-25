import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Star, DollarSign, Megaphone, Puzzle, MessageSquare, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function useDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // 1. Testimonials summary
  const testimonials = useQuery({
    queryKey: ["dashboard-testimonials", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, author_name, author_company, content, status, type, rating, revenue_attributed, sentiment, created_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 2. Revenue events
  const revenueEvents = useQuery({
    queryKey: ["dashboard-revenue", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_events")
        .select("amount, attributed_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 3. Activity feed
  const activity = useQuery({
    queryKey: ["dashboard-activity", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 4. Top revenue drivers (approved testimonials by revenue)
  const topDrivers = useQuery({
    queryKey: ["dashboard-top-drivers", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, author_name, author_company, content, revenue_attributed")
        .eq("user_id", userId!)
        .eq("status", "approved")
        .order("revenue_attributed", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  // 5. Widget stats (for CTR)
  const widgets = useQuery({
    queryKey: ["dashboard-widgets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("widgets")
        .select("impressions, clicks")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "testimonials", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-testimonials", userId] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-top-drivers", userId] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "revenue_events", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-revenue", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-activity", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Computed values
  const computed = useMemo(() => {
    const allTestimonials = testimonials.data ?? [];
    const allRevenue = revenueEvents.data ?? [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Revenue this month
    const revenueThisMonth = allRevenue
      .filter((e) => new Date(e.attributed_at) >= startOfMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const revenueLastMonth = allRevenue
      .filter((e) => {
        const d = new Date(e.attributed_at);
        return d >= startOfLastMonth && d < startOfMonth;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const revenueTrend = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0 ? 100 : 0;

    // Weekly revenue
    const weeklyRevenue = allRevenue
      .filter((e) => new Date(e.attributed_at) >= startOfWeek)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Testimonials this month vs last
    const testimonialsThisMonth = allTestimonials.filter(
      (t) => new Date(t.created_at) >= startOfMonth
    ).length;
    const testimonialsLastMonth = allTestimonials.filter((t) => {
      const d = new Date(t.created_at);
      return d >= startOfLastMonth && d < startOfMonth;
    }).length;
    const testimonialsTrend = testimonialsLastMonth > 0
      ? Math.round(((testimonialsThisMonth - testimonialsLastMonth) / testimonialsLastMonth) * 100)
      : testimonialsThisMonth > 0 ? 100 : 0;

    // This week count
    const thisWeekCount = allTestimonials.filter(
      (t) => new Date(t.created_at) >= startOfWeek
    ).length;

    // Average rating
    const rated = allTestimonials.filter((t) => t.rating != null);
    const avgRating = rated.length > 0
      ? (rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length).toFixed(1)
      : "0";

    // Widget CTR
    const allWidgets = widgets.data ?? [];
    const totalImpressions = allWidgets.reduce((s, w) => s + (w.impressions ?? 0), 0);
    const totalClicks = allWidgets.reduce((s, w) => s + (w.clicks ?? 0), 0);
    const widgetCTR = totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(1)
      : "0";

    // Recent 5 testimonials (for card display)
    const recent5 = [...allTestimonials]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        name: t.author_name,
        company: t.author_company ?? "",
        quote: t.content ?? "",
        rating: t.rating ?? 0,
        sentiment: (t.sentiment === "positive" ? "happy" : t.sentiment === "negative" ? "sad" : "neutral") as "happy" | "neutral" | "sad",
        revenue: t.revenue_attributed ? Number(t.revenue_attributed) : undefined,
      }));

    // Top drivers mapped
    const drivers = (topDrivers.data ?? [])
      .filter((d) => d.revenue_attributed && Number(d.revenue_attributed) > 0)
      .map((d, i) => ({
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

    // Activity mapped
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

    const activities = (activity.data ?? []).map((a) => ({
      id: a.id,
      icon: iconMap[a.entity_type ?? ""] ?? MessageSquare,
      message: a.action,
      time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
      type: typeMap[a.entity_type ?? ""] ?? ("other" as const),
    }));

    return {
      totalTestimonials: allTestimonials.length,
      testimonialsThisMonth,
      testimonialsTrend,
      thisWeekCount,
      avgRating,
      widgetCTR: `${widgetCTR}%`,
      revenueThisMonth,
      revenueTrend,
      weeklyRevenue,
      recent5,
      drivers,
      activities,
      hasTestimonials: allTestimonials.length > 0,
    };
  }, [testimonials.data, revenueEvents.data, activity.data, topDrivers.data, widgets.data]);

  const isLoading =
    testimonials.isLoading ||
    revenueEvents.isLoading ||
    activity.isLoading ||
    topDrivers.isLoading ||
    widgets.isLoading;

  return { ...computed, isLoading };
}
