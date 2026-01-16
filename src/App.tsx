import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
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

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/testimonials" element={<Testimonials />} />
        <Route path="/dashboard/testimonials/:id" element={<Testimonials />} />
        <Route path="/dashboard/forms" element={<Forms />} />
        <Route path="/dashboard/forms/:id/edit" element={<FormBuilder />} />
        <Route path="/dashboard/campaigns" element={<Campaigns />} />
        <Route path="/dashboard/campaigns/new" element={<CampaignBuilder />} />
        <Route path="/dashboard/widgets" element={<Widgets />} />
        <Route path="/dashboard/widgets/:id" element={<WidgetBuilder />} />
        <Route path="/dashboard/walls" element={<WallOfLove />} />
        <Route path="/dashboard/walls/:id" element={<WallBuilder />} />
        <Route path="/dashboard/content" element={<ContentStudio />} />
        <Route path="/dashboard/content/library" element={<ContentLibrary />} />
        <Route path="/dashboard/content/video-editor" element={<VideoEditor />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/settings" element={<SettingsGeneral />} />
        <Route path="/dashboard/settings/team" element={<SettingsTeam />} />
        <Route path="/dashboard/settings/integrations" element={<SettingsIntegrations />} />
        <Route path="/dashboard/settings/billing" element={<SettingsBilling />} />
        <Route path="/dashboard/settings/api" element={<SettingsApi />} />
        <Route path="/dashboard/agency" element={<AgencyDashboard />} />
        <Route path="/dashboard/extension" element={<ChromeExtension />} />
        <Route path="/collect/:slug" element={<PublicForm />} />
        <Route path="/collect/:slug/ai" element={<AiInterview />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
