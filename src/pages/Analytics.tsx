import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  Target,
  Clock,
  Download,
  RefreshCw,
  Lightbulb,
  BarChart3,
  PieChart,
  FileText,
  Image as ImageIcon,
  Star,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Video,
  Mail,
  MessageCircle,
  FileUp,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Revenue trend data
const revenueData = [
  { date: 'Jan 1', revenue: 1200, conversions: 23 },
  { date: 'Jan 5', revenue: 1800, conversions: 34 },
  { date: 'Jan 10', revenue: 1400, conversions: 28 },
  { date: 'Jan 15', revenue: 2200, conversions: 42 },
  { date: 'Jan 20', revenue: 2800, conversions: 51 },
  { date: 'Jan 25', revenue: 3200, conversions: 58 },
  { date: 'Jan 30', revenue: 2600, conversions: 47 },
];

// Collection trend data
const collectionData = [
  { date: 'Week 1', forms: 12, sms: 28, ai: 15 },
  { date: 'Week 2', forms: 18, sms: 34, ai: 22 },
  { date: 'Week 3', forms: 14, sms: 42, ai: 28 },
  { date: 'Week 4', forms: 22, sms: 38, ai: 35 },
];

// Source breakdown
const sourceData = [
  { name: 'SMS', value: 42, color: 'hsl(24, 94%, 53%)' },
  { name: 'Form', value: 28, color: 'hsl(38, 92%, 50%)' },
  { name: 'AI Interview', value: 22, color: 'hsl(158, 64%, 52%)' },
  { name: 'Import', value: 8, color: 'hsl(199, 89%, 48%)' },
];

// Sentiment data
const sentimentData = [
  { name: 'Loving it 😊', value: 78, color: 'hsl(158, 64%, 52%)' },
  { name: 'Satisfied 😐', value: 18, color: 'hsl(38, 92%, 50%)' },
  { name: 'Needs attention 😟', value: 4, color: 'hsl(350, 89%, 60%)' },
];

// Widget performance data
const widgetData = [
  { id: 1, name: 'Homepage Carousel', type: 'carousel', impressions: 45230, clicks: 3254, ctr: 7.2, conversions: 89, revenue: 12400 },
  { id: 2, name: 'FOMO Popup', type: 'fomo', impressions: 32100, clicks: 4823, ctr: 15.0, conversions: 134, revenue: 18700 },
  { id: 3, name: 'Pricing Testimonials', type: 'grid', impressions: 28400, clicks: 1988, ctr: 7.0, conversions: 67, revenue: 9340 },
  { id: 4, name: 'Exit Intent', type: 'notification', impressions: 12300, clicks: 1845, ctr: 15.0, conversions: 42, revenue: 5860 },
];

// Top performers
const topPerformers = [
  { rank: 1, name: 'Sarah Chen', company: 'TechFlow', revenue: 4200, conversions: 89, emoji: '🥇' },
  { rank: 2, name: 'Marcus Johnson', company: 'DataSync', revenue: 3100, conversions: 67, emoji: '🥈' },
  { rank: 3, name: 'Emily Rodriguez', company: 'GrowthLab', revenue: 2800, conversions: 54, emoji: '🥉' },
  { rank: 4, name: 'Alex Kim', company: 'StartupX', revenue: 2100, conversions: 43, emoji: '4' },
  { rank: 5, name: 'Jordan Lee', company: 'ScaleUp Co', revenue: 1800, conversions: 38, emoji: '5' },
];

// Theme analysis data
const themeData = [
  { theme: 'Customer support', mentions: 67, sentiment: 94 },
  { theme: 'Easy to use', mentions: 54, sentiment: 98 },
  { theme: 'Time saved', mentions: 43, sentiment: 91 },
  { theme: 'Value for money', mentions: 36, sentiment: 88 },
  { theme: 'Integrations', mentions: 28, sentiment: 72 },
];

