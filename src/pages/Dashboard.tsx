import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { RevenueHeroCard } from "@/components/dashboard/RevenueHeroCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTestimonials } from "@/components/dashboard/RecentTestimonials";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { RevenueDrivers } from "@/components/dashboard/RevenueDrivers";

// Mock data - will be replaced with real data from the database
const mockTestimonials = [
  {
    id: "1",
    name: "Sarah Johnson",
    company: "TechStart Inc",
    quote: "Working with this team transformed our entire customer experience. Our satisfaction scores jumped 40%!",
    rating: 5,
    sentiment: "happy" as const,
    revenue: 2400,
  },
  {
    id: "2",
    name: "Michael Chen",
    company: "Growth Labs",
    quote: "The ROI was incredible. Within 3 months we saw a 200% increase in qualified leads.",
    rating: 5,
    sentiment: "happy" as const,
    revenue: 1850,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    company: "Bloom Agency",
    quote: "Best decision we made this year. The results speak for themselves.",
    rating: 4,
    sentiment: "happy" as const,
    revenue: 920,
  },
  {
    id: "4",
    name: "David Park",
    company: "Nova Digital",
    quote: "Professional, responsive, and delivered beyond expectations. Highly recommend!",
    rating: 5,
    sentiment: "happy" as const,
  },
  {
    id: "5",
    name: "Lisa Thompson",
    company: "Spark Creative",
    quote: "They understood our vision immediately and executed flawlessly.",
    rating: 5,
    sentiment: "happy" as const,
    revenue: 680,
  },
];

const mockActivities = [
  {
    id: "1",
    icon: "⭐",
    message: "New 5-star testimonial from Sarah Johnson!",
    time: "2 minutes ago",
    type: "testimonial" as const,
  },
  {
    id: "2",
    icon: "💰",
    message: "Testimonial converted! +$127 revenue attributed",
    time: "1 hour ago",
    type: "revenue" as const,
  },
  {
    id: "3",
    icon: "📱",
    message: "SMS campaign sent to 50 contacts",
    time: "3 hours ago",
    type: "campaign" as const,
  },
  {
    id: "4",
    icon: "🔔",
    message: "FOMO popup got 234 views today",
    time: "5 hours ago",
    type: "widget" as const,
  },
  {
    id: "5",
    icon: "✨",
    message: "AI generated 3 social media posts",
    time: "Yesterday",
    type: "other" as const,
  },
];

const mockInsights = [
  {
    id: "1",
    message: "Video testimonials are earning 3x more revenue than text",
    action: "Enable video collection →",
    priority: "high" as const,
  },
  {
    id: "2",
    message: "Tuesday is your best day for testimonial collection",
    action: "Schedule campaigns →",
    priority: "medium" as const,
  },
  {
    id: "3",
    message: "You need more testimonials about pricing value",
    action: "Create targeted form →",
    priority: "medium" as const,
  },
  {
    id: "4",
    message: "Customer 'Acme Corp' is due for a follow-up",
    action: "Send reminder →",
    priority: "low" as const,
  },
];

const mockRevenueDrivers = [
  {
    id: "1",
    name: "Sarah Johnson",
    company: "TechStart Inc",
    snippet: "Transformed our customer experience...",
    placement: "Homepage Hero",
    views: 12500,
    conversions: 48,
    revenue: 2400,
    rank: 1,
  },
  {
    id: "2",
    name: "Michael Chen",
    company: "Growth Labs",
    snippet: "200% increase in qualified leads...",
    placement: "Pricing Page",
    views: 8200,
    conversions: 32,
    revenue: 1850,
    rank: 2,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    company: "Bloom Agency",
    snippet: "Best decision we made this year...",
    placement: "Case Studies",
    views: 6100,
    conversions: 18,
    revenue: 920,
    rank: 3,
  },
  {
    id: "4",
    name: "Lisa Thompson",
    company: "Spark Creative",
    snippet: "Executed flawlessly...",
    placement: "Email Footer",
    views: 4500,
    conversions: 12,
    revenue: 680,
    rank: 4,
  },
  {
    id: "5",
    name: "James Wilson",
    company: "Scale Ventures",
    snippet: "Outstanding partnership...",
    placement: "FOMO Popup",
    views: 3200,
    conversions: 9,
    revenue: 540,
    rank: 5,
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <WelcomeHeader 
          name="Alex" 
          weeklyRevenue={3247}
          hasTestimonials={true}
        />

        {/* Revenue Hero Card */}
        <div className="mb-8">
          <RevenueHeroCard 
            revenue={12847}
            trend={23}
            period="this month"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="💬"
            title="Testimonials Collected"
            value={47}
            trend={{ value: 12, label: "vs last month" }}
            subtitle="8 new this week"
            delay={0}
          />
          <StatCard
            icon="📈"
            title="Collection Rate"
            value="68%"
            highlight="vs 34% industry avg"
            subtitle="completion rate"
            animateValue={false}
            delay={100}
          />
          <StatCard
            icon="😊"
            title="Happiness Score"
            value="4.8/5.0"
            highlight="Your clients love you!"
            animateValue={false}
            delay={200}
          />
          <StatCard
            icon="👀"
            title="Widget Performance"
            value="12.4%"
            subtitle="CTR this month"
            trend={{ value: 8, label: "vs last month" }}
            animateValue={false}
            delay={300}
          />
        </div>

        {/* Revenue Drivers */}
        <div className="mb-8">
          <RevenueDrivers drivers={mockRevenueDrivers} />
        </div>

        {/* Recent Testimonials */}
        <div className="mb-8">
          <RecentTestimonials testimonials={mockTestimonials} />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Activity Feed & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityFeed activities={mockActivities} />
          <AiInsights insights={mockInsights} />
        </div>
      </div>
    </div>
  );
}
