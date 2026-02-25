import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TestimonialsFilters, FilterType, ViewType, SortType } from "@/components/testimonials/TestimonialsFilters";
import { TestimonialCard, Testimonial } from "@/components/testimonials/TestimonialCard";
import { TestimonialDetail } from "@/components/testimonials/TestimonialDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/DemoModeContext";
import {
  useTestimonials,
  useApproveTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "@/hooks/use-testimonials";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MOCK_TESTIMONIALS_LIST as MOCK_TESTIMONIALS_DATA } from "@/data/mock/testimonials";

// Map mock data to Testimonial card shape
const MOCK_TESTIMONIALS: Testimonial[] = MOCK_TESTIMONIALS_DATA.map((t) => mapDbToCard(t));

function mapDbToCard(t: any): Testimonial {
  return {
    id: t.id,
    type: t.type ?? "text",
    status: t.status ?? "pending",
    featured: t.is_featured ?? false,
    name: t.author_name,
    title: t.author_title ?? undefined,
    company: t.author_company ?? "",
    content: t.content ?? "",
    rating: t.rating ?? 0,
    sentiment: (t.sentiment ?? "neutral") as "positive" | "neutral" | "negative",
    source: (t.source ?? "form") as "form" | "import" | "ai_interview" | "sms",
    revenue: t.revenue_attributed ? Number(t.revenue_attributed) : undefined,
    tags: t.tags ?? [],
    createdAt: t.created_at,
    videoThumbnail: t.thumbnail_url ?? undefined,
  };
}

export default function Testimonials() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [sortBy, setSortBy] = useState<SortType>("revenue");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDetailOpen, setIsDetailOpen] = useState(!!id);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Build filter for hook
  const hookFilters = useMemo(() => {
    const f: { status?: "pending" | "approved" | "rejected"; type?: "text" | "video" | "audio"; search?: string } = {};
    if (activeFilter === "pending") f.status = "pending";
    if (activeFilter === "approved") f.status = "approved";
    if (activeFilter === "video") f.type = "video";
    if (activeFilter === "text") f.type = "text";
    if (activeFilter === "audio") f.type = "audio";
    if (searchQuery) f.search = searchQuery;
    return f;
  }, [activeFilter, searchQuery]);

  // All testimonials (unfiltered) for counts
  const { data: allDbTestimonials } = useTestimonials(undefined);
  // Filtered testimonials
  const { data: dbTestimonials, isLoading } = useTestimonials(
    Object.keys(hookFilters).length > 0 ? hookFilters : undefined
  );

  // First form for "copy link" CTA
  const { data: firstForm } = useQuery({
    queryKey: ["first-form", user?.id],
    enabled: !!user && !isDemoMode,
    queryFn: async () => {
      const { data } = await supabase
        .from("forms")
        .select("slug")
        .eq("user_id", user!.id)
        .eq("is_published", true)
        .limit(1)
        .single();
      return data;
    },
  });

  const approveMutation = useApproveTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();

  // Map DB data to card shape
  const realTestimonials = useMemo(
    () => (dbTestimonials ?? []).map(mapDbToCard),
    [dbTestimonials]
  );
  const allRealTestimonials = useMemo(
    () => (allDbTestimonials ?? []).map(mapDbToCard),
    [allDbTestimonials]
  );

  const testimonials = isDemoMode ? MOCK_TESTIMONIALS : realTestimonials;
  const allTestimonials = isDemoMode ? MOCK_TESTIMONIALS : allRealTestimonials;
  const loading = isDemoMode ? false : isLoading;

  // Filter counts from ALL testimonials (unfiltered)
  const counts = useMemo(
    () => ({
      all: allTestimonials.length,
      pending: allTestimonials.filter((t) => t.status === "pending").length,
      approved: allTestimonials.filter((t) => t.status === "approved").length,
      featured: allTestimonials.filter((t) => t.featured).length,
      video: allTestimonials.filter((t) => t.type === "video").length,
      text: allTestimonials.filter((t) => t.type === "text").length,
      audio: allTestimonials.filter((t) => t.type === "audio").length,
    }),
    [allTestimonials]
  );

  // Sorted (featured filter handled client-side since hook doesn't support it)
  const sortedTestimonials = useMemo(() => {
    let result = [...testimonials];

    // Featured filter (not handled by hook)
    if (activeFilter === "featured") {
      result = result.filter((t) => t.featured);
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "revenue":
      case "converting":
        result.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
        break;
    }

    return result;
  }, [testimonials, activeFilter, sortBy]);

  const handleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleClick = (id: string) => {
    const testimonial = [...allTestimonials, ...testimonials].find((t) => t.id === id);
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
    if (isDemoMode) {
      toast({ title: "Testimonial approved ✓" });
      return;
    }
    approveMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Testimonial approved ✓" });
      },
      onError: () => {
        toast({ title: "Failed to approve", variant: "destructive" });
      },
    });
  };

  const handleFeature = (id: string) => {
    if (isDemoMode) return;
    const t = allTestimonials.find((t) => t.id === id);
    if (!t) return;
    updateMutation.mutate({ id, is_featured: !t.featured });
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (isDemoMode) {
      toast({ title: "Testimonial deleted" });
      setDeleteTarget(null);
      return;
    }
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast({ title: "Testimonial deleted" });
        setDeleteTarget(null);
        if (selectedTestimonial?.id === deleteTarget) handleCloseDetail();
      },
      onError: () => {
        toast({ title: "Failed to delete", variant: "destructive" });
        setDeleteTarget(null);
      },
    });
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
      toast({ title: "Analysis failed", description: "Could not analyze this testimonial.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyFormLink = () => {
    if (firstForm?.slug) {
      const url = `${window.location.origin}/collect/${firstForm.slug}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    } else {
      navigate("/dashboard/forms");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="p-0 h-auto">
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Testimonials</h1>
            <p className="text-muted-foreground">{counts.all} testimonials</p>
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
            onBulkExport={() => toast({ title: "Exporting testimonials..." })}
            onBulkDelete={() => {
              selectedIds.forEach((id) => {
                if (!isDemoMode) deleteMutation.mutate(id);
              });
              setSelectedIds(new Set());
              toast({ title: "Testimonials deleted" });
            }}
          />
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedTestimonials.length > 0 ? (
          /* Grid/List */
          <div
            className={
              viewType === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {sortedTestimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <TestimonialCard
                  testimonial={testimonial}
                  isSelected={selectedIds.has(testimonial.id)}
                  onSelect={handleSelect}
                  onClick={handleClick}
                  onApprove={handleApprove}
                  onFeature={handleFeature}
                  onEdit={(id) => toast({ title: "Edit coming soon" })}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : allTestimonials.length === 0 && !searchQuery && activeFilter === "all" ? (
          /* Empty state — no testimonials at all */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No testimonials yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Share your collection form to start gathering testimonials from happy clients.
            </p>
            <Button onClick={copyFormLink} className="gap-2">
              <Link2 className="w-4 h-4" />
              {firstForm?.slug ? "Copy collection link" : "Create a form"}
            </Button>
          </div>
        ) : (
          /* Empty state — filters returned nothing */
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-foreground mb-2">No testimonials found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
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
                  location: undefined,
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
                onGenerateContent={(type) => toast({ title: `Generating ${type} content...` })}
                onClose={handleCloseDetail}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The testimonial will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
