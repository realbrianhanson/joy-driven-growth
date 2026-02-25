import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Clock,
  Download,
  RefreshCw,
  Lightbulb,
  BarChart3,
  PieChart,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Video,
  MessageCircle,
  Zap,
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
import { MOCK_ANALYTICS_DATA, MOCK_WIDGET_DATA } from "@/data/mock/analytics";

// AI Insights (static for now — could be generated later)
const aiInsights = [
  { icon: Video, text: "Video testimonials earn 3x more revenue than text", type: "success" },
  { icon: MessageCircle, text: "SMS campaigns have 68% completion vs 23% email", type: "success" },
  { icon: Zap, text: "Exit-intent popups converting best on pricing page", type: "info" },
  { icon: AlertCircle, text: "You need more testimonials about integrations", type: "warning" },
  { icon: Users, text: 'Customer "Acme Corp" is due for follow-up', type: "action" },
];

const Analytics = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d">("30d");
  const { isDemoMode } = useDemoMode();
  const analytics = useAnalyticsData(dateRange);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  const formatNumber = (num: number) => (num >= 1000 ? (num / 1000).toFixed(1) + "k" : num.toString());

  const handleExport = (type: string) => toast.success(`Exporting ${type}...`);

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
        { name: "SMS", value: 42, color: "hsl(24, 94%, 53%)" },
        { name: "Form", value: 28, color: "hsl(38, 92%, 50%)" },
        { name: "AI Interview", value: 22, color: "hsl(158, 64%, 52%)" },
        { name: "Import", value: 8, color: "hsl(199, 89%, 48%)" },
      ]
    : analytics.sourceData;
  const sentimentData = isDemoMode
    ? [
        { name: "Loving it 😊", value: 78, color: "hsl(158, 64%, 52%)" },
        { name: "Satisfied 😐", value: 18, color: "hsl(38, 92%, 50%)" },
        { name: "Needs attention 😟", value: 4, color: "hsl(350, 89%, 60%)" },
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
        { rank: 1, name: "Sarah Chen", company: "TechFlow", revenue: 4200, emoji: "🥇" },
        { rank: 2, name: "Marcus Johnson", company: "DataSync", revenue: 3100, emoji: "🥈" },
        { rank: 3, name: "Emily Rodriguez", company: "GrowthLab", revenue: 2800, emoji: "🥉" },
        { rank: 4, name: "Alex Kim", company: "StartupX", revenue: 2100, emoji: "4" },
        { rank: 5, name: "Jordan Lee", company: "ScaleUp Co", revenue: 1800, emoji: "5" },
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
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Analytics 📊
            </h1>
            <p className="text-muted-foreground mt-1">Track your testimonial ROI and performance</p>
          </div>
          <div className="flex items-center gap-2">
            {(["today", "7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  dateRange === range
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {range === "today" ? "Today" : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ============ REVENUE SECTION ============ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-warning" />
            Revenue Attribution
          </h2>

          {!hasRevenue ? (
            <Card className="bg-card mb-6">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted mb-4">
                  <CreditCard className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No revenue data yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Connect Stripe to start tracking revenue attributed to your testimonials.
                </p>
                <Button onClick={() => navigate("/dashboard/settings/integrations")}>
                  Connect Stripe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-card mb-6 overflow-hidden">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue from Testimonials</p>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-5xl font-bold text-foreground">{formatCurrency(totalRevenue)}</span>
                        {revenueTrend !== 0 && (
                          <Badge className={`${revenueTrend > 0 ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"} text-sm`}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {revenueTrend > 0 ? "+" : ""}{revenueTrend}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last {dateRange === "today" ? "24 hours" : dateRange} • vs previous period
                      </p>

                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-xs text-muted-foreground">Conversions</p>
                          <p className="text-xl font-semibold text-foreground">{conversionCount}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-xs text-muted-foreground">Avg Order</p>
                          <p className="text-xl font-semibold text-foreground">{formatCurrency(avgOrderValue)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className="text-xl font-semibold text-warning">
                            {totalRevenue > 0 ? `${Math.round((totalRevenue / Math.max(totalRevenue * 0.1, 1)) * 100)}%` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-48">
                      {revenueChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueChartData}>
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(24, 94%, 53%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(24, 94%, 53%)" stopOpacity={0} />
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
                            <Area type="monotone" dataKey="revenue" stroke="hsl(24, 94%, 53%)" strokeWidth={2} fill="url(#revenueGradient)" />
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
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-card">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Widget Revenue</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {widgetTableData.slice(0, 3).map((widget, i) => (
                        <div key={widget.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{i + 1}.</span>
                            <span className="text-sm text-foreground">{widget.name}</span>
                          </div>
                          <Badge className="bg-warning/10 text-warning border-warning/20">{formatCurrency(widget.revenue)}</Badge>
                        </div>
                      ))}
                      {widgetTableData.length === 0 && <p className="text-sm text-muted-foreground">No widgets yet</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Top Testimonials</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {topPerformersList.slice(0, 3).map((p) => (
                        <div key={p.rank} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{p.emoji}</span>
                            <span className="text-sm text-foreground">{p.name}</span>
                          </div>
                          <Badge className="bg-warning/10 text-warning border-warning/20">{formatCurrency(p.revenue)}</Badge>
                        </div>
                      ))}
                      {topPerformersList.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {[
                        { label: "Impressions", value: totalImpressions, pct: 100 },
                        { label: "Clicks", value: totalClicks, pct: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0 },
                        { label: "Conversions", value: totalWidgetConversions, pct: totalImpressions > 0 ? Number(((totalWidgetConversions / totalImpressions) * 100).toFixed(2)) : 0 },
                        { label: "Revenue", value: formatCurrency(totalRevenue), pct: null as number | null },
                      ].map((step) => (
                        <div key={step.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-foreground">{step.label}</span>
                            <span className="text-muted-foreground">
                              {typeof step.value === "number" ? formatNumber(step.value) : step.value}
                              {step.pct !== null && step.pct !== 100 && ` (${step.pct}%)`}
                            </span>
                          </div>
                          {step.pct !== null && <Progress value={Math.min(step.pct, 100)} className="h-2" />}
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
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            Collection Performance
          </h2>

          {!hasTestimonials ? (
            <Card className="bg-card">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted mb-4">
                  <MessageSquare className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No testimonials yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                  Collect your first testimonial to see analytics.
                </p>
                <Button onClick={() => navigate("/dashboard/forms")}>Create Collection Form</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{totalCollected}</p>
                        <p className="text-xs text-muted-foreground">Total Collected</p>
                        {collectedTrend !== 0 && (
                          <Badge className={`text-[10px] mt-1 ${collectedTrend > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {collectedTrend > 0 ? "+" : ""}{collectedTrend}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{sourceData.length}</p>
                        <p className="text-xs text-muted-foreground">Sources Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{dateRange.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">Period</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/50 flex items-center justify-center">
                        <Video className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{videoCount}</p>
                        <p className="text-xs text-muted-foreground">Video Testimonials</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-primary" />
                      By Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
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
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                              <span className="text-xs text-muted-foreground">{source.name} ({source.value})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No source data</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Collection Trends</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    {collectionChartData.length > 0 ? (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={collectionChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                            <Legend />
                            <Line type="monotone" dataKey="forms" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Forms" />
                            <Line type="monotone" dataKey="sms" stroke="hsl(24, 94%, 53%)" strokeWidth={2} name="SMS" />
                            <Line type="monotone" dataKey="ai" stroke="hsl(158, 64%, 52%)" strokeWidth={2} name="AI Interview" />
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
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
              🔔 Widget & Popup Performance
            </h2>
            <Card className="bg-card">
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
                        <TableCell><Badge variant="secondary" className="capitalize">{widget.type}</Badge></TableCell>
                        <TableCell className="text-right">{formatNumber(widget.impressions)}</TableCell>
                        <TableCell className="text-right">{formatNumber(widget.clicks)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={widget.ctr * 5} className="w-16 h-2" />
                            <span>{widget.ctr}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{widget.conversions}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-warning/10 text-warning border-warning/20">{formatCurrency(widget.revenue)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============ SENTIMENT & TOP PERFORMERS ============ */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">😊 Happiness Overview</CardTitle></CardHeader>
            <CardContent className="pt-0">
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
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm text-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sentiment data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">⭐ All-Star Testimonials</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {topPerformersList.length > 0 ? (
                <div className="space-y-3">
                  {topPerformersList.map((performer) => (
                    <div key={performer.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{performer.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">{performer.company}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-warning">{formatCurrency(performer.revenue)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No revenue-attributed testimonials yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============ AI INSIGHTS ============ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" />
              Smart Insights
            </h2>
            <Button variant="outline" size="sm" onClick={() => toast.success("Insights refreshed! ✨")}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.map((insight, i) => (
              <Card key={i} className={`bg-card hover:shadow-sm transition-all cursor-pointer ${
                insight.type === "warning" ? "border-warning/30" : insight.type === "action" ? "border-primary/30" : ""
              }`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    insight.type === "success" ? "bg-success/10" : insight.type === "warning" ? "bg-warning/10" : insight.type === "action" ? "bg-primary/10" : "bg-accent/50"
                  }`}>
                    <insight.icon className={`w-4 h-4 ${
                      insight.type === "success" ? "text-success" : insight.type === "warning" ? "text-warning" : insight.type === "action" ? "text-primary" : "text-primary"
                    }`} />
                  </div>
                  <p className="text-sm text-foreground flex-1">{insight.text}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ============ EXPORT OPTIONS ============ */}
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Export Your Data</h3>
                <p className="text-sm text-muted-foreground">Download reports to share with your team</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => handleExport("PDF")}>
                  <FileText className="w-4 h-4 mr-2" /> PDF Report
                </Button>
                <Button variant="outline" onClick={() => handleExport("CSV")}>
                  <Download className="w-4 h-4 mr-2" /> CSV Data
                </Button>
                <Button variant="outline" onClick={() => handleExport("PNG")}>
                  <ImageIcon className="w-4 h-4 mr-2" /> PNG Charts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
