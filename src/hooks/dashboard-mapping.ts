/** The rows that the get_dashboard_stats database function returns for sales. */
export interface TopDriverRow {
  id: string;
  author_name: string;
  author_company: string | null;
  content?: string | null;
  revenue_attributed: number | string | null;
}

/**
 * The database function returns more than this. Only the sales fields are
 * read here: every other number on the dashboard is counted from the
 * testimonial list, so the two can never disagree.
 */
export interface DashboardStats {
  revenue_this_month?: number | string | null;
  revenue_trend?: number | null;
  top_drivers?: TopDriverRow[] | null;
  [key: string]: unknown;
}

export interface TopEarner {
  id: string;
  name: string;
  company: string;
  revenue: number;
  rank: number;
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Sales this month, the change against last month, and the testimonials that earned the most. */
export function mapDashboardStats(stats: DashboardStats | null | undefined) {
  const drivers: TopEarner[] = (stats?.top_drivers ?? []).map((row, index) => ({
    id: row.id,
    name: row.author_name,
    company: row.author_company ?? "",
    revenue: toNumber(row.revenue_attributed),
    rank: index + 1,
  }));

  return {
    revenueThisMonth: toNumber(stats?.revenue_this_month),
    revenueTrend: toNumber(stats?.revenue_trend),
    drivers,
  };
}
