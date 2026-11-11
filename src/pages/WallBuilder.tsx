import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/States";
import { CopyButton } from "@/components/shared/CopyButton";
import { ScaledPreview } from "@/components/shared/ScaledPreview";
import { TestimonialPicker, useApprovedTestimonials } from "@/components/shared/TestimonialPicker";
import { WallView, type WallData } from "@/pages/PublicWall";
import { useCreateWall, useUpdateWall, useWall } from "@/hooks/use-walls";
import { safeHex } from "@/lib/format";
import { randomSuffix, sanitizeSlugInput, slugify } from "@/lib/slug";
import { PUBLIC_APP_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

type WallLayout = "masonry" | "grid" | "list";

interface WallState {
  name: string;
  slug: string;
  headerTitle: string;
  headerSubtitle: string;
  layout: WallLayout;
  columns: number;
  background: string;
  accent: string;
  published: boolean;
  testimonialIds: string[];
}

const DEFAULTS: WallState = {
  name: "",
  slug: "",
  headerTitle: "What our clients say",
  headerSubtitle: "",
  layout: "masonry",
  columns: 3,
  background: "#f8f5ee",
  accent: "#c0902a",
  published: true,
  testimonialIds: [],
};

const BACKGROUNDS = [
  { label: "Ivory", value: "#f8f5ee" },
  { label: "White", value: "#ffffff" },
  { label: "Stone", value: "#efece6" },
  { label: "Ink", value: "#161412" },
];

const LAYOUTS: { value: WallLayout; label: string; hint: string }[] = [
  { value: "masonry", label: "Staggered", hint: "Cards fit their text" },
  { value: "grid", label: "Even grid", hint: "Rows of equal height" },
  { value: "list", label: "One column", hint: "Easy to read top to bottom" },
];

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export default function WallBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const { data: existing, isLoading, error, refetch } = useWall(isNew ? "" : (id ?? ""));
  const { approved, isLoading: loadingTestimonials, resolve } = useApprovedTestimonials();
  const createMutation = useCreateWall();
  const updateMutation = useUpdateWall();

  const [state, setState] = useState<WallState>(DEFAULTS);
  const [initialized, setInitialized] = useState(isNew);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(isNew ? "" : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugTaken, setSlugTaken] = useState(false);
  const suffix = useRef(randomSuffix());

  const set = <K extends keyof WallState>(key: K, value: WallState[K]) => setState((prev) => ({ ...prev, [key]: value }));
  const snapshot = useMemo(() => JSON.stringify(state), [state]);
  const dirty = initialized && savedSnapshot !== null && snapshot !== savedSnapshot;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    document.title = `${isNew ? "New wall" : "Edit wall"} | Happy Client`;
  }, [isNew]);

  useEffect(() => {
    if (!existing || initialized) return;
    const loaded: WallState = {
      name: existing.name,
      slug: existing.slug,
      headerTitle: existing.header_title ?? "",
      headerSubtitle: existing.header_subtitle ?? "",
      layout: existing.layout === "grid" || existing.layout === "list" ? existing.layout : "masonry",
      columns: Math.max(1, Math.min(5, existing.columns ?? 3)),
      background: safeHex(existing.background_color, DEFAULTS.background),
      accent: safeHex(existing.accent_color, DEFAULTS.accent),
      published: existing.is_published ?? false,
      testimonialIds: existing.testimonial_ids ?? [],
    };
    setState(loaded);
    setSavedSnapshot(JSON.stringify(loaded));
    setInitialized(true);
  }, [existing, initialized]);

  // A new wall's link follows its name until someone edits the link by hand.
  useEffect(() => {
    if (!isNew || slugTouched) return;
    const base = slugify(state.name, 40);
    const next = base ? `${base}-${suffix.current}` : "";
    setState((prev) => (prev.slug === next ? prev : { ...prev, slug: next }));
  }, [isNew, slugTouched, state.name]);

  useEffect(() => {
    const slug = state.slug;
    if (slug.length < 3) {
      setSlugTaken(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("walls").select("id").eq("slug", slug).maybeSingle();
      setSlugTaken(!!data && data.id !== id);
    }, 400);
    return () => clearTimeout(timer);
  }, [state.slug, id]);

  const previewWall = useMemo<WallData>(
    () => ({
      id: id ?? "preview",
      name: state.name,
      slug: state.slug,
      header_title: state.headerTitle,
      header_subtitle: state.headerSubtitle,
      logo_url: existing?.logo_url ?? null,
      layout: state.layout,
      columns: state.columns,
      background_color: state.background,
      accent_color: state.accent,
      testimonials: resolve(state.testimonialIds),
    }),
    [id, state, existing?.logo_url, resolve],
  );

  const handleSave = () => {
    if (!state.name.trim()) {
      toast.error("Give the wall a name.");
      return;
    }
    if (state.slug.length < 3) {
      toast.error("The link name needs at least 3 characters.");
      return;
    }
    if (slugTaken) {
      toast.error("That link name is already used. Choose another one.");
      return;
    }
    if (state.published && state.testimonialIds.length === 0) {
      toast.error("Pick at least one testimonial, or turn off Live to save a draft.");
      return;
    }
    const payload = {
      name: state.name.trim(),
      slug: state.slug,
      header_title: state.headerTitle.trim(),
      header_subtitle: state.headerSubtitle.trim(),
      layout: state.layout,
      columns: state.columns,
      background_color: safeHex(state.background, DEFAULTS.background),
      accent_color: safeHex(state.accent, DEFAULTS.accent),
      is_published: state.published,
      testimonial_ids: state.testimonialIds,
    };
    const onError = (err: unknown) => {
      const code = (err as { code?: string } | null)?.code;
      toast.error(code === "23505" ? "That link name is already used. Choose another one." : "The wall did not save. Try again.");
    };

    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: (wall) => {
          setSavedSnapshot(snapshot);
          toast.success(state.published ? "Wall published" : "Draft saved");
          navigate(`/dashboard/walls/${wall.id}`, { replace: true });
        },
        onError,
      });
    } else {
      updateMutation.mutate(
        { id: id!, ...payload },
        {
          onSuccess: () => {
            setSavedSnapshot(snapshot);
            toast.success("Wall saved");
          },
          onError,
        },
      );
    }
  };

  const goBack = () => {
    if (dirty && !isNew && !window.confirm("You have changes that are not saved. Leave without saving?")) return;
    navigate("/dashboard/walls");
  };

  if (!isNew && isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4" role="status" aria-label="Loading wall">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!isNew && error) {
    return (
      <PageContainer>
        <ErrorState title="This wall did not load" error={new Error("It may have been deleted.")} onRetry={() => void refetch()} />
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard/walls")}>
            <ArrowLeft className="mr-1.5" /> Back to walls
          </Button>
        </div>
      </PageContainer>
    );
  }

  const link = `${PUBLIC_APP_URL}/wall/${state.slug}`;
  const isLive = !isNew && !!existing?.is_published;

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur md:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
            <ArrowLeft className="mr-1" /> Walls
          </Button>
          <Label htmlFor="wall-name" className="sr-only">Wall name</Label>
          <Input
            id="wall-name"
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Name this wall"
            maxLength={80}
            autoFocus={isNew}
            className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-2 text-base font-semibold hover:border-input focus-visible:bg-card sm:max-w-sm"
          />
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={state.published} onCheckedChange={(v) => set("published", v)} />
              <span className="hidden sm:inline">{state.published ? "Live" : "Draft"}</span>
            </label>
            {isLive && (
              <Button asChild variant="outline" size="sm">
                <a href={`${PUBLIC_APP_URL}/wall/${existing!.slug}`} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1.5" />
                </a>
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving || (!isNew && !dirty)}>
              {isSaving && <Loader2 className="mr-1.5 animate-spin" />}
              {isNew ? (state.published ? "Save and publish" : "Save draft") : dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          {isLive && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6">
              <h2 className="text-base font-semibold text-foreground">Your wall is live</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Link to it from your website menu, your email signature, or your social profiles.</p>
              <div className="mt-4 flex gap-2">
                <Input readOnly value={`${PUBLIC_APP_URL}/wall/${existing!.slug}`} onFocus={(e) => e.currentTarget.select()} className="font-mono text-sm md:text-sm" aria-label="Wall link" />
                <CopyButton text={`${PUBLIC_APP_URL}/wall/${existing!.slug}`} variant="default" size="default" toastMessage="Wall link copied" />
              </div>
            </section>
          )}

          <Panel title="Heading">
            <div>
              <Label htmlFor="wall-title">Headline</Label>
              <Input id="wall-title" className="mt-1.5" value={state.headerTitle} onChange={(e) => set("headerTitle", e.target.value)} maxLength={90} />
            </div>
            <div>
              <Label htmlFor="wall-subtitle">
                Line under the headline <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea id="wall-subtitle" className="mt-1.5 min-h-[64px] resize-y" rows={2} value={state.headerSubtitle} onChange={(e) => set("headerSubtitle", e.target.value)} maxLength={220} />
            </div>
          </Panel>

          <Panel title="Testimonials" description="Only approved testimonials can go on a wall.">
            <TestimonialPicker approved={approved} isLoading={loadingTestimonials} selected={state.testimonialIds} onChange={(ids) => set("testimonialIds", ids)} />
          </Panel>

          <Panel title="Layout">
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Layout">
              {LAYOUTS.map((layout) => {
                const selected = state.layout === layout.value;
                return (
                  <button
                    key={layout.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("layout", layout.value)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-colors",
                      selected ? "border-foreground bg-muted/40 ring-1 ring-foreground" : "border-border hover:border-border-hover",
                    )}
                  >
                    <span className="block text-sm font-medium text-foreground">{layout.label}</span>
                    <span className="block text-xs text-muted-foreground">{layout.hint}</span>
                  </button>
                );
              })}
            </div>
            {state.layout !== "list" && (
              <div>
                <Label>Columns on a wide screen: {state.columns}</Label>
                <Slider className="mt-3" value={[state.columns]} onValueChange={([v]) => set("columns", v)} min={2} max={4} step={1} aria-label="Columns on a wide screen" />
                <p className="mt-2 text-xs text-muted-foreground">Phones always show one column.</p>
              </div>
            )}
          </Panel>

          <Panel title="Colours">
            <div>
              <Label>Background</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {BACKGROUNDS.map((bg) => {
                  const selected = state.background.toLowerCase() === bg.value;
                  return (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() => set("background", bg.value)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                        selected ? "border-foreground font-medium text-foreground ring-1 ring-foreground" : "border-border text-muted-foreground hover:border-border-hover",
                      )}
                    >
                      <span className="h-4 w-4 rounded-full border border-border-hover" style={{ backgroundColor: bg.value }} aria-hidden="true" />
                      {bg.label}
                    </button>
                  );
                })}
                <input
                  type="color"
                  value={safeHex(state.background, DEFAULTS.background)}
                  onChange={(e) => set("background", e.target.value)}
                  className="h-9 w-11 cursor-pointer rounded-lg border border-input bg-card p-1"
                  aria-label="Custom background colour"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="wall-accent">Star colour</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="wall-accent"
                  type="color"
                  value={safeHex(state.accent, DEFAULTS.accent)}
                  onChange={(e) => set("accent", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-card p-1"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => set("accent", DEFAULTS.accent)}>
                  Reset to gold
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="Link" description="The public address of this wall.">
            <div>
              <Label htmlFor="wall-slug">Link name</Label>
              <div className="mt-1.5 flex items-center">
                <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">/wall/</span>
                <Input
                  id="wall-slug"
                  value={state.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", sanitizeSlugInput(e.target.value));
                  }}
                  className={cn("rounded-l-none font-mono", slugTaken && "border-destructive")}
                  aria-invalid={slugTaken || undefined}
                />
              </div>
              {slugTaken ? (
                <p role="alert" className="mt-1.5 text-sm text-destructive">That link name is already used. Choose another one.</p>
              ) : (
                state.slug && <p className="mt-1.5 break-all text-xs text-muted-foreground">{link}</p>
              )}
              {!isNew && <p className="mt-1.5 text-xs text-muted-foreground">If you change it, the old link stops working.</p>}
            </div>
          </Panel>
        </div>

        <aside className="lg:col-span-7" aria-label="Preview">
          <div className="lg:sticky lg:top-20">
            <p className="eyebrow mb-2">Preview on a wide screen</p>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border scrollbar-thin">
              <ScaledPreview designWidth={1200}>
                <WallView wall={previewWall} preview />
              </ScaledPreview>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
