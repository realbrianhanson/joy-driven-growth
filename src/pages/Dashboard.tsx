import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { RevenueHeroCard } from "@/components/dashboard/RevenueHeroCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTestimonials } from "@/components/dashboard/RecentTestimonials";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { RevenueDrivers } from "@/components/dashboard/RevenueDrivers";
import { MessageSquare, TrendingUp, Smile, Eye, Star, DollarSign, Megaphone, Puzzle } from "lucide-react";

const mockTestimonials = [
  { id: "1", name: "Sarah Johnson", company: "TechStart Inc", quote: "Working with this team transformed our entire customer experience. Our satisfaction scores jumped 40%!", rating: 5, sentiment: "happy" as const, revenue: 2400 },
  { id: "2", name: "Michael Chen", company: "Growth Labs", quote: "The ROI was incredible. Within 3 months we saw a 200% increase in qualified leads.", rating: 5, sentiment: "happy" as const, revenue: 1850 },
  { id: "3", name: "Emily Rodriguez", company: "Bloom Agency", quote: "Best decision we made this year. The results speak for themselves.", rating: 4, sentiment: "happy" as const, revenue: 920 },
  { id: "4", name: "David Park", company: "Nova Digital", quote: "Professional, responsive, and delivered beyond expectations. Highly recommend!", rating: 5, sentiment: "happy" as const },
  { id: "5", name: "Lisa Thompson", company: "Spark Creative", quote: "They understood our vision immediately and executed flawlessly.", rating: 5, sentiment: "happy" as const, revenue: 680 },
];

const mockActivities = [
  { id: "1", icon: Star, message: "New 5-star testimonial from Sarah Johnson", time: "2 minutes ago", type: "testimonial" as const },
  { id: "2", icon: DollarSign, message: "Testimonial converted — +$127 revenue attributed", time: "1 hour ago", type: "revenue" as const },
  { id: "3", icon: Megaphone, message: "SMS campaign sent to 50 contacts", time: "3 hours ago", type: "campaign" as const },
  { id: "4", icon: Puzzle, message: "FOMO popup reached 234 views today", time: "5 hours ago", type: "widget" as const },
];

const mockInsights = [
  { id: "1", message: "Video testimonials earn 3x more revenue than text", action: "Enable video collection", priority: "high" as const },
  { id: "2", message: "Tuesday is your best day for testimonial collection", action: "Schedule campaigns", priority: "medium" as const },
  { id: "3", message: "You need more testimonials about pricing value", action: "Create targeted form", priority: "medium" as const },
];

const mockRevenueDrivers = [
  { id: "1", name: "Sarah Johnson", company: "TechStart Inc", snippet: "Transformed our customer experience...", placement: "Homepage", views: 12500, conversions: 48, revenue: 2400, rank: 1 },
  { id: "2", name: "Michael Chen", company: "Growth Labs", snippet: "200% increase in qualified leads...", placement: "Pricing", views: 8200, conversions: 32, revenue: 1850, rank: 2 },
  { id: "3", name: "Emily Rodriguez", company: "Bloom Agency", snippet: "Best decision we made this year...", placement: "Case Studies", views: 6100, conversions: 18, revenue: 920, rank: 3 },
  { id: "4", name: "Lisa Thompson", company: "Spark Creative", snippet: "Executed flawlessly...", placement: "Email", views: 4500, conversions: 12, revenue: 680, rank: 4 },
  { id: "5", name: "James Wilson", company: "Scale Ventures", snippet: "Outstanding partnership...", placement: "Popup", views: 3200, conversions: 9, revenue: 540, rank: 5 },
];

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <WelcomeHeader name="Alex" weeklyRevenue={3247} hasTestimonials={true} />

      <div className="mb-6">
        <RevenueHeroCard revenue={12847} trend={23} period="this month" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MessageSquare} title="Testimonials Collected" value={47} trend={{ value: 12, label: "vs last month" }} subtitle="8 new this week" delay={0} />
        <StatCard icon={TrendingUp} title="Collection Rate" value="68%" highlight="vs 34% industry avg" animateValue={false} delay={80} accentColor="bg-success" />
        <StatCard icon={Smile} title="Happiness Score" value="4.8/5.0" highlight="Clients love you" animateValue={false} delay={160} accentColor="bg-warning" />
        <StatCard icon={Eye} title="Widget Performance" value="12.4%" subtitle="CTR this month" trend={{ value: 8, label: "vs last month" }} animateValue={false} delay={240} />
      </div>

      <div className="mb-6">
        <RevenueDrivers drivers={mockRevenueDrivers} />
      </div>

      <div className="mb-6">
        <RecentTestimonials testimonials={mockTestimonials} />
      </div>

      <div className="mb-6">
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityFeed activities={mockActivities} />
        <AiInsights insights={mockInsights} />
      </div>
    </div>
  );
}
