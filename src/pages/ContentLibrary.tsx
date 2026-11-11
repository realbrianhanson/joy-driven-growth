import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, PenLine, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { CopyButton } from "@/components/shared/CopyButton";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useWorkspace } from "@/hooks/use-workspace";
import { contentTypeLabel, readableStoredContent, storedStructure } from "@/lib/content";
import { formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

type SavedContent = Database["public"]["Tables"]["generated_content"]["Row"];

/** Every draft the content generator has written, newest first. */
export default function ContentLibrary() {
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [openItem, setOpenItem] = useState<SavedContent | null>(null);
  const [deleteItem, setDeleteItem] = useState<SavedContent | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["generated-content", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async (): Promise<SavedContent[]> => {
      const { data: rows, error: queryError } = await supabase
        .from("generated_content")
        .select("*")
        .eq("user_id", workspaceOwnerId!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (queryError) throw queryError;
      return rows ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("generated_content").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["generated-content"] });
      toast.success("Draft deleted");
    },
    onError: () => toast.error("The draft was not deleted. Try again."),
  });

  const items = useMemo(
    () => (data ?? []).map((row) => ({ row, text: readableStoredContent(row.type, row.content) })),
    [data],
  );

  const typesInUse = useMemo(() => [...new Set(items.map((item) => item.row.type as string))], [items]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(
      (item) => (typeFilter === "all" || item.row.type === typeFilter) && (!query || item.text.toLowerCase().includes(query)),
    );
  }, [items, search, typeFilter]);

  const newDraftButton = (
    <Button asChild>
      <Link to="/dashboard/content">
        <PenLine className="mr-2 h-4 w-4" />
        New draft
      </Link>
    </Button>
  );

  const openStructure = openItem ? storedStructure(openItem.metadata) : null;
  const openText = openItem ? readableStoredContent(openItem.type, openItem.content) : "";

  return (
    <PageContainer>
      <PageHeader
        title="Saved content"
        description={
          items.length > 0 ? `${pluralize(items.length, "draft")} written from your testimonials.` : "Every draft you write is kept here."
        }
        actions={newDraftButton}
      />

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading saved content">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No drafts yet"
          description="Pick a testimonial and a format, and AI writes a first draft from your client's own words."
          actions={newDraftButton}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by format">
              {["all", ...typesInUse].map((type) => (
                <button
                  key={type}
                  type="button"
                  role="tab"
                  aria-selected={typeFilter === type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    typeFilter === type ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {type === "all" ? "All" : contentTypeLabel(type)}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search drafts"
                aria-label="Search drafts"
                className="pl-10"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
              Nothing matches. Clear the search or pick another format.
            </p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map(({ row, text }) => (
                <li key={row.id} className="card-hover flex flex-col rounded-2xl border border-border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="eyebrow">{contentTypeLabel(row.type)}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{formatDate(row.created_at)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenItem(row)}
                    className="flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open ${contentTypeLabel(row.type)} from ${formatDate(row.created_at)}`}
                  >
                    <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{text}</p>
                  </button>
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                    <CopyButton text={text} toastMessage="Copied" />
                    <Button variant="ghost" size="sm" onClick={() => setOpenItem(row)}>
                      Open
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteItem(row)}
                      aria-label="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog open={!!openItem} onOpenChange={(open) => !open && setOpenItem(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {openItem && (
            <>
              <DialogHeader>
                <DialogTitle className="display text-2xl font-normal">{contentTypeLabel(openItem.type)}</DialogTitle>
                <DialogDescription>Written on {formatDate(openItem.created_at)}. Read it against the client's words before you post it.</DialogDescription>
              </DialogHeader>
              {openStructure ? (
                <ContentRenderer kind={openStructure.kind} data={openStructure.data} />
              ) : (
                <p className="whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-5 text-[0.9375rem] leading-relaxed text-foreground">
                  {openText}
                </p>
              )}
              <div>
                <CopyButton text={openText} label="Copy all" size="default" variant="default" toastMessage="Copied" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>The draft is removed from your library. The testimonial it came from stays.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteItem) remove.mutate(deleteItem.id);
                setDeleteItem(null);
              }}
            >
              Delete draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
