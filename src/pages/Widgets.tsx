import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Code2, ExternalLink, LayoutGrid, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { normalizeWidgetLayout } from "@/components/shared/WidgetRenderer";
import { useDeleteWidget, useUpdateWidget, useWidgets } from "@/hooks/use-widgets";
import { formatCompact, pluralize } from "@/lib/format";
import { PUBLIC_APP_URL } from "@/lib/config";
import { WIDGET_LAYOUTS, widgetEmbedCode } from "@/lib/widgets";

export default function Widgets() {
  const navigate = useNavigate();
  const { data: widgets, isLoading, error, refetch } = useWidgets();
  const deleteMutation = useDeleteWidget();
  const updateMutation = useUpdateWidget();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Widgets | Happy Client";
  }, []);

  const list = widgets ?? [];
  const deleteWidget = list.find((w) => w.id === deleteId) ?? null;

  const confirmDelete = () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Widget deleted"),
      onError: () => toast.error("The widget was not deleted. Try again."),
    });
  };

  const copyCode = async (id: string) => {
    const ok = await copyText(widgetEmbedCode(id));
    if (ok) toast.success("Embed code copied", { description: "Paste it into your website where the testimonials should appear." });
    else toast.error("Could not copy the code.");
  };

  const toggleActive = (id: string, active: boolean) => {
    updateMutation.mutate(
      { id, is_active: active },
      {
        onSuccess: () => toast.success(active ? "Widget turned on" : "Widget turned off"),
        onError: () => toast.error("That did not save. Try again."),
      },
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Widgets"
        description="A widget shows testimonials on your own website. You paste one line of code, once."
        actions={
          list.length > 0 && (
            <Button asChild>
              <Link to="/dashboard/widgets/new">
                <Plus className="mr-1.5" /> New widget
              </Link>
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState title="Your widgets did not load" error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading widgets">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Put testimonials on your website"
          description="Choose a layout, pick the testimonials, and copy one line of code. It works on any site that lets you paste custom code."
          actions={
            <Button asChild>
              <Link to="/dashboard/widgets/new">
                <Plus className="mr-1.5" /> Create a widget
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((widget) => {
            const layout = WIDGET_LAYOUTS[normalizeWidgetLayout(widget.type)];
            const active = widget.is_active !== false;
            const count = widget.testimonial_ids?.length ?? 0;
            return (
              <li key={widget.id} className="flex flex-col rounded-2xl border border-border bg-card shadow-subtle">
                <div className="flex items-start justify-between gap-3 px-5 pt-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-light">
                      <layout.icon className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">
                        <Link to={`/dashboard/widgets/${widget.id}`} className="hover:underline hover:underline-offset-4">
                          {widget.name}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {layout.label} · {pluralize(count, "testimonial")}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 -mt-1.5 h-8 w-8" aria-label={`More actions for ${widget.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => navigate(`/dashboard/widgets/${widget.id}`)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`${PUBLIC_APP_URL}/embed/widget/${widget.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Open live widget
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setDeleteId(widget.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 px-5">
                  <div>
                    <p className="display text-[2rem] tabular-nums text-foreground">{formatCompact(widget.impressions ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{(widget.impressions ?? 0) === 1 ? "view" : "views"}</p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {active ? "On" : "Off"}
                    <Switch checked={active} onCheckedChange={(checked) => toggleActive(widget.id, checked)} aria-label={`Show ${widget.name} on your website`} />
                  </label>
                </div>

                <div className="mt-5 flex gap-2 border-t border-border-subtle px-5 py-3">
                  <Button className="flex-1" onClick={() => void copyCode(widget.id)}>
                    <Code2 className="mr-1.5" /> Copy code
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/dashboard/widgets/${widget.id}`}>
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
            <AlertDialogTitle>Delete {deleteWidget?.name ?? "this widget"}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from every page where you pasted its code. Your testimonials are not deleted. You cannot undo this.
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
