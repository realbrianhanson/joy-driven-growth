import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Copy, ExternalLink, MoreHorizontal, Pencil, Trash2, FileText, Sparkles, Video, Mic, Type, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useForms, useDeleteForm } from "@/hooks/use-forms";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { MOCK_FORMS } from "@/data/mock/forms";

export default function Forms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const { workspaceOwnerId } = useWorkspace();
  const { data: realForms, isLoading, error: formsError, refetch } = useForms();
  const deleteMutation = useDeleteForm();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loading = isDemoMode ? false : isLoading;

  // Latest testimonial per form (one cheap query, grouped client-side)
  const formIds = (realForms ?? []).map((f) => f.id);
  const { data: latestByForm } = useQuery({
    queryKey: ["forms-latest-response", workspaceOwnerId, formIds.join(",")],
    enabled: !isDemoMode && !!workspaceOwnerId && formIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("form_id, created_at")
        .eq("user_id", workspaceOwnerId!)
        .in("form_id", formIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        const fid = (row as any).form_id as string | null;
        if (fid && !map[fid]) map[fid] = (row as any).created_at as string;
      }
      return map;
    },
  });

  // Map DB forms to display shape
  const mapForm = (f: any) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        status: (f.is_published ?? f.status === "active") ? ("active" as const) : ("inactive" as const),
        types: f.types ?? [
          ...(f.collect_text ? ["text" as const] : []),
          ...(f.collect_video ? ["video" as const] : []),
          ...(f.collect_audio ? ["audio" as const] : []),
        ],
        responses: f.submission_count ?? 0,
        aiInterview: !!(f.custom_questions as any)?.ai_enabled,
        lastResponse: isDemoMode ? undefined : latestByForm?.[f.id],
        primaryColor: f.primary_color ?? "#6366F1",
        createdAt: f.created_at,
  });

  const forms = isDemoMode
    ? MOCK_FORMS.map(mapForm)
    : (realForms ?? []).map(mapForm);

  const activeCount = forms.filter((f) => f.status === "active").length;

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "No responses yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/collect/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: url });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (isDemoMode) {
      toast({ title: "Form deleted" });
      setDeleteTarget(null);
      return;
    }
    deleteMutation.mutate(deleteTarget, {
      onSuccess: () => {
        toast({ title: "Form deleted" });
        setDeleteTarget(null);
      },
      onError: () => {
        toast({ title: "Failed to delete form", variant: "destructive" });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Collection Forms</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="tabular-nums">{forms.length}</span> total
              {activeCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="tabular-nums">{activeCount}</span> active
                </>
              )}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/dashboard/forms/new/edit")}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Form
          </Button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : formsError && !isDemoMode ? (
          <div className="text-center py-24 border border-dashed border-destructive/30 rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Couldn't load your forms</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">{formsError instanceof Error ? formsError.message : "Something went wrong."}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : forms.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Create your first collection form</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              Design a custom form to start gathering testimonials from your clients.
            </p>
            <Button size="sm" onClick={() => navigate("/dashboard/forms/new/edit")}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Form
            </Button>
          </div>
        ) : (
          /* Forms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form, index) => (
              <Card
                key={form.id}
                className="bg-card border border-border hover:border-border-hover rounded-xl transition-colors duration-150 animate-fade-in-up shadow-none"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${form.status === "active" ? "bg-success" : "bg-muted-foreground/40"}`}
                          aria-hidden
                        />
                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                          {form.status === "active" ? "Active" : "Inactive"}
                        </span>
                        {form.aiInterview && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium text-primary">
                            <Sparkles className="w-3 h-3" /> AI
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate text-[15px]">{form.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        {form.types.includes("text") && (
                          <span className="inline-flex items-center gap-1"><Type className="w-3 h-3" /> Text</span>
                        )}
                        {form.types.includes("video") && (
                          <span className="inline-flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>
                        )}
                        {form.types.includes("audio") && (
                          <span className="inline-flex items-center gap-1"><Mic className="w-3 h-3" /> Audio</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 -mr-1 -mt-1 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyLink(form.slug)}>
                          <Copy className="w-4 h-4 mr-2" /> Copy link
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(form.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-baseline justify-between pt-3 mt-3 border-t border-border">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Responses</div>
                      <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{form.responses}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Last</div>
                      <div className="text-xs text-foreground tabular-nums mt-1">{formatTimeAgo(form.lastResponse)}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}>
                      <Pencil className="w-3 h-3 mr-1.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => copyLink(form.slug)}>
                      <ExternalLink className="w-3 h-3 mr-1.5" /> Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create New Card */}
            <Card
              className="border border-dashed border-border bg-transparent hover:border-primary/50 hover:bg-primary-light/40 cursor-pointer transition-colors duration-150 rounded-xl shadow-none"
              onClick={() => navigate("/dashboard/forms/new/edit")}
            >
              <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[240px]">
                <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-[15px] mb-1">Create New Form</h3>
                <p className="text-xs text-muted-foreground text-center">Design a custom form to collect testimonials</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete form?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone. The form and its settings will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
