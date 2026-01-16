import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { Database } from "@/integrations/supabase/types";

type RevenueEvent = Database["public"]["Tables"]["revenue_events"]["Row"];
type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];

export const useRevenueEvents = (dateRange?: { start: Date; end: Date }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["revenue-events", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("revenue_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dateRange) {
        query = query
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RevenueEvent[];
    },
    enabled: !!user,
  });
};

export const useTotalRevenue = (dateRange?: { start: Date; end: Date }) => {
  const { data: events } = useRevenueEvents(dateRange);
  
  const total = events?.reduce((sum, event) => sum + Number(event.amount), 0) || 0;
  const count = events?.length || 0;
  
  return { total, count };
};

export const useActivityLog = (limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-log", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user,
  });
};

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get testimonial counts
      const { count: totalTestimonials } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: pendingTestimonials } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      const { count: approvedTestimonials } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "approved");

      // Get revenue total
      const { data: revenueData } = await supabase
        .from("revenue_events")
        .select("amount")
        .eq("user_id", user.id);

      const totalRevenue = revenueData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Get widget impressions
      const { data: widgetData } = await supabase
        .from("widgets")
        .select("impressions, clicks, conversions")
        .eq("user_id", user.id);

      const totalImpressions = widgetData?.reduce((sum, w) => sum + (w.impressions || 0), 0) || 0;
      const totalClicks = widgetData?.reduce((sum, w) => sum + (w.clicks || 0), 0) || 0;
      const totalConversions = widgetData?.reduce((sum, w) => sum + (w.conversions || 0), 0) || 0;

      // Get forms count
      const { count: formsCount } = await supabase
        .from("forms")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Get campaigns count
      const { count: campaignsCount } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      return {
        testimonials: {
          total: totalTestimonials || 0,
          pending: pendingTestimonials || 0,
          approved: approvedTestimonials || 0,
        },
        revenue: totalRevenue,
        widgets: {
          impressions: totalImpressions,
          clicks: totalClicks,
          conversions: totalConversions,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        },
        forms: formsCount || 0,
        campaigns: campaignsCount || 0,
      };
    },
    enabled: !!user,
  });
};
