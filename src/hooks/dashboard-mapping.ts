import { Star, DollarSign, Megaphone, Puzzle, MessageSquare, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type RecentTestimonial = {
  id: string;
  author_name: string;
  author_company: string | null;
  content: string | null;
  rating: number | null;
  sentiment: string | null;
  revenue_attributed: number | string | null;
};

export type TopDriverRow = {
  id: string;
  author_name: string;
  author_company: string | null;
  content: string | null;
  revenue_attributed: number | string | null;
};

export type ActivityRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type DashboardStats = {
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

export function mapSentiment(s: string | null | undefined): "happy" | "neutral" | "sad" {
  if (s === "positive") return "happy";
  if (s === "negative") return "sad";
  return "neutral";
}

export function mapDashboardStats(stats: DashboardStats | null | undefined) {
  const recent5 = (stats?.recent_5 ?? []).map((t) => ({
    id: t.id,
    name: t.author_name,
    company: t.author_company ?? "",
    quote: t.content ?? "",
    rating: t.rating ?? 0,
    sentiment: mapSentiment(t.sentiment),
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
}