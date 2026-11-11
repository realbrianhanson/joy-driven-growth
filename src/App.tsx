import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// The dashboard shell loads only for signed-in pages, so public forms and walls stay light.
const DashboardLayout = lazy(() => import("@/components/layout/DashboardLayout"));
const Index = lazy(() => import("./pages/Index"));
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
const Analytics = lazy(() => import("./pages/Analytics"));
const SettingsGeneral = lazy(() => import("./pages/SettingsGeneral"));
const SettingsTeam = lazy(() => import("./pages/SettingsTeam"));
const SettingsIntegrations = lazy(() => import("./pages/SettingsIntegrations"));
const SettingsBilling = lazy(() => import("./pages/SettingsBilling"));
const SettingsApi = lazy(() => import("./pages/SettingsApi"));
const PublicWall = lazy(() => import("./pages/PublicWall"));
const EmbedWidget = lazy(() => import("./pages/EmbedWidget"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/** Start each new page at the top, the way a normal website behaves. */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/signup" element={<Auth initialMode="signup" />} />
      <Route path="/collect/:slug" element={<PublicForm />} />
      <Route path="/collect/:slug/ai" element={<AiInterview />} />
      <Route path="/wall/:slug" element={<PublicWall />} />
      <Route path="/embed/widget/:id" element={<EmbedWidget />} />
      <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Signed-in app. The layout stays mounted while pages change inside it. */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="testimonials/:id" element={<Testimonials />} />
        <Route path="forms" element={<Forms />} />
        <Route path="forms/new" element={<FormBuilder />} />
        <Route path="forms/:id/edit" element={<FormBuilder />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<CampaignBuilder />} />
        <Route path="widgets" element={<Widgets />} />
        <Route path="widgets/:id" element={<WidgetBuilder />} />
        <Route path="walls" element={<WallOfLove />} />
        <Route path="walls/:id" element={<WallBuilder />} />
        <Route path="content" element={<ContentStudio />} />
        <Route path="content/library" element={<ContentLibrary />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<SettingsGeneral />} />
        <Route path="settings/team" element={<SettingsTeam />} />
        <Route path="settings/integrations" element={<SettingsIntegrations />} />
        <Route path="settings/billing" element={<SettingsBilling />} />
        <Route path="settings/api" element={<SettingsApi />} />
        <Route path="agency" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <ErrorBoundary>
        <Toaster />
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
