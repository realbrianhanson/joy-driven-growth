import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, Check, Link2, PanelsTopLeft, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { useDashboard } from "@/hooks/use-dashboard";
import { useForms } from "@/hooks/use-forms";
import { useSetTestimonialStatus, useTestimonials } from "@/hooks/use-testimonials";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/States";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Stars } from "@/components/shared/Stars";
import { copyText } from "@/components/shared/CopyButton";
import { SetupChecklist, type SetupStep } from "@/components/dashboard/SetupChecklist";
import { TestimonialFormDialog } from "@/components/testimonials/TestimonialFormDialog";
import { formatCurrency, roleLine, timeAgo } from "@/lib/format";
import { PUBLIC_APP_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  to?: string;
  highlight?: boolean;
}

function StatTile({ label, value, detail, to, highlight }: StatTileProps) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="display mt-3 text-[2.5rem] tabular-nums text-foreground">{value}</p>
      {detail && <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>}
    </>
  );
  const className = cn(
    "block rounded-2xl border bg-card p-5 shadow-subtle",
    highlight ? "border-gold/60 bg-gold-light/40" : "border-border",
    to && "card-hover",
  );
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Published walls and widgets, counted without loading the rows. */
function useShowcaseCounts(ownerId: string | null) {
  return useQuery({
    queryKey: ["showcase-counts", ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const [walls, widgets] = await Promise.all([
        supabase.from("walls").select("id", { count: "exact", head: true }).eq("user_id", ownerId!).eq("is_published", true),
        supabase.from("widgets").select("id", { count: "exact", head: true }).eq("user_id", ownerId!),
      ]);
      return { walls: walls.count ?? 0, widgets: widgets.count ?? 0 };
    },
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const { data: testimonials, isLoading, error, refetch } = useTestimonials();
  const { data: forms } = useForms();
  const { data: showcase } = useShowcaseCounts(workspaceOwnerId);
  const sales = useDashboard();
  const statusMutation = useSetTestimonialStatus();
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    document.title = "Home | Happy Client";
  }, []);

  const all = useMemo(() => testimonials ?? [], [testimonials]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const ratings = all.map((t) => t.rating).filter((r): r is number => r != null && r >= 1);
    return {
      total: all.length,
      thisWeek: all.filter((t) => new Date(t.created_at).getTime() >= weekAgo).length,
      pending: all.filter((t) => (t.status ?? "pending") === "pending"),
      approved: all.filter((t) => t.status === "approved"),
      average: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null,
      ratingCount: ratings.length,
    };
  }, [all]);

  const publishedForm = (forms ?? []).find((f) => f.is_published);
  const formLink = publishedForm ? `${PUBLIC_APP_URL}/collect/${publishedForm.slug}` : null;
  const hasFormSubmission = (forms ?? []).some((f) => (f.submission_count ?? 0) > 0) || all.some((t) => !!t.form_id);
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || profile?.email?.split("@")[0] || "";

  const copyFormLink = async () => {
    if (!formLink) return;
    const ok = await copyText(formLink);
    if (ok) toast.success("Form link copied", { description: "Paste it in a text or email to a happy client." });
    else toast.error("Could not copy the link.");
  };

  const approve = (id: string) => {
    statusMutation.mutate(
      { ids: [id], status: "approved" },
      {
        onSuccess: () => toast.success("Testimonial approved"),
        onError: () => toast.error("That did not save. Try again."),
      },
    );
  };

  const steps: SetupStep[] = [
    {
      id: "add",
      title: "Add a testimonial you already have",
      description: "An email, a text, a review. Paste it in and you have your first one in a minute.",
      done: stats.total > 0,
      action: (
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5" /> Add one
        </Button>
      ),
    },
    {
      id: "form",
      title: "Make your collection form",
      description: "Pick a set of questions. You get one link that works for every client.",
      done: (forms ?? []).length > 0,
      action: (
        <Button asChild variant={stats.total > 0 ? "default" : "outline"}>
          <Link to="/dashboard/forms/new">Create form</Link>
        </Button>
      ),
    },
    {
      id: "send",
      title: "Send the link to one happy client",
      description: "Text it or email it. Their answer lands here for you to approve.",
      done: hasFormSubmission,
      action: formLink ? (
        <Button variant="outline" onClick={() => void copyFormLink()}>
          <Link2 className="mr-1.5" /> Copy link
        </Button>
      ) : (
        <Button variant="outline" disabled>
          Make a form first
        </Button>
      ),
    },
    {
      id: "show",
      title: "Put them where buyers look",
      description: "Publish a wall page, or add a widget to your website.",
      done: (showcase?.walls ?? 0) > 0 || (showcase?.widgets ?? 0) > 0,
      action: (
        <Button asChild variant="outline">
          <Link to="/dashboard/walls/new">Build a wall</Link>
        </Button>
      ),
    },
  ];

  if (error) {
    return (
      <PageContainer>
        <ErrorState title="Your dashboard did not load" error={error} onRetry={() => void refetch()} />
      </PageContainer>
    );
  }

  const salesTrend = sales.revenueTrend;
  const recentApproved = stats.approved.slice(0, 3);
  const topEarners = sales.drivers.filter((d) => d.revenue > 0).slice(0, 5);

  return (
    <PageContainer className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-[2.5rem] text-foreground">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isLoading
              ? "Loading your testimonials"
              : stats.pending.length > 0
                ? `${stats.pending.length} ${stats.pending.length === 1 ? "testimonial is" : "testimonials are"} waiting for your review.`
                : stats.total > 0
                  ? "You are all caught up."
                  : "Here is how to get your first testimonial live."}
          </p>
        </div>
        {stats.total > 0 && (
          <div className="flex flex-wrap gap-2">
            {formLink && (
              <Button variant="outline" onClick={() => void copyFormLink()}>
                <Link2 className="mr-1.5" /> Copy form link
              </Button>
            )}
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5" /> Add testimonial
            </Button>
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-6" role="status" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <>
          <SetupChecklist steps={steps} />

          {stats.total > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                label="Testimonials"
                value={stats.total}
                detail={stats.thisWeek > 0 ? `${stats.thisWeek} new this week` : "None new this week"}
                to="/dashboard/testimonials"
              />
              <StatTile
                label="To review"
                value={stats.pending.length}
                detail={stats.pending.length > 0 ? "Approve the ones you like" : "Nothing waiting"}
                to="/dashboard/testimonials"
                highlight={stats.pending.length > 0}
              />
              <StatTile
                label="Average rating"
                value={stats.average != null ? stats.average.toFixed(1) : "–"}
                detail={stats.average != null ? <Stars rating={stats.average} /> : "No ratings yet"}
              />
              <StatTile
                label="Sales this month"
                value={formatCurrency(sales.revenueThisMonth)}
                detail={
                  sales.revenueThisMonth > 0 && salesTrend !== 0 ? (
                    <span className={cn("inline-flex items-center gap-1", salesTrend > 0 ? "text-success" : "text-destructive")}>
                      {salesTrend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {Math.abs(salesTrend)}% vs last month
                    </span>
                  ) : (
                    "Logged against testimonials"
                  )
                }
                to="/dashboard/analytics"
              />
            </div>
          )}

          {stats.pending.length > 0 && (
            <section aria-labelledby="review-title" className="rounded-2xl border border-border bg-card shadow-subtle">
              <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
                <h2 id="review-title" className="display text-[1.5rem] text-foreground">
                  Waiting for your review
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/testimonials">
                    See all <ArrowRight className="ml-1" />
                  </Link>
                </Button>
              </div>
              <ul className="divide-y divide-border-subtle border-t border-border-subtle">
                {stats.pending.slice(0, 4).map((t) => (
                  <li key={t.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
                    <button type="button" onClick={() => navigate(`/dashboard/testimonials/${t.id}`)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <PersonAvatar name={t.author_name} src={t.author_avatar} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="text-sm font-semibold text-foreground">{t.author_name}</span>
                          <Stars rating={t.rating} size="xs" />
                          <span className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                          {(t.content ?? "").trim() || (t.type === "video" ? "Video testimonial" : t.type === "audio" ? "Voice testimonial" : "No written text")}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-2 sm:ml-4">
                      <Button size="sm" onClick={() => approve(t.id)} disabled={statusMutation.isPending}>
                        <Check className="mr-1" /> Approve
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/dashboard/testimonials/${t.id}`}>Open</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recentApproved.length > 0 && (
            <section aria-labelledby="approved-title">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="approved-title" className="display text-[1.5rem] text-foreground">
                  Ready to show off
                </h2>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/walls">
                      <PanelsTopLeft className="mr-1.5" /> Walls
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard/widgets">Widgets</Link>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {recentApproved.map((t) => (
                  <Link key={t.id} to={`/dashboard/testimonials/${t.id}`} className="card-hover flex flex-col rounded-2xl border border-border bg-card p-5 shadow-subtle">
                    <Stars rating={t.rating} />
                    <p className="quote mt-3 line-clamp-4 flex-1 text-[1.1rem] text-foreground">
                      {(t.content ?? "").trim() ? <>&ldquo;{(t.content ?? "").trim()}&rdquo;</> : t.type === "video" ? "Video testimonial" : "Voice testimonial"}
                    </p>
                    <span className="mt-4 flex items-center gap-3">
                      <PersonAvatar name={t.author_name} src={t.author_avatar} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">{t.author_name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{roleLine(t.author_title, t.author_company)}</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {topEarners.length > 0 && (
            <section aria-labelledby="earners-title" className="rounded-2xl border border-border bg-card shadow-subtle">
              <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-5">
                <h2 id="earners-title" className="display text-[1.5rem] text-foreground">
                  Top earners
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard/analytics">
                    Results <ArrowUpRight className="ml-1" />
                  </Link>
                </Button>
              </div>
              <ol className="divide-y divide-border-subtle border-t border-border-subtle">
                {topEarners.map((d) => (
                  <li key={d.id}>
                    <Link to={`/dashboard/testimonials/${d.id}`} className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/40">
                      <span className="display w-6 text-xl text-gold-deep">{d.rank}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{d.name}</span>
                        {d.company && <span className="block truncate text-xs text-muted-foreground">{d.company}</span>}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-success">{formatCurrency(d.revenue)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <TestimonialFormDialog open={addOpen} onOpenChange={setAddOpen} />
    </PageContainer>
  );
}
