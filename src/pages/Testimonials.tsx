import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MessageSquare, Link2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Dialog as EditDialog, DialogContent as EditDialogContent, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle, DialogFooter as EditDialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useRejectTestimonial,
} from "@/hooks/use-testimonials";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [editForm, setEditForm] = useState({ author_name: "", author_title: "", author_company: "", content: "", rating: 5 });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeveloping, setIsDeveloping] = useState(false);
  const queryClient = useQueryClient();

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
  const { data: dbTestimonials, isLoading, error: testimonialsError, refetch } = useTestimonials(
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
        .maybeSingle();
      return data;
    },
  });

  const approveMutation = useApproveTestimonial();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonial();
  const rejectMutation = useRejectTestimonial();

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

  // Deep-link: open detail by :id when present
  useEffect(() => {
    if (!id) return;
    if (selectedTestimonial?.id === id) return;
    if (allTestimonials.length === 0) return;
    const found = allTestimonials.find((t) => t.id === id);
    if (found) {
      setSelectedTestimonial(found);
      setIsDetailOpen(true);
    } else if (!loading) {
      toast({ title: "Testimonial not found", variant: "destructive" });
      navigate("/dashboard/testimonials", { replace: true });
    }
  }, [id, allTestimonials, loading, selectedTestimonial?.id, toast, navigate]);

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

  // Locate the raw DB row for the selected testimonial (for developed_* + custom_fields + consent)
  const selectedDbRow = useMemo(() => {
    if (!selectedTestimonial) return null;
    return (allDbTestimonials ?? []).find((t) => t.id === selectedTestimonial.id)
      ?? (dbTestimonials ?? []).find((t) => t.id === selectedTestimonial.id)
      ?? null;
  }, [selectedTestimonial, allDbTestimonials, dbTestimonials]);

  const handleDevelop = async () => {
    if (!selectedTestimonial || isDemoMode) return;
    setIsDeveloping(true);
    try {
      const { data, error } = await supabase.functions.invoke("develop-testimonial", {
        body: { testimonial_id: selectedTestimonial.id },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast({ title: "Testimonial developed", description: "Draft ready — review before publishing." });
      await queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    } catch (err) {
      toast({
        title: "Develop failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setIsDeveloping(false);
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

  const handleReject = (id: string) => {
    if (isDemoMode) {
      toast({ title: "Testimonial rejected" });
      handleCloseDetail();
      return;
    }
    rejectMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Testimonial rejected" });
        handleCloseDetail();
      },
      onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
    });
  };

  const handleGenerateContent = async (type: string) => {
    if (!selectedTestimonial) return;
    if (isDemoMode) {
      toast({ title: `Generating ${type} content...` });
      return;
    }
    if (!user) return;
    const typeMap: Record<string, { id: string; title: string; subtitle: string; dbType: string }> = {
      twitter:   { id: "twitter",   title: "Twitter Thread",  subtitle: "Viral thread",       dbType: "twitter_thread" },
      linkedin:  { id: "linkedin",  title: "LinkedIn Post",   subtitle: "Professional post",  dbType: "linkedin_post" },
      graphic:   { id: "quote",     title: "Quote Graphic",   subtitle: "Shareable quote",    dbType: "quote_graphic" },
      casestudy: { id: "casestudy", title: "Case Study",      subtitle: "Mini success story", dbType: "case_study" },
      clip:      { id: "casestudy", title: "Video Highlight", subtitle: "Best moment",        dbType: "video_highlight" },
    };
    const info = typeMap[type];
    if (!info) return;
    toast({ title: `Generating ${info.title}...` });
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          testimonials: [{
            id: selectedTestimonial.id,
            name: selectedTestimonial.name,
            company: selectedTestimonial.company,
            content: selectedTestimonial.content,
            rating: selectedTestimonial.rating,
            revenue: selectedTestimonial.revenue ?? 0,
          }],
          contentType: info.id,
          contentTypeInfo: { title: info.title, subtitle: info.subtitle },
        },
      });
      if (error) throw error;
      const generated = (data as { content?: string })?.content;
      if (!generated) throw new Error("No content returned");

      await supabase.from("generated_content").insert({
        user_id: user.id,
        testimonial_ids: [selectedTestimonial.id],
        type: info.dbType as never,
        content: generated,
      });

      toast({ title: `${info.title} saved`, description: "View it in Content Library." });
      navigate("/dashboard/content/library");
    } catch (err) {
      console.error("Generate content error:", err);
      toast({ title: "Failed to generate content", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    }
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
    if (isDemoMode) {
      toast({ title: "Switch to live data to analyze real testimonials" });
      return;
    }
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

  const openEdit = (id: string) => {
    const t = allTestimonials.find((x) => x.id === id);
    if (!t) return;
    if (isDemoMode) {
      toast({ title: "Switch to live data to edit testimonials" });
      return;
    }
    setEditTarget(t);
    setEditForm({
      author_name: t.name ?? "",
      author_title: t.title ?? "",
      author_company: t.company ?? "",
      content: t.content ?? "",
      rating: t.rating ?? 5,
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    updateMutation.mutate(
      {
        id: editTarget.id,
        author_name: editForm.author_name.trim(),
        author_title: editForm.author_title.trim() || null,
        author_company: editForm.author_company.trim() || null,
        content: editForm.content,
        rating: Number(editForm.rating) || 0,
      },
      {
        onSuccess: () => {
          toast({ title: "Testimonial updated" });
          queryClient.invalidateQueries({ queryKey: ["testimonials"] });
          setEditTarget(null);
          setIsSavingEdit(false);
        },
        onError: (e) => {
          toast({ title: "Failed to update", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
          setIsSavingEdit(false);
        },
      }
    );
  };

  const confirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    if (isDemoMode) {
      toast({ title: `Deleted ${ids.length} testimonial${ids.length !== 1 ? "s" : ""}` });
      return;
    }
    let succeeded = 0;
    let failed = 0;
    ids.forEach((id) =>
      deleteMutation.mutate(id, {
        onSuccess: () => {
          succeeded++;
          if (succeeded + failed === ids.length) {
            if (failed === 0) toast({ title: `Deleted ${succeeded} testimonial${succeeded !== 1 ? "s" : ""}` });
            else toast({ title: `Deleted ${succeeded}, ${failed} failed`, variant: "destructive" });
          }
        },
        onError: () => {
          failed++;
          if (succeeded + failed === ids.length) {
            toast({ title: `Deleted ${succeeded}, ${failed} failed`, variant: "destructive" });
          }
        },
      })
    );
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

  const handleBulkExport = () => {
    const selected = allTestimonials.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) {
      toast({ title: "Select testimonials to export first" });
      return;
    }
    const rows = selected.map((t) => ({
      created_at: t.createdAt,
      author_name: t.name,
      author_company: t.company,
      content: t.content,
      rating: t.rating,
      type: t.type,
      status: t.status,
      source: t.source,
      revenue: t.revenue ?? 0,
    }));
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape((row as Record<string, unknown>)[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `testimonials-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${rows.length} testimonial${rows.length !== 1 ? "s" : ""}` });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Testimonials</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="tabular-nums">{counts.all}</span> total
              {counts.pending > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="tabular-nums">{counts.pending}</span> awaiting review
                </>
              )}
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
            onBulkExport={handleBulkExport}
            onBulkDelete={() => {
              if (selectedIds.size === 0) return;
              setBulkDeleteOpen(true);
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
        ) : testimonialsError && !isDemoMode ? (
          <div className="text-center py-20 border border-dashed border-destructive/30 rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Couldn't load testimonials</h3>
            <p className="text-sm text-muted-foreground mb-5">{testimonialsError instanceof Error ? testimonialsError.message : "Something went wrong."}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
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
                  onEdit={openEdit}
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
                  verified: !!(selectedDbRow as { consent_given?: boolean } | null)?.consent_given,
                  location: undefined,
                  developedContent: (selectedDbRow as { developed_content?: string | null } | null)?.developed_content ?? null,
                  developedPullQuote: (selectedDbRow as { developed_pull_quote?: string | null } | null)?.developed_pull_quote ?? null,
                  developedOneLiner: (selectedDbRow as { developed_one_liner?: string | null } | null)?.developed_one_liner ?? null,
                  customFields: (selectedDbRow as { custom_fields?: Record<string, unknown> | null } | null)?.custom_fields ?? null,
                  consentGiven: !!(selectedDbRow as { consent_given?: boolean } | null)?.consent_given,
                }}
                aiAnalysis={aiAnalysis}
                revenueData={
                  selectedTestimonial.revenue
                    ? {
                        total: selectedTestimonial.revenue,
                      }
                    : undefined
                }
                isAnalyzing={isAnalyzing}
                onRefreshAnalysis={analyzeTestimonial}
                onDevelop={handleDevelop}
                isDeveloping={isDeveloping}
                onApprove={() => {
                  handleApprove(selectedTestimonial.id);
                  handleCloseDetail();
                }}
                onReject={() => handleReject(selectedTestimonial.id)}
                onFeature={() => handleFeature(selectedTestimonial.id)}
                onGenerateContent={handleGenerateContent}
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

        {/* Bulk delete confirmation */}
        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.size} testimonial{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit dialog */}
        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-w-lg">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Edit testimonial</h2>
                <p className="text-xs text-muted-foreground">Update the author details, content, and rating.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editForm.author_name} onChange={(e) => setEditForm((f) => ({ ...f, author_name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input id="edit-title" value={editForm.author_title} onChange={(e) => setEditForm((f) => ({ ...f, author_title: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-company">Company</Label>
                <Input id="edit-company" value={editForm.author_company} onChange={(e) => setEditForm((f) => ({ ...f, author_company: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea id="edit-content" rows={5} value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="edit-rating">Rating (0–5)</Label>
                <Input id="edit-rating" type="number" min={0} max={5} step={1} value={editForm.rating} onChange={(e) => setEditForm((f) => ({ ...f, rating: Number(e.target.value) }))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isSavingEdit}>Cancel</Button>
                <Button onClick={saveEdit} disabled={isSavingEdit || !editForm.author_name.trim() || !editForm.content.trim()}>
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
