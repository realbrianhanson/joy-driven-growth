import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  Download,
  BarChart3,
  PieChart,
  MessageSquare,
  Video,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_ANALYTICS_DATA, MOCK_WIDGET_DATA } from "@/data/mock/analytics";

const Analytics = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d">("30d");
  const { isDemoMode } = useDemoMode();
  const { user } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const analytics = useAnalyticsData(dateRange);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  const formatNumber = (num: number) => (num >= 1000 ? (num / 1000).toFixed(1) + "k" : num.toString());

  const handleExportCsv = async () => {
    if (!workspaceOwnerId) return;
    const { data, error } = await supabase
      .from("testimonials")
      .select("created_at, author_name, author_email, author_company, content, rating, type, status, source, revenue_attributed")
      .eq("user_id", workspaceOwnerId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Export failed", { description: error.message });
      return;
    }
    if (!data?.length) {
      toast("No data to export");
      return;
    }
    const headers = Object.keys(data[0]);
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `testimonials-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Use mock data in demo mode
  const totalRevenue = isDemoMode ? MOCK_ANALYTICS_DATA.totalRevenue : analytics.totalRevenue;
  const revenueTrend = isDemoMode ? MOCK_ANALYTICS_DATA.revenueTrend : analytics.revenueTrend;
  const conversionCount = isDemoMode ? 432 : analytics.conversionCount;
  const avgOrderValue = isDemoMode ? 109 : analytics.avgOrderValue;
  const revenueChartData = isDemoMode
    ? MOCK_ANALYTICS_DATA.monthlyRevenue.map((m) => ({ date: m.month, revenue: m.revenue, conversions: 0 }))
    : analytics.revenueChartData;
  const totalCollected = isDemoMode ? MOCK_ANALYTICS_DATA.totalTestimonials : analytics.totalCollected;
  const collectedTrend = isDemoMode ? MOCK_ANALYTICS_DATA.testimonialsTrend : analytics.collectedTrend;
  const videoCount = isDemoMode ? 34 : analytics.videoCount;
  const sourceData = isDemoMode
    ? [
        { name: "SMS", value: 42, color: "hsl(243, 75%, 59%)" },
        { name: "Form", value: 28, color: "hsl(243, 60%, 70%)" },
        { name: "AI Interview", value: 22, color: "hsl(243, 40%, 80%)" },
        { name: "Import", value: 8, color: "hsl(220, 13%, 85%)" },
      ]
    : analytics.sourceData;
  const sentimentData = isDemoMode
    ? [
        { name: "Positive", value: 78, color: "hsl(142, 71%, 45%)" },
        { name: "Neutral", value: 18, color: "hsl(220, 13%, 75%)" },
        { name: "Negative", value: 4, color: "hsl(0, 84%, 60%)" },
      ]
    : analytics.sentimentData;
  const collectionChartData = isDemoMode
    ? [
        { date: "Week 1", forms: 12, sms: 28, ai: 15 },
        { date: "Week 2", forms: 18, sms: 34, ai: 22 },
        { date: "Week 3", forms: 14, sms: 42, ai: 28 },
        { date: "Week 4", forms: 22, sms: 38, ai: 35 },
      ]
    : analytics.collectionChartData;
  const widgetTableData = isDemoMode
    ? MOCK_WIDGET_DATA.map((w) => ({
        ...w,
        ctr: w.impressions > 0 ? Number(((w.clicks / w.impressions) * 100).toFixed(1)) : 0,
      }))
    : analytics.widgetTableData;
  const topPerformersList = isDemoMode
    ? [
        { rank: 1, name: "Sarah Chen", company: "TechFlow", revenue: 4200 },
        { rank: 2, name: "Marcus Johnson", company: "DataSync", revenue: 3100 },
        { rank: 3, name: "Emily Rodriguez", company: "GrowthLab", revenue: 2800 },
        { rank: 4, name: "Alex Kim", company: "StartupX", revenue: 2100 },
        { rank: 5, name: "Jordan Lee", company: "ScaleUp Co", revenue: 1800 },
      ]
    : analytics.topPerformersList;
  const totalImpressions = isDemoMode ? 117030 : analytics.totalImpressions;
  const totalClicks = isDemoMode ? 11910 : analytics.totalClicks;
  const totalWidgetConversions = isDemoMode ? 432 : analytics.totalWidgetConversions;
  const hasRevenue = isDemoMode ? true : analytics.hasRevenue;
  const hasTestimonials = isDemoMode ? true : analytics.hasTestimonials;
  const isLoading = isDemoMode ? false : analytics.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Testimonial ROI and collection performance.</p>
          </div>
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
            {(["today", "7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? "bg-primary-light text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "today" ? "Today" : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ============ REVENUE SECTION ============ */}
        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Revenue Attribution</h2>

          {!hasRevenue ? (
            <Card className="bg-card border border-border rounded-xl shadow-none mb-6">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">No revenue data yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
                  Connect Stripe to start tracking revenue attributed to your testimonials.
                </p>
                <Button size="sm" onClick={() => navigate("/dashboard/settings/integrations")}>
                  Connect Stripe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-card border border-border rounded-xl shadow-none mb-3 overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Total Revenue from Testimonials</p>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-semibold text-foreground tabular-nums tracking-tight">{formatCurrency(totalRevenue)}</span>
                        {revenueTrend !== 0 && (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${revenueTrend > 0 ? "text-success" : "text-destructive"}`}>
                            <TrendingUp className="w-3 h-3" />
                            {revenueTrend > 0 ? "+" : ""}{revenueTrend}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last {dateRange === "today" ? "24 hours" : dateRange} <span className="mx-1 text-border">·</span> vs previous period
                      </p>

                      <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Conversions</p>
                          <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{conversionCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Avg Order</p>
                          <p className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{formatCurrency(avgOrderValue)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-48">
                      {revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueChartData}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                          No data for this period
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <div className="grid md:grid-cols-3 gap-3">
                <Card className="bg-card border border-border rounded-xl shadow-none">
                  <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Widget Revenue</CardTitle></CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="space-y-2.5">
                      {widgetTableData.slice(0, 3).map((widget, i) => (
                        <div key={widget.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                            <span className="text-sm text-foreground truncate">{widget.name}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(widget.revenue)}</span>
                        </div>
                      ))}
                      {widgetTableData.length === 0 && <p className="text-sm text-muted-foreground">No widgets yet</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border rounded-xl shadow-none">
                  <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Top Testimonials</CardTitle></CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="space-y-2.5">
                      {topPerformersList.slice(0, 3).map((p) => (
                        <div key={p.rank} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground tabular-nums">{p.rank}</span>
                            <span className="text-sm text-foreground truncate">{p.name}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(p.revenue)}</span>
                        </div>
                      ))}
                      {topPerformersList.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border rounded-xl shadow-none">
                  <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Conversion Funnel</CardTitle></CardHeader>
                  <CardContent className="px-5 pb-4">
                    <div className="space-y-2.5">
                      {[
                        { label: "Impressions", value: totalImpressions, pct: 100 },
                        { label: "Clicks", value: totalClicks, pct: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0 },
                        { label: "Conversions", value: totalWidgetConversions, pct: totalImpressions > 0 ? Number(((totalWidgetConversions / totalImpressions) * 100).toFixed(2)) : 0 },
                        { label: "Revenue", value: formatCurrency(totalRevenue), pct: null as number | null },
                      ].map((step) => (
                        <div key={step.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground">{step.label}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {typeof step.value === "number" ? formatNumber(step.value) : step.value}
                              {step.pct !== null && step.pct !== 100 && ` (${step.pct}%)`}
                            </span>
                          </div>
                          {step.pct !== null && <Progress value={Math.min(step.pct, 100)} className="h-1" />}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* ============ COLLECTION METRICS ============ */}
        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Collection Performance</h2>

          {!hasTestimonials ? (
            <Card className="bg-card border border-border rounded-xl shadow-none">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">No testimonials yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
                  Collect your first testimonial to see analytics.
                </p>
                <Button size="sm" onClick={() => navigate("/dashboard/forms")}>Create Collection Form</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {[
                  { Icon: Users, label: "Total Collected", value: totalCollected, trend: collectedTrend },
                  { Icon: Target, label: "Sources Active", value: sourceData.length },
                  { Icon: Clock, label: "Period", value: dateRange.toUpperCase() },
                  { Icon: Video, label: "Video Testimonials", value: videoCount },
                ].map((s) => (
                  <Card key={s.label} className="bg-card border border-border rounded-xl shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <s.Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{s.label}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-semibold text-foreground tabular-nums">{s.value}</p>
                        {s.trend !== undefined && s.trend !== 0 && (
                          <span className={`text-xs font-medium tabular-nums ${s.trend > 0 ? "text-success" : "text-destructive"}`}>
                            {s.trend > 0 ? "+" : ""}{s.trend}%
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Card className="bg-card border border-border rounded-xl shadow-none">
                  <CardHeader className="pb-2 pt-4 px-5">
                    <CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground flex items-center gap-1.5">
                      <PieChart className="w-3 h-3" /> By Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4">
                    {sourceData.length > 0 ? (
                      <>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                                {sourceData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                          {sourceData.map((source) => (
                            <div key={source.name} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                              <span className="text-xs text-muted-foreground tabular-nums">{source.name} <span className="text-foreground/60">({source.value})</span></span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No source data</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border rounded-xl shadow-none">
                  <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Collection Trends</CardTitle></CardHeader>
                  <CardContent className="px-5 pb-4">
                    {collectionChartData.length > 0 ? (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={collectionChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                            <Legend />
                            <Line type="monotone" dataKey="forms" stroke="hsl(var(--primary))" strokeWidth={2} name="Forms" dot={false} />
                            <Line type="monotone" dataKey="sms" stroke="hsl(243, 60%, 70%)" strokeWidth={2} name="SMS" dot={false} />
                            <Line type="monotone" dataKey="ai" stroke="hsl(220, 13%, 60%)" strokeWidth={2} name="AI Interview" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No collection data for this period</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        {/* ============ WIDGET PERFORMANCE ============ */}
        {widgetTableData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Widget &amp; Popup Performance</h2>
            <Card className="bg-card border border-border rounded-xl shadow-none overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Widget</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {widgetTableData.map((widget) => (
                      <TableRow key={widget.id} className="cursor-pointer hover:bg-secondary/50">
                        <TableCell className="font-medium">{widget.name}</TableCell>
                        <TableCell><span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{widget.type}</span></TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(widget.impressions)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(widget.clicks)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={widget.ctr * 5} className="w-16 h-1" />
                            <span className="tabular-nums">{widget.ctr}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{widget.conversions}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatCurrency(widget.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============ SENTIMENT & TOP PERFORMERS ============ */}
        <div className="grid md:grid-cols-2 gap-3 mb-8">
          <Card className="bg-card border border-border rounded-xl shadow-none">
            <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Happiness Overview</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4">
              {sentimentData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {sentimentData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground tabular-nums">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sentiment data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-xl shadow-none">
            <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">All-Star Testimonials</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4">
              {topPerformersList.length > 0 ? (
                <div className="space-y-1">
                  {topPerformersList.map((performer) => (
                    <div key={performer.rank} className="flex items-center justify-between py-1.5 hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-medium tabular-nums text-muted-foreground w-4">{performer.rank}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{performer.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{performer.company}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground tabular-nums">{formatCurrency(performer.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No revenue-attributed testimonials yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============ INSIGHTS ============ */}
        <Card className="bg-card border border-border rounded-xl shadow-none mb-3">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              AI-generated insights appear here as you collect more testimonials. We need at least 10 approved testimonials with revenue attribution to surface trends.
            </p>
          </CardContent>
        </Card>

        {/* ============ EXPORT OPTIONS ============ */}
        <Card className="bg-card border border-border rounded-xl shadow-none">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Export Your Data</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Download reports to share with your team.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
