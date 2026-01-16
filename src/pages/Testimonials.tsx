import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TestimonialsFilters, FilterType, ViewType, SortType } from "@/components/testimonials/TestimonialsFilters";
import { TestimonialCard, Testimonial } from "@/components/testimonials/TestimonialCard";
import { TestimonialDetail } from "@/components/testimonials/TestimonialDetail";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Mock data - will be replaced with real data
const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    type: "text",
    status: "approved",
    featured: true,
    name: "Sarah Johnson",
    title: "CEO",
    company: "TechStart Inc",
    content: "Working with this team transformed our entire customer experience. Our satisfaction scores jumped 40% within the first quarter. The implementation was seamless and the support has been outstanding.",
    rating: 5,
    sentiment: "positive",
    source: "form",
    revenue: 2400,
    tags: ["enterprise", "customer success", "implementation"],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    type: "video",
    status: "approved",
    featured: false,
    name: "Michael Chen",
    title: "VP of Sales",
    company: "Growth Labs",
    content: "The ROI was incredible. Within 3 months we saw a 200% increase in qualified leads. This is exactly what we needed to scale our business.",
    rating: 5,
    sentiment: "positive",
    source: "ai_interview",
    revenue: 1850,
    tags: ["sales", "ROI", "growth"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    videoThumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    type: "text",
    status: "pending",
    featured: false,
    name: "Emily Rodriguez",
    title: "Marketing Director",
    company: "Bloom Agency",
    content: "Best decision we made this year. The team understood our needs perfectly and delivered beyond expectations.",
    rating: 4,
    sentiment: "positive",
    source: "sms",
    tags: ["marketing", "agency"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    type: "text",
    status: "approved",
    featured: true,
    name: "David Park",
    title: "Founder",
    company: "Nova Digital",
    content: "Professional, responsive, and delivered beyond expectations. The attention to detail is remarkable. Highly recommend to anyone looking for a reliable partner!",
    rating: 5,
    sentiment: "positive",
    source: "form",
    revenue: 920,
    tags: ["startup", "partnership"],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "5",
    type: "audio",
    status: "pending",
    featured: false,
    name: "Lisa Thompson",
    title: "COO",
    company: "Spark Creative",
    content: "They understood our vision immediately and executed flawlessly. The entire team was a pleasure to work with from start to finish.",
    rating: 5,
    sentiment: "positive",
    source: "ai_interview",
    revenue: 680,
    tags: ["creative", "vision"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "6",
    type: "video",
    status: "approved",
    featured: false,
    name: "James Wilson",
    title: "CTO",
    company: "Scale Ventures",
    content: "Outstanding partnership from day one. The technical expertise and support have been invaluable to our growth.",
    rating: 5,
    sentiment: "positive",
    source: "form",
    revenue: 540,
    tags: ["technical", "support"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    videoThumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop",
  },
  {
    id: "7",
    type: "text",
    status: "pending",
    featured: false,
    name: "Amanda Foster",
    company: "Bright Ideas Co",
    content: "Good experience overall. The product met our basic needs and the support team was helpful when we had questions.",
    rating: 3,
    sentiment: "neutral",
    source: "form",
    tags: ["small business"],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "8",
    type: "text",
    status: "approved",
    featured: false,
    name: "Robert Kim",
    title: "Director of Operations",
    company: "Apex Solutions",
    content: "Streamlined our entire workflow. What used to take hours now takes minutes. The automation features are incredible.",
    rating: 5,
    sentiment: "positive",
    source: "sms",
    revenue: 1200,
    tags: ["operations", "automation"],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function Testimonials() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [sortBy, setSortBy] = useState<SortType>("revenue");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [testimonials, setTestimonials] = useState(mockTestimonials);
  const [isDetailOpen, setIsDetailOpen] = useState(!!id);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(
    id ? mockTestimonials.find((t) => t.id === id) || null : null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Filter counts
  const counts = useMemo(() => ({
    all: testimonials.length,
    pending: testimonials.filter((t) => t.status === "pending").length,
    approved: testimonials.filter((t) => t.status === "approved").length,
    featured: testimonials.filter((t) => t.featured).length,
    video: testimonials.filter((t) => t.type === "video").length,
    text: testimonials.filter((t) => t.type === "text").length,
    audio: testimonials.filter((t) => t.type === "audio").length,
  }), [testimonials]);

  // Filtered and sorted testimonials
  const filteredTestimonials = useMemo(() => {
    let result = [...testimonials];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.company.toLowerCase().includes(query) ||
          t.content.toLowerCase().includes(query)
      );
    }

    // Type/status filter
    switch (activeFilter) {
      case "pending":
        result = result.filter((t) => t.status === "pending");
        break;
      case "approved":
        result = result.filter((t) => t.status === "approved");
        break;
      case "featured":
        result = result.filter((t) => t.featured);
        break;
      case "video":
        result = result.filter((t) => t.type === "video");
        break;
      case "text":
        result = result.filter((t) => t.type === "text");
        break;
      case "audio":
        result = result.filter((t) => t.type === "audio");
        break;
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "revenue":
        result.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
        break;
      case "converting":
        result.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
        break;
    }

    return result;
  }, [testimonials, searchQuery, activeFilter, sortBy]);

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleClick = (id: string) => {
    const testimonial = testimonials.find((t) => t.id === id);
    if (testimonial) {
      setSelectedTestimonial(testimonial);
      setIsDetailOpen(true);
      setAiAnalysis(null);
      navigate(`/dashboard/testimonials/${id}`, { replace: true });
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTestimonial(null);
    setAiAnalysis(null);
    navigate("/dashboard/testimonials", { replace: true });
  };

  const handleApprove = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "approved" as const } : t))
    );
    toast({
      title: "Testimonial approved! 🎉",
      description: "The testimonial is now visible on your widgets.",
    });
  };

  const handleFeature = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, featured: !t.featured } : t))
    );
  };

  const analyzeTestimonial = async () => {
    if (!selectedTestimonial) return;
    
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-testimonial", {
        body: { 
          content: selectedTestimonial.content,
          name: selectedTestimonial.name,
          company: selectedTestimonial.company,
          rating: selectedTestimonial.rating,
        },
      });

      if (error) throw error;

      setAiAnalysis(data);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze this testimonial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="p-0 h-auto"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Your Happy Clients <span>😊</span>
            </h1>
            <p className="text-muted-foreground">
              {counts.all} testimonials
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <TestimonialsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            viewType={viewType}
            onViewChange={setViewType}
            sortBy={sortBy}
            onSortChange={setSortBy}
            counts={counts}
            selectedCount={selectedIds.size}
            onBulkApprove={() => {
              selectedIds.forEach((id) => handleApprove(id));
              setSelectedIds(new Set());
            }}
            onBulkExport={() => {
              toast({ title: "Exporting testimonials..." });
            }}
            onBulkDelete={() => {
              toast({ title: "Delete functionality coming soon" });
            }}
          />
        </div>

        {/* Grid/List */}
        {filteredTestimonials.length > 0 ? (
          <div
            className={
              viewType === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TestimonialCard
                  testimonial={testimonial}
                  isSelected={selectedIds.has(testimonial.id)}
                  onSelect={handleSelect}
                  onClick={handleClick}
                  onApprove={handleApprove}
                  onFeature={handleFeature}
                  onEdit={(id) => toast({ title: "Edit coming soon" })}
                  onDelete={(id) => toast({ title: "Delete coming soon" })}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No testimonials found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={isDetailOpen} onOpenChange={(open) => !open && handleCloseDetail()}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-6">
            {selectedTestimonial && (
              <TestimonialDetail
                testimonial={{
                  ...selectedTestimonial,
                  transcript: selectedTestimonial.type !== "text" ? selectedTestimonial.content : undefined,
                  verified: true,
                  location: "San Francisco, CA",
                }}
                aiAnalysis={aiAnalysis}
                revenueData={
                  selectedTestimonial.revenue
                    ? {
                        total: selectedTestimonial.revenue,
                        conversions: Math.ceil(selectedTestimonial.revenue / 300),
                        widget: "Homepage Carousel",
                        lastConversion: "2 days ago",
                      }
                    : undefined
                }
                isAnalyzing={isAnalyzing}
                onRefreshAnalysis={analyzeTestimonial}
                onApprove={() => {
                  handleApprove(selectedTestimonial.id);
                  handleCloseDetail();
                }}
                onReject={() => {
                  toast({ title: "Testimonial rejected" });
                  handleCloseDetail();
                }}
                onRequestEdit={() => toast({ title: "Edit request sent" })}
                onFeature={() => handleFeature(selectedTestimonial.id)}
                onGenerateContent={(type) =>
                  toast({ title: `Generating ${type} content...` })
                }
                onClose={handleCloseDetail}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