// AI Insights
const aiInsights = [
  { icon: Video, text: 'Video testimonials earning 3x more revenue than text', type: 'success' },
  { icon: MessageCircle, text: 'SMS campaigns have 68% completion vs 23% email', type: 'success' },
  { icon: Zap, text: 'Exit-intent popups converting best on pricing page', type: 'info' },
  { icon: AlertCircle, text: 'You need more testimonials about integrations', type: 'warning' },
  { icon: Users, text: 'Customer "Acme Corp" is due for follow-up', type: 'action' },
];

const Analytics = () => {
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'custom'>('30d');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const refreshInsights = () => {
    toast.success('Insights refreshed! ✨');
  };

  const handleExport = (type: string) => {
    toast.success(`Exporting ${type}...`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Analytics 📊
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your testimonial ROI and performance
            </p>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            {['today', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as typeof dateRange)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  dateRange === range
                    ? 'gradient-sunny text-white shadow-warm'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {range === 'today' ? 'Today' : range.toUpperCase()}
              </button>
            ))}
            <Select value={dateRange === 'custom' ? 'custom' : ''} onValueChange={() => setDateRange('custom')}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ============ REVENUE SECTION ============ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-gold" />
            Revenue Attribution
          </h2>

          {/* Main Revenue Card */}
          <Card className="bg-card mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue from Testimonials</p>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-5xl font-bold text-foreground animate-revenue-glow">$47,283</span>
                    <Badge className="bg-emerald/10 text-emerald border-emerald/20 text-sm">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +34%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Last 30 days • vs previous period 🚀</p>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Conversions</p>
                      <p className="text-xl font-semibold text-foreground">432</p>
                      <p className="text-xs text-emerald">+23%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Avg Order</p>
                      <p className="text-xl font-semibold text-foreground">$109</p>
                      <p className="text-xs text-emerald">+8%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className="text-xl font-semibold text-gold">847%</p>
                      <p className="text-xs text-gold">🔥 Amazing</p>
                    </div>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(24, 94%, 53%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(24, 94%, 53%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(24, 94%, 53%)" 
                        strokeWidth={2}
                        fill="url(#revenueGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Widget Revenue */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Widget Revenue</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {widgetData.slice(0, 3).map((widget, i) => (
                    <div key={widget.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{i + 1}.</span>
                        <span className="text-sm text-foreground">{widget.name}</span>
                      </div>
                      <Badge className="bg-gold/10 text-gold border-gold/20">
                        {formatCurrency(widget.revenue)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Testimonials */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Testimonials</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {topPerformers.slice(0, 3).map((performer) => (
                    <div key={performer.rank} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{performer.emoji}</span>
                        <span className="text-sm text-foreground">{performer.name}</span>
                      </div>
                      <Badge className="bg-gold/10 text-gold border-gold/20">
                        {formatCurrency(performer.revenue)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {[
                    { label: 'Impressions', value: 117030, pct: 100 },
                    { label: 'Clicks', value: 11910, pct: 10.2 },
                    { label: 'Conversions', value: 432, pct: 0.37 },
                    { label: 'Revenue', value: '$47,283', pct: null },
                  ].map((step, i) => (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{step.label}</span>
                        <span className="text-muted-foreground">
                          {typeof step.value === 'number' ? formatNumber(step.value) : step.value}
                          {step.pct !== null && step.pct !== 100 && ` (${step.pct}%)`}
                        </span>
                      </div>
                      {step.pct !== null && (
                        <Progress value={step.pct} className="h-2" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============ COLLECTION METRICS ============ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            Collection Performance
          </h2>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">127</p>
                    <p className="text-xs text-muted-foreground">Total Collected</p>
                    <Badge className="text-[10px] bg-emerald/10 text-emerald mt-1">+18%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">68%</p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                    <span className="text-[10px] text-emerald">vs 34% avg 🔥</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">2.3d</p>
                    <p className="text-xs text-muted-foreground">Avg Response Time</p>
                    <Badge className="text-[10px] bg-emerald/10 text-emerald mt-1">-1.2d</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-sky" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">34</p>
                    <p className="text-xs text-muted-foreground">Video Testimonials</p>
                    <Badge className="text-[10px] bg-emerald/10 text-emerald mt-1">+45%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Source Breakdown */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-primary" />
                  By Source
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
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
                      <span className="text-xs text-muted-foreground">{source.name} ({source.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collection Trends */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Collection Trends</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={collectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="forms" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Forms" />
                      <Line type="monotone" dataKey="sms" stroke="hsl(24, 94%, 53%)" strokeWidth={2} name="SMS" />
                      <Line type="monotone" dataKey="ai" stroke="hsl(158, 64%, 52%)" strokeWidth={2} name="AI Interview" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============ WIDGET PERFORMANCE ============ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            🔔 Widget & Popup Performance
          </h2>

          {/* Insight Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              🧠 <strong>Insight:</strong> FOMO popups converting 3x better than carousel
            </p>
          </div>

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
                  {widgetData.map((widget) => (
                    <TableRow key={widget.id} className="cursor-pointer hover:bg-secondary/50">
                      <TableCell className="font-medium">{widget.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{widget.type}</Badge>
                      </TableCell>
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
                        <Badge className="bg-gold/10 text-gold border-gold/20">
                          {formatCurrency(widget.revenue)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ============ SENTIMENT & TOP PERFORMERS ============ */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Sentiment Analysis */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                😊 Happiness Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-6">
                <div className="h-40 w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
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
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ⭐ All-Star Testimonials
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topPerformers.map((performer) => (
                  <div key={performer.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{performer.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">{performer.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gold">{formatCurrency(performer.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{performer.conversions} conv.</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============ VOICE OF CUSTOMER ============ */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            🧠 What Your Customers Love
          </h2>

          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Themes */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Top Mentioned Themes</h3>
                  <div className="space-y-3">
                    {themeData.map((theme, i) => (
                      <div key={theme.theme} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-5">{i + 1}.</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground">{theme.theme}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{theme.mentions} mentions</span>
                              <Badge className={`text-[10px] ${
                                theme.sentiment >= 90 ? 'bg-emerald/10 text-emerald' :
                                theme.sentiment >= 80 ? 'bg-amber/10 text-amber' :
                                'bg-rose/10 text-rose'
                              }`}>
                                {theme.sentiment >= 90 ? '😊' : theme.sentiment >= 80 ? '😐' : '😟'} {theme.sentiment}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={theme.mentions / 0.67} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Mentions Chart */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">Feature Sentiment</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={themeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis dataKey="theme" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="sentiment" fill="hsl(158, 64%, 52%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => handleExport('PDF Report')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============ AI INSIGHTS ============ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber" />
              Smart Insights
            </h2>
            <Button variant="outline" size="sm" onClick={refreshInsights}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.map((insight, i) => (
              <Card key={i} className={`bg-card hover:shadow-warm transition-all cursor-pointer ${
                insight.type === 'warning' ? 'border-amber/30' :
                insight.type === 'action' ? 'border-primary/30' : ''
              }`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    insight.type === 'success' ? 'bg-emerald/10' :
                    insight.type === 'warning' ? 'bg-amber/10' :
                    insight.type === 'action' ? 'bg-primary/10' :
                    'bg-sky/10'
                  }`}>
                    <insight.icon className={`w-4 h-4 ${
                      insight.type === 'success' ? 'text-emerald' :
                      insight.type === 'warning' ? 'text-amber' :
                      insight.type === 'action' ? 'text-primary' :
                      'text-sky'
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
                <Button variant="outline" onClick={() => handleExport('PDF')}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF Report
                </Button>
                <Button variant="outline" onClick={() => handleExport('CSV')}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV Data
                </Button>
                <Button variant="outline" onClick={() => handleExport('PNG')}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  PNG Charts
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
