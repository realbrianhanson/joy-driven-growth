import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Testimonials from "./pages/Testimonials";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import AiInterview from "./pages/AiInterview";
import PublicForm from "./pages/PublicForm";
import Widgets from "./pages/Widgets";
import WidgetBuilder from "./pages/WidgetBuilder";
import WallOfLove from "./pages/WallOfLove";
import WallBuilder from "./pages/WallBuilder";
import ContentStudio from "./pages/ContentStudio";
import ContentLibrary from "./pages/ContentLibrary";
import VideoEditor from "./pages/VideoEditor";
import Analytics from "./pages/Analytics";
import SettingsGeneral from "./pages/SettingsGeneral";
import SettingsTeam from "./pages/SettingsTeam";
import SettingsIntegrations from "./pages/SettingsIntegrations";
import SettingsBilling from "./pages/SettingsBilling";
import SettingsApi from "./pages/SettingsApi";
import AgencyDashboard from "./pages/AgencyDashboard";
import ChromeExtension from "./pages/ChromeExtension";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

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
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/collect/:slug" element={<PublicForm />} />
        <Route path="/collect/:slug/ai" element={<AiInterview />} />

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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
