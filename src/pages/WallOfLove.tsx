import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Link2, MoreHorizontal, PanelsTopLeft, Pencil, Plus, Trash2 } from "lucide-react";
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
import { copyText } from "@/components/shared/CopyButton";
import { useDeleteWall, useUpdateWall, useWalls } from "@/hooks/use-walls";
import { formatCompact, pluralize, readableTextColor, safeHex } from "@/lib/format";
import { PUBLIC_APP_URL } from "@/lib/config";

export default function WallOfLove() {
  const navigate = useNavigate();
  const { data: walls, isLoading, error, refetch } = useWalls();
  const deleteMutation = useDeleteWall();
  const updateMutation = useUpdateWall();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Walls | Happy Client";
  }, []);

  const list = walls ?? [];
  const deleteWall = list.find((w) => w.id === deleteId) ?? null;

  const confirmDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Wall deleted"),
      onError: () => toast.error("The wall was not deleted. Try again."),
    });
  };

  const copyLink = async (slug: string) => {
    const ok = await copyText(`${PUBLIC_APP_URL}/wall/${slug}`);
    if (ok) toast.success("Wall link copied");
    else toast.error("Could not copy the link.");
  };

  const togglePublished = (id: string, published: boolean) => {
    updateMutation.mutate(
      { id, is_published: published },
      {
        onSuccess: () => toast.success(published ? "Wall published" : "Wall unpublished"),
        onError: () => toast.error("That did not save. Try again."),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Walls"
        description="A wall is one public page with your best testimonials. Share the link anywhere."
        actions={
          list.length > 0 && (
            <Button asChild>
              <Link to="/dashboard/walls/new">
                <Plus className="mr-1.5" /> New wall
              </Link>
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState title="Your walls did not load" error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading walls">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={PanelsTopLeft}
          title="Build your first wall"
          description="Pick your best testimonials and get a page you can link from your website, your emails, and your social profiles."
          actions={
            <Button asChild>
              <Link to="/dashboard/walls/new">
                <Plus className="mr-1.5" /> Create a wall
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((wall) => {
            const published = !!wall.is_published;
            const count = wall.testimonial_ids?.length ?? 0;
            return (
              <li key={wall.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
                <Link
                  to={`/dashboard/walls/${wall.id}`}
                  className="flex h-24 items-center justify-center border-b border-border-subtle px-5 text-center"
                  style={{ backgroundColor: safeHex(wall.background_color, "#F8F5EE") }}
                  aria-label={`Edit ${wall.name}`}
                >
                  <span className="display line-clamp-2 text-xl" style={{ color: readableTextColor(safeHex(wall.background_color, "#F8F5EE")) }}>
                    {wall.header_title?.trim() || wall.name}
                  </span>
                </Link>

                <div className="flex items-start justify-between gap-3 px-5 pt-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-foreground">{wall.name}</h2>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/wall/{wall.slug}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8" aria-label={`More actions for ${wall.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => navigate(`/dashboard/walls/${wall.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {published && (
                        <DropdownMenuItem asChild>
                          <a href={`${PUBLIC_APP_URL}/wall/${wall.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> Open wall
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setDeleteId(wall.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3 px-5">
                  <p className="text-sm text-muted-foreground">
                    {pluralize(count, "testimonial")} · {formatCompact(wall.views ?? 0)} {(wall.views ?? 0) === 1 ? "view" : "views"}
                  </p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {published ? "Live" : "Draft"}
                    <Switch checked={published} onCheckedChange={(checked) => togglePublished(wall.id, checked)} aria-label={`Publish ${wall.name}`} />
                  </label>
                </div>

                <div className="mt-4 flex gap-2 border-t border-border-subtle px-5 py-3">
                  <Button className="flex-1" onClick={() => void copyLink(wall.slug)} disabled={!published} title={published ? undefined : "Publish the wall to share it"}>
                    <Link2 className="mr-1.5" /> Copy link
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/dashboard/walls/${wall.id}`}>
                      <Pencil className="mr-1.5" /> Edit
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteWall?.name ?? "this wall"}?</AlertDialogTitle>
            <AlertDialogDescription>
              The public link stops working at once. Your testimonials are not deleted. You cannot undo this.
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
