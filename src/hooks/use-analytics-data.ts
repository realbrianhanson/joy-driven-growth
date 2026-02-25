import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

function getDateRange(range: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "30d":
    default:
      start.setDate(start.getDate() - 30);
      break;
  }
  return { start, end };
}

function getPreviousPeriod(range: string): { start: Date; end: Date } {
  const current = getDateRange(range);
  const duration = current.end.getTime() - current.start.getTime();
  return {
    start: new Date(current.start.getTime() - duration),
    end: new Date(current.start.getTime()),
  };
}

export function useAnalyticsData(dateRange: string) {
  const { user } = useAuth();
  const { start, end } = getDateRange(dateRange);
  const prev = getPreviousPeriod(dateRange);

  // Revenue events for current period
  const revenueQuery = useQuery({
    queryKey: ["analytics-revenue", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("revenue_events")
        .select("amount, attributed_at")
        .eq("user_id", user.id)
        .gte("attributed_at", start.toISOString())
        .lte("attributed_at", end.toISOString())
        .order("attributed_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Revenue events for previous period (for trend)
  const prevRevenueQuery = useQuery({
    queryKey: ["analytics-revenue-prev", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("revenue_events")
        .select("amount")
        .eq("user_id", user.id)
        .gte("attributed_at", prev.start.toISOString())
        .lt("attributed_at", prev.end.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Testimonials
  const testimonialsQuery = useQuery({
    queryKey: ["analytics-testimonials", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, type, source, created_at, status, rating, sentiment")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // All testimonials for prev period trend
  const prevTestimonialsQuery = useQuery({
    queryKey: ["analytics-testimonials-prev", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("testimonials")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", prev.start.toISOString())
        .lt("created_at", prev.end.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Widgets
  const widgetsQuery = useQuery({
    queryKey: ["analytics-widgets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("widgets")
        .select("id, name, type, impressions, clicks, conversions, revenue_attributed")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Top performers
  const topPerformersQuery = useQuery({
    queryKey: ["analytics-top-performers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("testimonials")
        .select("id, author_name, author_company, revenue_attributed")
        .eq("user_id", user.id)
        .not("revenue_attributed", "is", null)
        .order("revenue_attributed", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Computed values
  const computed = useMemo(() => {
    const revEvents = revenueQuery.data ?? [];
    const prevRevEvents = prevRevenueQuery.data ?? [];
    const testimonials = testimonialsQuery.data ?? [];
    const prevTestimonials = prevTestimonialsQuery.data ?? [];
    const widgets = widgetsQuery.data ?? [];
    const topPerformers = topPerformersQuery.data ?? [];

    // Revenue
    const totalRevenue = revEvents.reduce((s, e) => s + Number(e.amount), 0);
    const prevTotalRevenue = prevRevEvents.reduce((s, e) => s + Number(e.amount), 0);
    const revenueTrend = prevTotalRevenue > 0
      ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0;
    const conversionCount = revEvents.length;
    const avgOrderValue = conversionCount > 0 ? Math.round(totalRevenue / conversionCount) : 0;

    // Revenue chart data grouped by date
    const revenueByDate = new Map<string, { revenue: number; conversions: number }>();
    for (const e of revEvents) {
      const dateKey = new Date(e.attributed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = revenueByDate.get(dateKey) ?? { revenue: 0, conversions: 0 };
      existing.revenue += Number(e.amount);
      existing.conversions += 1;
      revenueByDate.set(dateKey, existing);
    }
    const revenueChartData = Array.from(revenueByDate.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue),
      conversions: v.conversions,
    }));

    // Testimonials
    const totalCollected = testimonials.length;
    const prevCollected = prevTestimonials.length;
    const collectedTrend = prevCollected > 0
      ? Math.round(((totalCollected - prevCollected) / prevCollected) * 100)
      : totalCollected > 0 ? 100 : 0;

    const textCount = testimonials.filter((t) => t.type === "text").length;
    const videoCount = testimonials.filter((t) => t.type === "video").length;
    const audioCount = testimonials.filter((t) => t.type === "audio").length;

    // Source breakdown
    const sourceMap = new Map<string, number>();
    for (const t of testimonials) {
      const src = t.source ?? "form";
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
    }
    const sourceColors: Record<string, string> = {
      sms: "hsl(24, 94%, 53%)",
      form: "hsl(38, 92%, 50%)",
      ai_interview: "hsl(158, 64%, 52%)",
      import: "hsl(199, 89%, 48%)",
    };
    const sourceData = Array.from(sourceMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
      value,
      color: sourceColors[name] ?? "hsl(var(--primary))",
    }));

    // Sentiment
    const positiveCount = testimonials.filter((t) => t.sentiment === "positive").length;
    const neutralCount = testimonials.filter((t) => t.sentiment === "neutral").length;
    const negativeCount = testimonials.filter((t) => t.sentiment === "negative").length;
    const sentTotal = positiveCount + neutralCount + negativeCount;
    const sentimentData = sentTotal > 0
      ? [
          { name: "Loving it 😊", value: Math.round((positiveCount / sentTotal) * 100), color: "hsl(158, 64%, 52%)" },
          { name: "Satisfied 😐", value: Math.round((neutralCount / sentTotal) * 100), color: "hsl(38, 92%, 50%)" },
          { name: "Needs attention 😟", value: Math.round((negativeCount / sentTotal) * 100), color: "hsl(350, 89%, 60%)" },
        ]
      : [];

    // Collection trend (group by week)
    const weekMap = new Map<string, { forms: number; sms: number; ai: number }>();
    for (const t of testimonials) {
      const d = new Date(t.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = weekMap.get(key) ?? { forms: 0, sms: 0, ai: 0 };
      if (t.source === "sms") existing.sms++;
      else if (t.source === "ai_interview") existing.ai++;
      else existing.forms++;
      weekMap.set(key, existing);
    }
    const collectionChartData = Array.from(weekMap.entries()).map(([date, v]) => ({
      date,
      ...v,
    }));

    // Widget data
    const widgetTableData = widgets.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type ?? "carousel",
      impressions: w.impressions ?? 0,
      clicks: w.clicks ?? 0,
      ctr: (w.impressions ?? 0) > 0 ? Number((((w.clicks ?? 0) / (w.impressions ?? 1)) * 100).toFixed(1)) : 0,
      conversions: w.conversions ?? 0,
      revenue: Number(w.revenue_attributed ?? 0),
    }));

    const totalImpressions = widgets.reduce((s, w) => s + (w.impressions ?? 0), 0);
    const totalClicks = widgets.reduce((s, w) => s + (w.clicks ?? 0), 0);
    const totalWidgetConversions = widgets.reduce((s, w) => s + (w.conversions ?? 0), 0);

    // Top performers
    const topPerformersList = topPerformers.map((t, i) => ({
      rank: i + 1,
      name: t.author_name,
      company: t.author_company ?? "",
      revenue: Number(t.revenue_attributed ?? 0),
      emoji: i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`,
    }));

    return {
      totalRevenue,
      revenueTrend,
      conversionCount,
      avgOrderValue,
      revenueChartData,
      totalCollected,
      collectedTrend,
      textCount,
      videoCount,
      audioCount,
      sourceData,
      sentimentData,
      collectionChartData,
      widgetTableData,
      totalImpressions,
      totalClicks,
      totalWidgetConversions,
      topPerformersList,
      hasRevenue: revEvents.length > 0,
      hasTestimonials: testimonials.length > 0,
    };
  }, [
    revenueQuery.data,
    prevRevenueQuery.data,
    testimonialsQuery.data,
    prevTestimonialsQuery.data,
    widgetsQuery.data,
    topPerformersQuery.data,
  ]);

  return {
    ...computed,
    isLoading:
      revenueQuery.isLoading ||
      testimonialsQuery.isLoading ||
      widgetsQuery.isLoading ||
      topPerformersQuery.isLoading,
  };
}
