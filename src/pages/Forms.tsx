import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Copy, ExternalLink, MoreHorizontal, Pencil, Eye, Trash2, FileText } from "lucide-react";
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
import { MOCK_FORMS } from "@/data/mock/forms";

export default function Forms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  const { data: realForms, isLoading } = useForms();
  const deleteMutation = useDeleteForm();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loading = isDemoMode ? false : isLoading;

  // Map DB forms to display shape
  const forms = isDemoMode
    ? MOCK_FORMS
    : (realForms ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        status: f.is_published ? ("active" as const) : ("inactive" as const),
        types: [
          ...(f.collect_text ? ["text" as const] : []),
          ...(f.collect_video ? ["video" as const] : []),
          ...(f.collect_audio ? ["audio" as const] : []),
        ],
        aiInterview: !!(f.custom_questions as any)?.ai_enabled,
        responses: f.submission_count ?? 0,
        completionRate: 0,
        lastResponse: undefined as string | undefined,
      }));

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
            <h1 className="text-3xl font-bold text-foreground">Collection Forms</h1>
            <p className="text-muted-foreground">Create ways to collect testimonials</p>
          </div>
          <Button onClick={() => navigate("/dashboard/forms/new/edit")}>
            <Plus className="w-4 h-4 mr-2" />
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
        ) : forms.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Create your first collection form</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Design a custom form to start gathering testimonials from your clients.
            </p>
            <Button onClick={() => navigate("/dashboard/forms/new/edit")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Form
            </Button>
          </div>
        ) : (
          /* Forms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form, index) => (
              <Card
                key={form.id}
                className="bg-card border hover:border-border-hover rounded-xl transition-all duration-150 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{form.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {form.types.includes("text") && <span>Text</span>}
                        {form.types.includes("video") && <span>Video</span>}
                        {form.types.includes("audio") && <span>Audio</span>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={form.status === "active" ? "default" : "secondary"} className={form.status === "active" ? "bg-success text-white" : ""}>
                      {form.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    {form.aiInterview && (
                      <Badge variant="outline" className="text-primary border-primary/30">AI Interview</Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Responses</span>
                      <span className="font-medium text-foreground">{form.responses}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-4">
                    Last response: {formatTimeAgo(form.lastResponse)}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(form.slug)}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create New Card */}
            <Card
              className="border-2 border-dashed border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-150 rounded-xl"
              onClick={() => navigate("/dashboard/forms/new/edit")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[280px]">
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Create New Form</h3>
                <p className="text-sm text-muted-foreground text-center">Design a custom form to collect testimonials</p>
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
