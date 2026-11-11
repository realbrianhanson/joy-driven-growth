import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTestimonials } from "@/hooks/use-testimonials";
import { useWidgets } from "@/hooks/use-widgets";
import { useWalls } from "@/hooks/use-walls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { Stars } from "@/components/shared/Stars";
import { computeResults, type RangeDays } from "@/lib/results";
import { formatCompact, formatCurrency } from "@/lib/format";
import { downloadTextFile, sourceLabel, toCsv } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

const RANGES: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const FORMAT_LABELS: Record<string, string> = { text: "Written", video: "Video", audio: "Voice" };

function Trend({ value }: { value: number | null }) {
  if (value == null || value === 0) return null;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", up ? "text-success" : "text-destructive")}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value)}% vs the period before
    </span>
  );
}

function Tile({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-subtle">
      <p className="eyebrow">{label}</p>
      <p className="display mt-3 text-[2.5rem] tabular-nums text-foreground">{value}</p>
      {detail && <div className="mt-1.5 text-sm text-muted-foreground">{detail}</div>}
    </div>
  );
}

function Card({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="display text-[1.5rem] text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Breakdown({ rows, total, labelFor }: { rows: { key: string; count: number }[]; total: number; labelFor: (key: string) => string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nothing in this period.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
        return (
          <li key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-foreground">{labelFor(row.key)}</span>
              <span className="tabular-nums text-muted-foreground">
                {row.count} · {share}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${labelFor(row.key)}: ${share} percent`}>
              <div className="h-full rounded-full bg-foreground" style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 13,
  color: "hsl(var(--foreground))",
};

export default function Analytics() {
  const { workspaceOwnerId } = useWorkspace();
  const [range, setRange] = useState<RangeDays>(30);
  const { data: testimonials, isLoading, error, refetch } = useTestimonials();
  const { data: widgets } = useWidgets();
  const { data: walls } = useWalls();

  useEffect(() => {
    document.title = "Results | Happy Client";
  }, []);

  // Six months of sales covers the longest range and the period before it.
  const { data: sales } = useQuery({
    queryKey: ["analytics", "sales", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async () => {
      const since = new Date(Date.now() - 185 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("revenue_events")
        .select("amount, attributed_at")
        .eq("user_id", workspaceOwnerId!)
        .gte("attributed_at", since)
        .order("attributed_at", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const all = useMemo(() => testimonials ?? [], [testimonials]);
  const results = useMemo(() => computeResults(all, sales ?? [], range), [all, sales, range]);

  const topEarners = useMemo(
    () =>
      all
        .filter((t) => Number(t.revenue_attributed ?? 0) > 0)
        .sort((a, b) => Number(b.revenue_attributed ?? 0) - Number(a.revenue_attributed ?? 0))
        .slice(0, 5),
    [all],
  );

  const showcase = useMemo(
    () =>
      [
        ...(walls ?? []).map((w) => ({ id: w.id, name: w.name, kind: "Wall", views: w.views ?? 0, to: `/dashboard/walls/${w.id}` })),
        ...(widgets ?? []).map((w) => ({ id: w.id, name: w.name, kind: "Widget", views: w.impressions ?? 0, to: `/dashboard/widgets/${w.id}` })),
      ].sort((a, b) => b.views - a.views),
    [walls, widgets],
  );

  const exportCsv = () => {
    const start = results.buckets[0]?.start ?? 0;
    const rows = all.filter((t) => new Date(t.created_at).getTime() >= start);
    if (rows.length === 0) return;
    downloadTextFile(
      `happy-client-results-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        rows.map((t) => ({
          date: t.created_at,
          name: t.author_name,
          company: t.author_company ?? "",
          rating: t.rating ?? "",
          format: FORMAT_LABELS[t.type ?? "text"] ?? t.type,
          source: sourceLabel(t.source),
          status: t.status ?? "pending",
          sales: Number(t.revenue_attributed ?? 0),
          testimonial: t.content ?? "",
        })),
      ),
    );
  };

  const hasSalesInRange = results.salesCount > 0;
  const hasTestimonialsInRange = results.collected > 0;

  return (
    <PageContainer>
      <PageHeader
        title="Results"
        description="What you collected, and the sales it helped close."
        actions={
          <>
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="radiogroup" aria-label="Period">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={range === r.value}
                  onClick={() => setRange(r.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    range === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={!hasTestimonialsInRange}>
              <Download className="mr-1.5" /> Export
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState title="Your results did not load" error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-6" role="status" aria-label="Loading results">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : all.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Results start with one testimonial"
          description="Once you have testimonials, this page shows how many you collect, how clients rate you, and the sales you log against them."
          actions={
            <Button asChild>
              <Link to="/dashboard/testimonials">Go to testimonials</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              label="Sales logged"
              value={formatCurrency(results.salesTotal)}
              detail={hasSalesInRange ? <Trend value={results.salesTrend} /> : "None in this period"}
            />
            <Tile
              label="Average sale"
              value={hasSalesInRange ? formatCurrency(results.salesAverage) : "–"}
              detail={hasSalesInRange ? `${results.salesCount} ${results.salesCount === 1 ? "sale" : "sales"}` : "No sales yet"}
            />
            <Tile
              label="New testimonials"
              value={results.collected}
              detail={hasTestimonialsInRange ? (results.collectedTrend != null ? <Trend value={results.collectedTrend} /> : `${results.approved} approved`) : "None in this period"}
            />
            <Tile
              label="Average rating"
              value={results.averageRating != null ? results.averageRating.toFixed(1) : "–"}
              detail={results.averageRating != null ? <Stars rating={results.averageRating} /> : "No ratings in this period"}
            />
          </div>

          <Card
            title="Sales your testimonials helped close"
            description="You log these by hand. Open a testimonial and choose Log a sale when a buyer says it helped them decide."
          >
            {hasSalesInRange ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.buckets} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border-subtle))" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" width={56} tickFormatter={(v: number) => `$${formatCompact(v)}`} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={tooltipStyle} formatter={(value: number) => [formatCurrency(value), "Sales"]} />
                    <Bar dataKey="sales" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
                <p className="text-sm font-medium text-foreground">No sales logged in this period</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Ask new buyers what convinced them. When the answer is a testimonial, log the sale on it. This chart fills in from there.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/dashboard/testimonials">Open testimonials</Link>
                </Button>
              </div>
            )}
          </Card>

          <Card title="Testimonials collected">
            {hasTestimonialsInRange ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.buckets} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border-subtle))" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" width={32} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={tooltipStyle} formatter={(value: number) => [value, "Testimonials"]} />
                    <Bar dataKey="testimonials" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No new testimonials in this period. Send your form link to a client to get one.</p>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="By format">
              <Breakdown rows={results.byFormat} total={results.collected} labelFor={(key) => FORMAT_LABELS[key] ?? key} />
            </Card>
            <Card title="Where they came from">
              <Breakdown rows={results.bySource} total={results.collected} labelFor={sourceLabel} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Top earners" description="All time.">
              {topEarners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No testimonial has a sale logged yet.</p>
              ) : (
                <ol className="divide-y divide-border-subtle">
                  {topEarners.map((t, i) => (
                    <li key={t.id}>
                      <Link to={`/dashboard/testimonials/${t.id}`} className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
                        <span className="display w-5 text-xl text-gold-deep">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{t.author_name}</span>
                          {t.author_company && <span className="block truncate text-xs text-muted-foreground">{t.author_company}</span>}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-success">{formatCurrency(Number(t.revenue_attributed ?? 0))}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card title="Views" description="How often your walls and widgets were seen. All time.">
              {showcase.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have no walls or widgets yet.{" "}
                  <Link to="/dashboard/walls/new" className="font-medium text-foreground underline underline-offset-4">Build a wall</Link>
                </p>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {showcase.slice(0, 6).map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link to={item.to} className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{item.name}</span>
                          <span className="block text-xs text-muted-foreground">{item.kind}</span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-foreground">{formatCompact(item.views)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
