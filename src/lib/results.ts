export type RangeDays = 7 | 30 | 90;

export interface ResultTestimonial {
  created_at: string;
  status: string | null;
  type: string | null;
  source: string | null;
  rating: number | null;
}

export interface ResultSale {
  amount: number | string;
  attributed_at: string;
}

export interface Bucket {
  label: string;
  /** Start of the bucket, in milliseconds. */
  start: number;
  testimonials: number;
  sales: number;
}

export interface Results {
  salesTotal: number;
  salesCount: number;
  salesAverage: number;
  /** Percent change against the period before. Null when there is nothing to compare with. */
  salesTrend: number | null;
  collected: number;
  collectedTrend: number | null;
  averageRating: number | null;
  ratingCount: number;
  approved: number;
  pending: number;
  byFormat: { key: string; count: number }[];
  bySource: { key: string; count: number }[];
  buckets: Bucket[];
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(time: number): number {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function trend(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function tally<T>(items: T[], key: (item: T) => string): { key: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

/**
 * Everything the Results page shows, from raw rows. Pure, so it can be tested
 * without a database: pass the rows, the range, and "now".
 */
export function computeResults(
  testimonials: ResultTestimonial[],
  sales: ResultSale[],
  rangeDays: RangeDays,
  now: Date = new Date(),
): Results {
  const end = now.getTime();
  const rangeStart = startOfDay(end - (rangeDays - 1) * DAY);
  const previousStart = rangeStart - rangeDays * DAY;

  const time = (value: string) => new Date(value).getTime();
  const inRange = (t: number) => t >= rangeStart && t <= end;
  const inPrevious = (t: number) => t >= previousStart && t < rangeStart;

  const current = testimonials.filter((t) => inRange(time(t.created_at)));
  const previous = testimonials.filter((t) => inPrevious(time(t.created_at)));
  const currentSales = sales.filter((s) => inRange(time(s.attributed_at)));
  const previousSales = sales.filter((s) => inPrevious(time(s.attributed_at)));

  const sum = (rows: ResultSale[]) => rows.reduce((total, row) => total + Number(row.amount || 0), 0);
  const salesTotal = sum(currentSales);

  const ratings = current.map((t) => t.rating).filter((r): r is number => r != null && r >= 1);

  // Daily bars for short ranges, weekly bars for 90 days.
  const step = rangeDays === 90 ? 7 : 1;
  const bucketCount = Math.ceil(rangeDays / step);
  const buckets: Bucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const start = rangeStart + i * step * DAY;
    return {
      label: new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      start,
      testimonials: 0,
      sales: 0,
    };
  });
  const bucketFor = (t: number) => buckets[Math.min(bucketCount - 1, Math.floor((startOfDay(t) - rangeStart) / (step * DAY)))];
  for (const t of current) bucketFor(time(t.created_at)).testimonials += 1;
  for (const s of currentSales) bucketFor(time(s.attributed_at)).sales += Number(s.amount || 0);

  return {
    salesTotal,
    salesCount: currentSales.length,
    salesAverage: currentSales.length > 0 ? salesTotal / currentSales.length : 0,
    salesTrend: trend(salesTotal, sum(previousSales)),
    collected: current.length,
    collectedTrend: trend(current.length, previous.length),
    averageRating: ratings.length > 0 ? ratings.reduce((total, r) => total + r, 0) / ratings.length : null,
    ratingCount: ratings.length,
    approved: current.filter((t) => t.status === "approved").length,
    pending: current.filter((t) => (t.status ?? "pending") === "pending").length,
    byFormat: tally(current, (t) => t.type ?? "text"),
    bySource: tally(current, (t) => t.source ?? "form"),
    buckets,
  };
}
