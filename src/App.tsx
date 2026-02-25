import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Forms = lazy(() => import("./pages/Forms"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignBuilder = lazy(() => import("./pages/CampaignBuilder"));
const AiInterview = lazy(() => import("./pages/AiInterview"));
const PublicForm = lazy(() => import("./pages/PublicForm"));
const Widgets = lazy(() => import("./pages/Widgets"));
const WidgetBuilder = lazy(() => import("./pages/WidgetBuilder"));
const WallOfLove = lazy(() => import("./pages/WallOfLove"));
const WallBuilder = lazy(() => import("./pages/WallBuilder"));
const ContentStudio = lazy(() => import("./pages/ContentStudio"));
const ContentLibrary = lazy(() => import("./pages/ContentLibrary"));
const VideoEditor = lazy(() => import("./pages/VideoEditor"));
const Analytics = lazy(() => import("./pages/Analytics"));
const SettingsGeneral = lazy(() => import("./pages/SettingsGeneral"));
const SettingsTeam = lazy(() => import("./pages/SettingsTeam"));
const SettingsIntegrations = lazy(() => import("./pages/SettingsIntegrations"));
const SettingsBilling = lazy(() => import("./pages/SettingsBilling"));
const SettingsApi = lazy(() => import("./pages/SettingsApi"));
const AgencyDashboard = lazy(() => import("./pages/AgencyDashboard"));
const ChromeExtension = lazy(() => import("./pages/ChromeExtension"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

const DashboardRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  </ProtectedRoute>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Auth /></Suspense>} />
        <Route path="/collect/:slug" element={<Suspense fallback={<PageLoader />}><PublicForm /></Suspense>} />
        <Route path="/collect/:slug/ai" element={<Suspense fallback={<PageLoader />}><AiInterview /></Suspense>} />

        {/* Dashboard routes - protected + layout */}
        <Route path="/dashboard" element={<DashboardRoute><Dashboard /></DashboardRoute>} />
        <Route path="/dashboard/testimonials" element={<DashboardRoute><Testimonials /></DashboardRoute>} />
        <Route path="/dashboard/testimonials/:id" element={<DashboardRoute><Testimonials /></DashboardRoute>} />
        <Route path="/dashboard/forms" element={<DashboardRoute><Forms /></DashboardRoute>} />
        <Route path="/dashboard/forms/:id/edit" element={<DashboardRoute><FormBuilder /></DashboardRoute>} />
        <Route path="/dashboard/campaigns" element={<DashboardRoute><Campaigns /></DashboardRoute>} />
        <Route path="/dashboard/campaigns/new" element={<DashboardRoute><CampaignBuilder /></DashboardRoute>} />
        <Route path="/dashboard/widgets" element={<DashboardRoute><Widgets /></DashboardRoute>} />
        <Route path="/dashboard/widgets/:id" element={<DashboardRoute><WidgetBuilder /></DashboardRoute>} />
        <Route path="/dashboard/walls" element={<DashboardRoute><WallOfLove /></DashboardRoute>} />
        <Route path="/dashboard/walls/:id" element={<DashboardRoute><WallBuilder /></DashboardRoute>} />
        <Route path="/dashboard/content" element={<DashboardRoute><ContentStudio /></DashboardRoute>} />
        <Route path="/dashboard/content/library" element={<DashboardRoute><ContentLibrary /></DashboardRoute>} />
        <Route path="/dashboard/content/video-editor" element={<DashboardRoute><VideoEditor /></DashboardRoute>} />
        <Route path="/dashboard/analytics" element={<DashboardRoute><Analytics /></DashboardRoute>} />
        <Route path="/dashboard/settings" element={<DashboardRoute><SettingsGeneral /></DashboardRoute>} />
        <Route path="/dashboard/settings/team" element={<DashboardRoute><SettingsTeam /></DashboardRoute>} />
        <Route path="/dashboard/settings/integrations" element={<DashboardRoute><SettingsIntegrations /></DashboardRoute>} />
        <Route path="/dashboard/settings/billing" element={<DashboardRoute><SettingsBilling /></DashboardRoute>} />
        <Route path="/dashboard/settings/api" element={<DashboardRoute><SettingsApi /></DashboardRoute>} />
        <Route path="/dashboard/agency" element={<DashboardRoute><AgencyDashboard /></DashboardRoute>} />
        <Route path="/dashboard/extension" element={<DashboardRoute><ChromeExtension /></DashboardRoute>} />

        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
