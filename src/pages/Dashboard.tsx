import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { RevenueHeroCard } from "@/components/dashboard/RevenueHeroCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTestimonials } from "@/components/dashboard/RecentTestimonials";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { RevenueDrivers } from "@/components/dashboard/RevenueDrivers";
import { useDemoMode } from "@/contexts/DemoModeContext";
import {
  MOCK_TESTIMONIALS,
  MOCK_ACTIVITIES,
  MOCK_INSIGHTS,
  MOCK_REVENUE_DRIVERS,
  MOCK_DASHBOARD_STATS,
} from "@/data/mock/dashboard";
import { MessageSquare, TrendingUp, Smile, Eye } from "lucide-react";

export default function Dashboard() {
  const { isDemoMode } = useDemoMode();

  // In the future, real data hooks go here with { enabled: !isDemoMode }
  const stats = isDemoMode ? MOCK_DASHBOARD_STATS : MOCK_DASHBOARD_STATS;
  const testimonials = isDemoMode ? MOCK_TESTIMONIALS : [];
  const activities = isDemoMode ? MOCK_ACTIVITIES : [];
  const insights = isDemoMode ? MOCK_INSIGHTS : [];
  const drivers = isDemoMode ? MOCK_REVENUE_DRIVERS : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <WelcomeHeader name="Alex" weeklyRevenue={stats.weeklyRevenue} hasTestimonials={true} />

      <div className="mb-6">
        <RevenueHeroCard revenue={stats.revenue} trend={stats.revenueTrend} period="this month" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MessageSquare} title="Testimonials Collected" value={stats.totalTestimonials} trend={{ value: 12, label: "vs last month" }} subtitle="8 new this week" delay={0} />
        <StatCard icon={TrendingUp} title="Collection Rate" value={stats.collectionRate} highlight="vs 34% industry avg" animateValue={false} delay={80} accentColor="bg-success" />
        <StatCard icon={Smile} title="Happiness Score" value={stats.happinessScore} highlight="Clients love you" animateValue={false} delay={160} accentColor="bg-warning" />
        <StatCard icon={Eye} title="Widget Performance" value={stats.widgetCTR} subtitle="CTR this month" trend={{ value: 8, label: "vs last month" }} animateValue={false} delay={240} />
      </div>

      {drivers.length > 0 && (
        <div className="mb-6">
          <RevenueDrivers drivers={drivers} />
        </div>
      )}

      {testimonials.length > 0 && (
        <div className="mb-6">
          <RecentTestimonials testimonials={testimonials} />
        </div>
      )}

      <div className="mb-6">
        <QuickActions />
      </div>

      {(activities.length > 0 || insights.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activities.length > 0 && <ActivityFeed activities={activities} />}
          {insights.length > 0 && <AiInsights insights={insights} />}
        </div>
      )}
    </div>
  );
}
