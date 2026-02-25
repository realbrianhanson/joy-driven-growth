import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useDashboard } from "@/hooks/use-dashboard";
import {
  MOCK_TESTIMONIALS,
  MOCK_ACTIVITIES,
  MOCK_INSIGHTS,
  MOCK_REVENUE_DRIVERS,
  MOCK_DASHBOARD_STATS,
} from "@/data/mock/dashboard";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { RevenueHeroCard } from "@/components/dashboard/RevenueHeroCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTestimonials } from "@/components/dashboard/RecentTestimonials";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { RevenueDrivers } from "@/components/dashboard/RevenueDrivers";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, TrendingUp, Smile, Eye } from "lucide-react";

function StatSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted" />
      <CardContent className="p-5 pt-6 space-y-3">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

function RevenueSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted" />
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-28" />
      </CardContent>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-28" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-2.5">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const real = useDashboard();

  const isLoading = isDemoMode ? false : real.isLoading;
  const firstName = profile?.full_name?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "there";

  // Pick data source
  const totalTestimonials = isDemoMode ? MOCK_DASHBOARD_STATS.totalTestimonials : real.totalTestimonials;
  const testimonialsTrend = isDemoMode ? 12 : real.testimonialsTrend;
  const thisWeekCount = isDemoMode ? 8 : real.thisWeekCount;
  const avgRating = isDemoMode ? MOCK_DASHBOARD_STATS.happinessScore : `${real.avgRating}/5.0`;
  const widgetCTR = isDemoMode ? MOCK_DASHBOARD_STATS.widgetCTR : real.widgetCTR;
  const revenueThisMonth = isDemoMode ? MOCK_DASHBOARD_STATS.revenue : real.revenueThisMonth;
  const revenueTrend = isDemoMode ? MOCK_DASHBOARD_STATS.revenueTrend : real.revenueTrend;
  const weeklyRevenue = isDemoMode ? MOCK_DASHBOARD_STATS.weeklyRevenue : real.weeklyRevenue;
  const testimonials = isDemoMode ? MOCK_TESTIMONIALS : real.recent5;
  const activities = isDemoMode ? MOCK_ACTIVITIES : real.activities;
  const insights = isDemoMode ? MOCK_INSIGHTS : [];
  const drivers = isDemoMode ? MOCK_REVENUE_DRIVERS : real.drivers;
  const hasTestimonials = isDemoMode ? true : real.hasTestimonials;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-6xl mx-auto px-6 py-8"
    >
      <WelcomeHeader
        name={firstName}
        weeklyRevenue={weeklyRevenue}
        hasTestimonials={hasTestimonials}
        isNewUser={!isDemoMode && !hasTestimonials}
      />

      {/* Onboarding checklist for new users */}
      {!isDemoMode && <OnboardingChecklist />}

      {/* Revenue hero */}
      {isLoading ? (
        <div className="mb-6"><RevenueSkeleton /></div>
      ) : (
        <div className="mb-6">
          <RevenueHeroCard revenue={revenueThisMonth} trend={revenueTrend} period="this month" />
        </div>
      )}

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={MessageSquare} title="Testimonials Collected" value={totalTestimonials} trend={{ value: testimonialsTrend, label: "vs last month" }} subtitle={`${thisWeekCount} new this week`} delay={0} />
          <StatCard icon={TrendingUp} title="Collection Rate" value={hasTestimonials ? "68%" : "—"} highlight={hasTestimonials ? "vs 34% industry avg" : undefined} animateValue={false} delay={80} accentColor="bg-success" />
          <StatCard icon={Smile} title="Happiness Score" value={hasTestimonials ? avgRating : "—"} highlight={hasTestimonials ? "Clients love you" : undefined} animateValue={false} delay={160} accentColor="bg-warning" />
          <StatCard icon={Eye} title="Widget Performance" value={widgetCTR} subtitle="CTR this month" animateValue={false} delay={240} />
        </div>
      )}

      {/* Revenue drivers */}
      {isLoading ? (
        <div className="mb-6"><FeedSkeleton /></div>
      ) : drivers.length > 0 ? (
        <div className="mb-6"><RevenueDrivers drivers={drivers} /></div>
      ) : null}

      {/* Recent testimonials */}
      {isLoading ? (
        <div className="mb-6">
          <Skeleton className="h-4 w-36 mb-3" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex-shrink-0 w-72">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : testimonials.length > 0 ? (
        <div className="mb-6"><RecentTestimonials testimonials={testimonials} /></div>
      ) : !isDemoMode ? (
        <div className="mb-6">
          <EmptyState type="testimonials" onAction={() => navigate("/dashboard/forms")} />
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="mb-6"><QuickActions /></div>

      {/* Activity + insights */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeedSkeleton />
          <FeedSkeleton />
        </div>
      ) : (activities.length > 0 || insights.length > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activities.length > 0 && <ActivityFeed activities={activities} />}
          {insights.length > 0 && <AiInsights insights={insights} />}
        </div>
      ) : null}
    </motion.div>
  );
}
