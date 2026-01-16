import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
          <Route path="/collect/:slug" element={<PublicForm />} />
          <Route path="/collect/:slug/ai" element={<AiInterview />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
