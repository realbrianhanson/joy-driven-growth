import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpDown, Check, ChevronDown, Download, FileUp, Link2, MessageSquareQuote, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { copyText } from "@/components/shared/CopyButton";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { TestimonialDrawer } from "@/components/testimonials/TestimonialDrawer";
import { TestimonialFormDialog } from "@/components/testimonials/TestimonialFormDialog";
import { ImportDialog } from "@/components/testimonials/ImportDialog";
import { useForms } from "@/hooks/use-forms";
import {
  TESTIMONIAL_PAGE_LIMIT,
  useDeleteTestimonials,
  useSetTestimonialStatus,
  useTestimonials,
  useUpdateTestimonial,
} from "@/hooks/use-testimonials";
import { pluralize } from "@/lib/format";
import { downloadTextFile, sourceLabel, toCsv, type TestimonialRow, type TestimonialStatus } from "@/lib/testimonial";
import { PUBLIC_APP_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

type Tab = "all" | "pending" | "approved" | "featured" | "rejected";
type TypeFilter = "any" | "text" | "video" | "audio";
type Sort = "newest" | "oldest" | "rating" | "sales";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Needs review" },
  { key: "approved", label: "Approved" },
  { key: "featured", label: "Featured" },
  { key: "rejected", label: "Rejected" },
];

const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  rating: "Highest rated",
  sales: "Most sales",
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  any: "All formats",
  text: "Written",
  video: "Video",
  audio: "Voice",
};

