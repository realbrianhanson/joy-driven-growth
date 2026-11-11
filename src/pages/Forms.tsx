import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, FileText, Mic, MoreHorizontal, Pencil, PenLine, Plus, Send, Sparkles, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { ShareFormDialog } from "@/components/form-builder/ShareFormDialog";
import { useDeleteForm, useForms, useUpdateForm } from "@/hooks/use-forms";
import { pluralize, timeAgo } from "@/lib/format";
import { PUBLIC_APP_URL } from "@/lib/config";

export default function Forms() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: forms, isLoading, error, refetch } = useForms();
  const deleteMutation = useDeleteForm();
  const updateMutation = useUpdateForm();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    document.title = "Forms | Happy Client";
  }, []);

  // After a new form is saved, the builder sends people here with ?share=<id>.
  useEffect(() => {
    const share = searchParams.get("share");
    if (!share) return;
    setShareId(share);
    setJustCreated(searchParams.get("new") === "1");
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const list = forms ?? [];
  const shareForm = list.find((f) => f.id === shareId) ?? null;
  const deleteForm = list.find((f) => f.id === deleteId) ?? null;

  const confirmDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Form deleted"),
      onError: () => toast.error("The form was not deleted. Try again."),
    });
  };

  const togglePublished = (id: string, published: boolean) => {
    updateMutation.mutate(
      { id, is_published: published },
      {
        onSuccess: () => toast.success(published ? "Form turned on" : "Form turned off"),
        onError: () => toast.error("That did not save. Try again."),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Forms"
        description="A form is the link you send to clients. Their answers arrive in Testimonials."
        actions={
          list.length > 0 && (
            <Button asChild>
              <Link to="/dashboard/forms/new">
                <Plus className="mr-1.5" /> New form
              </Link>
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState title="Your forms did not load" error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading forms">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Make your first form"
          description="Pick a set of questions and you get one link to send to every client. They can write, record a video, or record their voice."
          actions={
            <Button asChild>
              <Link to="/dashboard/forms/new">
                <Plus className="mr-1.5" /> Create a form
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((form) => {
            const published = !!form.is_published;
            const aiEnabled = (form.custom_questions as { ai_enabled?: boolean } | null)?.ai_enabled === true;
            const responses = form.submission_count ?? 0;
            return (
              <li key={form.id} className="flex flex-col rounded-2xl border border-border bg-card shadow-subtle">
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground">
                      <Link to={`/dashboard/forms/${form.id}/edit`} className="hover:underline hover:underline-offset-4">
                        {form.name}
                      </Link>
                    </h2>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/collect/{form.slug}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-1.5 h-8 w-8" aria-label={`More actions for ${form.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => navigate(`/dashboard/forms/${form.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`${PUBLIC_APP_URL}/collect/${form.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Open form
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setDeleteId(form.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 px-5 pt-3 text-xs text-muted-foreground">
                  {form.collect_text && (
                    <span className="inline-flex items-center gap-1"><PenLine className="h-3.5 w-3.5" /> Written</span>
                  )}
                  {form.collect_video && (
                    <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> Video</span>
                  )}
                  {form.collect_audio && (
                    <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> Voice</span>
                  )}
                  {aiEnabled && (
                    <span className="inline-flex items-center gap-1 text-gold-deep"><Sparkles className="h-3.5 w-3.5" /> Guided interview</span>
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 px-5">
                  <div>
                    <p className="display text-[2rem] tabular-nums text-foreground">{responses}</p>
                    <p className="text-xs text-muted-foreground">
                      {responses === 1 ? "response" : "responses"}
                      {responses > 0 && form.updated_at ? ` · updated ${timeAgo(form.updated_at)}` : ""}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {published ? "On" : "Off"}
                    <Switch checked={published} onCheckedChange={(checked) => togglePublished(form.id, checked)} aria-label={`Accept answers on ${form.name}`} />
                  </label>
                </div>

                <div className="mt-5 flex gap-2 border-t border-border-subtle px-5 py-3">
                  <Button className="flex-1" onClick={() => { setJustCreated(false); setShareId(form.id); }}>
                    <Send className="mr-1.5" /> Share
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/dashboard/forms/${form.id}/edit`}>
                      <Pencil className="mr-1.5" /> Edit
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {list.length > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {pluralize(list.filter((f) => f.is_published).length, "form")} accepting answers.
        </p>
      )}

      <ShareFormDialog open={!!shareForm} onOpenChange={(open) => !open && setShareId(null)} form={shareForm} justCreated={justCreated} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteForm?.name ?? "this form"}?</AlertDialogTitle>
            <AlertDialogDescription>
              The link stops working at once. Testimonials you already collected stay in your account. You cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