function matchesSearch(t: TestimonialRow, query: string): boolean {
  const haystack = [t.author_name, t.author_company, t.author_title, t.content, ...(t.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function exportRows(rows: TestimonialRow[]) {
  const csv = toCsv(
    rows.map((t) => ({
      date: t.created_at,
      name: t.author_name,
      title: t.author_title ?? "",
      company: t.author_company ?? "",
      email: t.author_email ?? "",
      testimonial: t.content ?? "",
      rating: t.rating ?? "",
      format: t.type ?? "text",
      status: t.status ?? "pending",
      featured: t.is_featured ? "yes" : "no",
      source: sourceLabel(t.source),
      permission: t.consent_given ? "yes" : "no",
      sales: Number(t.revenue_attributed ?? 0),
      video_url: t.video_url ?? "",
      audio_url: t.audio_url ?? "",
      tags: (t.tags ?? []).join("; "),
    })),
  );
  downloadTextFile(`testimonials-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

export default function Testimonials() {
  const navigate = useNavigate();
  const { id: openId } = useParams();

  const { data, isLoading, error, refetch } = useTestimonials();
  const { data: forms } = useForms();
  const statusMutation = useSetTestimonialStatus();
  const updateMutation = useUpdateTestimonial();
  const deleteMutation = useDeleteTestimonials();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("any");
  const [sort, setSort] = useState<Sort>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  const all = useMemo(() => data ?? [], [data]);
  const byId = useMemo(() => new Map(all.map((t) => [t.id, t])), [all]);
  const openTestimonial = openId ? (byId.get(openId) ?? null) : null;
  const editTestimonial = editId ? (byId.get(editId) ?? null) : null;
  const publishedForm = (forms ?? []).find((f) => f.is_published);

  useEffect(() => {
    document.title = "Testimonials | Happy Client";
  }, []);

  // A link to a testimonial that no longer exists goes back to the list.
  useEffect(() => {
    if (openId && !isLoading && !error && data && !byId.has(openId)) {
      toast.error("That testimonial no longer exists.");
      navigate("/dashboard/testimonials", { replace: true });
    }
  }, [openId, isLoading, error, data, byId, navigate]);

  // Drop selections for rows that were deleted.
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => byId.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [byId]);

  const counts = useMemo<Record<Tab, number>>(
    () => ({
      all: all.length,
      pending: all.filter((t) => (t.status ?? "pending") === "pending").length,
      approved: all.filter((t) => t.status === "approved").length,
      featured: all.filter((t) => t.is_featured).length,
      rejected: all.filter((t) => t.status === "rejected").length,
    }),
    [all],
  );

  const visible = useMemo(() => {
    const list = all.filter((t) => {
      const status = t.status ?? "pending";
      if (tab === "featured" ? !t.is_featured : tab !== "all" && status !== tab) return false;
      if (typeFilter !== "any" && (t.type ?? "text") !== typeFilter) return false;
      if (search.trim() && !matchesSearch(t, search)) return false;
      return true;
    });
    const time = (t: TestimonialRow) => new Date(t.created_at).getTime();
    const sorters: Record<Sort, (a: TestimonialRow, b: TestimonialRow) => number> = {
      newest: (a, b) => time(b) - time(a),
      oldest: (a, b) => time(a) - time(b),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || time(b) - time(a),
      sales: (a, b) => Number(b.revenue_attributed ?? 0) - Number(a.revenue_attributed ?? 0) || time(b) - time(a),
    };
    return [...list].sort(sorters[sort]);
  }, [all, tab, typeFilter, search, sort]);

  const filtersActive = tab !== "all" || typeFilter !== "any" || search.trim().length > 0;
  const selectedIds = [...selected];
  const allVisibleSelected = visible.length > 0 && visible.every((t) => selected.has(t.id));

  const setStatus = (ids: string[], status: TestimonialStatus) => {
    statusMutation.mutate(
      { ids, status },
      {
        onSuccess: () => {
          const label = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "moved to review";
          toast.success(ids.length === 1 ? `Testimonial ${label}` : `${ids.length} testimonials ${label}`);
          if (ids.length > 1) setSelected(new Set());
        },
        onError: () => toast.error("That did not save. Try again."),
      },
    );
  };

  const setFeatured = (id: string, featured: boolean) => {
    updateMutation.mutate(
      { id, is_featured: featured },
      { onError: () => toast.error("That did not save. Try again.") },
    );
  };

  const confirmDelete = () => {
    const ids = deleteIds;
    setDeleteIds([]);
    deleteMutation.mutate(ids, {
      onSuccess: () => {
        toast.success(ids.length === 1 ? "Testimonial deleted" : `${ids.length} testimonials deleted`);
        setSelected(new Set());
        if (openId && ids.includes(openId)) navigate("/dashboard/testimonials", { replace: true });
      },
      onError: () => toast.error("The delete failed. Try again."),
    });
  };

  const copyFormLink = async () => {
    if (!publishedForm) return;
    const ok = await copyText(`${PUBLIC_APP_URL}/collect/${publishedForm.slug}`);
    if (ok) toast.success("Form link copied. Send it to a client.");
    else toast.error("Could not copy the link.");
  };

  const toggleSelectAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((t) => t.id)));
  };

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-1.5" /> Add testimonials <ChevronDown className="ml-1.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onSelect={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add one you already have
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setImportOpen(true)}>
          <FileUp className="mr-2 h-4 w-4" /> Import a spreadsheet
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {publishedForm ? (
          <DropdownMenuItem onSelect={() => void copyFormLink()}>
            <Link2 className="mr-2 h-4 w-4" /> Copy your form link
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => navigate("/dashboard/forms/new")}>
            <Link2 className="mr-2 h-4 w-4" /> Create a form to collect new ones
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Testimonials"
        description={
          isLoading
            ? "Loading"
            : counts.all === 0
              ? "Everything your clients send lands here."
              : `${pluralize(counts.all, "testimonial")}${counts.pending > 0 ? ` · ${counts.pending} to review` : ""}`
        }
        actions={
          <>
            {counts.all > 0 && (
              <Button variant="outline" onClick={() => exportRows(all)}>
                <Download className="mr-1.5" /> Export
              </Button>
            )}
            {addMenu}
          </>
        }
      />

      {error ? (
        <ErrorState title="Your testimonials did not load" error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading testimonials">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : counts.all === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Get your first testimonial"
          description="Start with kind words you already have, like an email or a text from a client. Then send your form link to get new ones."
          actions={
            <>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="mr-1.5" /> Add one you already have
              </Button>
              {publishedForm ? (
                <Button variant="outline" onClick={() => void copyFormLink()}>
                  <Link2 className="mr-1.5" /> Copy your form link
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link to="/dashboard/forms/new">Create a collection form</Link>
                </Button>
              )}
            </>
          }
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search names, companies, words or tags"
                aria-label="Search testimonials"
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {TYPE_LABELS[typeFilter]} <ChevronDown className="ml-1.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Format</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                    {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((key) => (
                      <DropdownMenuRadioItem key={key} value={key}>{TYPE_LABELS[key]}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ArrowUpDown className="mr-1.5" /> {SORT_LABELS[sort]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Sort</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
                    {(Object.keys(SORT_LABELS) as Sort[]).map((key) => (
                      <DropdownMenuRadioItem key={key} value={key}>{SORT_LABELS[key]}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border scrollbar-thin" role="tablist" aria-label="Filter by status">
            {TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm transition-colors",
                    active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums leading-none",
                      key === "pending" && counts.pending > 0 ? "bg-gold-light text-gold-deep" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {counts[key]}
                  </span>
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
                </button>
              );
            })}
          </div>

          {selected.size > 0 && (
            <div className="sticky top-16 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground bg-card px-4 py-2.5 shadow-hover md:top-3">
              <p className="text-sm text-foreground">
                <strong className="tabular-nums">{selected.size}</strong> selected
                <button type="button" onClick={toggleSelectAll} className="ml-3 text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {allVisibleSelected ? "Clear" : `Select all ${visible.length}`}
                </button>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button size="sm" onClick={() => setStatus(selectedIds, "approved")} disabled={statusMutation.isPending}>
                  <Check className="mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(selectedIds, "rejected")} disabled={statusMutation.isPending}>
                  <X className="mr-1" /> Reject
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportRows(all.filter((t) => selected.has(t.id)))}>
                  <Download className="mr-1" /> Export
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive-light hover:text-destructive" onClick={() => setDeleteIds(selectedIds)}>
                  <Trash2 className="mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <h3 className="display text-2xl text-foreground">Nothing matches</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {tab === "pending" && !search.trim() && typeFilter === "any"
                  ? "You are all caught up. Nothing is waiting for review."
                  : "Try a different search or filter."}
              </p>
              {filtersActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5"
                  onClick={() => {
                    setSearch("");
                    setTab("all");
                    setTypeFilter("any");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((t) => (
                <TestimonialCard
                  key={t.id}
                  testimonial={t}
                  selected={selected.has(t.id)}
                  onSelect={(id, isSelected) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (isSelected) next.add(id);
                      else next.delete(id);
                      return next;
                    })
                  }
                  onOpen={(id) => navigate(`/dashboard/testimonials/${id}`)}
                  onStatus={(id, status) => setStatus([id], status)}
                  onFeature={setFeatured}
                  onEdit={setEditId}
                  onDelete={(id) => setDeleteIds([id])}
                />
              ))}
            </div>
          )}

          {all.length >= TESTIMONIAL_PAGE_LIMIT && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Showing your newest {TESTIMONIAL_PAGE_LIMIT.toLocaleString()} testimonials.
            </p>
          )}
        </>
      )}

      <TestimonialDrawer
        testimonial={openTestimonial}
        open={!!openTestimonial}
        onClose={() => navigate("/dashboard/testimonials")}
        onStatus={(id, status) => setStatus([id], status)}
        onFeature={setFeatured}
        onEdit={setEditId}
        onDelete={(id) => setDeleteIds([id])}
      />

      <TestimonialFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <TestimonialFormDialog open={!!editTestimonial} onOpenChange={(open) => !open && setEditId(null)} testimonial={editTestimonial} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteIds.length === 1 ? "Delete this testimonial?" : `Delete ${deleteIds.length} testimonials?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes {deleteIds.length === 1 ? "it" : "them"} from every wall and widget. You cannot undo it.
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
