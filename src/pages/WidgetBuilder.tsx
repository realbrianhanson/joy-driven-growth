import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, ExternalLink, Loader2, Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageContainer } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/States";
import { CopyButton } from "@/components/shared/CopyButton";
import { ScaledPreview } from "@/components/shared/ScaledPreview";
import { TestimonialPicker, useApprovedTestimonials } from "@/components/shared/TestimonialPicker";
import { normalizeWidgetLayout, WidgetRenderer, type WidgetLayout, type WidgetTheme } from "@/components/shared/WidgetRenderer";
import { useCreateWidget, useUpdateWidget, useWidget } from "@/hooks/use-widgets";
import { WIDGET_LAYOUTS, widgetEmbedCode } from "@/lib/widgets";
import { PUBLIC_APP_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

const THEMES: { value: WidgetTheme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "auto", label: "Match visitor", icon: SunMoon },
];

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

interface WidgetState {
  name: string;
  layout: WidgetLayout;
  theme: WidgetTheme;
  autoRotate: boolean;
  showRating: boolean;
  showDate: boolean;
  active: boolean;
  testimonialIds: string[];
}

const DEFAULTS: WidgetState = {
  name: "",
  layout: "carousel",
  theme: "light",
  autoRotate: true,
  showRating: true,
  showDate: false,
  active: true,
  testimonialIds: [],
};

export default function WidgetBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNew = !id || id === "new";

  const { data: existing, isLoading, error, refetch } = useWidget(isNew ? "" : (id ?? ""));
  const { approved, isLoading: loadingTestimonials, resolve } = useApprovedTestimonials();
  const createMutation = useCreateWidget();
  const updateMutation = useUpdateWidget();

  const [state, setState] = useState<WidgetState>(() => ({
    ...DEFAULTS,
    layout: normalizeWidgetLayout(searchParams.get("type") ?? "carousel"),
  }));
  const [initialized, setInitialized] = useState(isNew);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(isNew ? "" : null);
  const [justCreated] = useState(searchParams.get("created") === "1");
  const [previewDark, setPreviewDark] = useState(false);

  const set = <K extends keyof WidgetState>(key: K, value: WidgetState[K]) => setState((prev) => ({ ...prev, [key]: value }));
  const snapshot = useMemo(() => JSON.stringify(state), [state]);
  const dirty = initialized && savedSnapshot !== null && snapshot !== savedSnapshot;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    document.title = `${isNew ? "New widget" : "Edit widget"} | Happy Client`;
  }, [isNew]);

  useEffect(() => {
    if (searchParams.get("created")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!existing || initialized) return;
    const loaded: WidgetState = {
      name: existing.name,
      layout: normalizeWidgetLayout(existing.type),
      theme: existing.theme === "dark" || existing.theme === "auto" ? existing.theme : "light",
      autoRotate: existing.auto_rotate ?? true,
      showRating: existing.show_rating ?? true,
      showDate: existing.show_date ?? false,
      active: existing.is_active ?? true,
      testimonialIds: existing.testimonial_ids ?? [],
    };
    setState(loaded);
    setSavedSnapshot(JSON.stringify(loaded));
    setInitialized(true);
    setPreviewDark(loaded.theme === "dark");
  }, [existing, initialized]);

  const previewTestimonials = useMemo(() => resolve(state.testimonialIds), [resolve, state.testimonialIds]);

  const handleSave = () => {
    if (!state.name.trim()) {
      toast.error("Give the widget a name, like Homepage or Pricing page.");
      return;
    }
    if (state.testimonialIds.length === 0) {
      toast.error("Pick at least one testimonial to show.");
      return;
    }
    const payload = {
      name: state.name.trim(),
      type: state.layout,
      theme: state.theme,
      auto_rotate: state.autoRotate,
      show_rating: state.showRating,
      show_date: state.showDate,
      testimonial_ids: state.testimonialIds,
      is_active: state.active,
    };
    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: (widget) => {
          setSavedSnapshot(snapshot);
          navigate(`/dashboard/widgets/${widget.id}?created=1`, { replace: true });
        },
        onError: () => toast.error("The widget did not save. Try again."),
      });
    } else {
      updateMutation.mutate(
        { id: id!, ...payload },
        {
          onSuccess: () => {
            setSavedSnapshot(snapshot);
            toast.success("Widget saved", { description: "Your website shows the change the next time the page loads." });
          },
          onError: () => toast.error("The widget did not save. Try again."),
        },
      );
    }
  };

  const goBack = () => {
    if (dirty && !isNew && !window.confirm("You have changes that are not saved. Leave without saving?")) return;
    navigate("/dashboard/widgets");
  };

  if (!isNew && isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4" role="status" aria-label="Loading widget">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!isNew && error) {
    return (
      <PageContainer>
        <ErrorState title="This widget did not load" error={new Error("It may have been deleted.")} onRetry={() => void refetch()} />
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard/widgets")}>
            <ArrowLeft className="mr-1.5" /> Back to widgets
          </Button>
        </div>
      </PageContainer>
    );
  }

  const embedCode = isNew ? "" : widgetEmbedCode(id!);
  const darkPreview = state.theme === "dark" || (state.theme === "auto" && previewDark);

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur md:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
            <ArrowLeft className="mr-1" /> Widgets
          </Button>
          <Label htmlFor="widget-name" className="sr-only">Widget name</Label>
          <Input
            id="widget-name"
            value={state.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Name this widget, like Homepage"
            maxLength={80}
            autoFocus={isNew}
            className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-2 text-base font-semibold hover:border-input focus-visible:bg-card sm:max-w-sm"
          />
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={state.active} onCheckedChange={(v) => set("active", v)} />
              <span className="hidden sm:inline">{state.active ? "Showing" : "Hidden"}</span>
            </label>
            {!isNew && (
              <Button asChild variant="outline" size="sm">
                <a href={`${PUBLIC_APP_URL}/embed/widget/${id}`} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1.5" />
                </a>
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving || (!isNew && !dirty)}>
              {isSaving && <Loader2 className="mr-1.5 animate-spin" />}
              {isNew ? "Save and get code" : dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          {!isNew && (
            <section className={cn("rounded-2xl border p-5 shadow-subtle sm:p-6", justCreated ? "border-gold bg-gold-light/40" : "border-border bg-card")}>
              <h2 className="text-base font-semibold text-foreground">{justCreated ? "Your widget is ready. Add it to your website." : "Add it to your website"}</h2>
              <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>1. Copy this code.</li>
                <li>2. Paste it into your page where the testimonials should appear. Look for a block named Custom code, Embed or HTML.</li>
                <li>3. Publish your page. Later edits here update your site on their own.</li>
              </ol>
              <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground scrollbar-thin">
                <code>{embedCode}</code>
              </pre>
              <div className="mt-3 flex justify-end">
                <CopyButton text={embedCode} label="Copy code" variant="default" size="default" toastMessage="Embed code copied" />
              </div>
            </section>
          )}

          <Panel title="Layout">
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Layout">
              {(Object.keys(WIDGET_LAYOUTS) as WidgetLayout[]).map((key) => {
                const layout = WIDGET_LAYOUTS[key];
                const selected = state.layout === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("layout", key)}
                    className={cn(
                      "relative rounded-xl border px-3 py-3.5 text-left transition-colors",
                      selected ? "border-foreground bg-muted/40 ring-1 ring-foreground" : "border-border hover:border-border-hover",
                    )}
                  >
                    {selected && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-foreground" strokeWidth={2.5} />}
                    <layout.icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                    <span className="mt-2 block text-sm font-medium text-foreground">{layout.label}</span>
                    <span className="block text-xs text-muted-foreground">{layout.hint}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Testimonials" description="Only approved testimonials can go on your website.">
            <TestimonialPicker approved={approved} isLoading={loadingTestimonials} selected={state.testimonialIds} onChange={(ids) => set("testimonialIds", ids)} />
          </Panel>

          <Panel title="Options">
            <div className="space-y-4">
              <div>
                <Label>Colours</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Colours">
                  {THEMES.map((theme) => {
                    const selected = state.theme === theme.value;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          set("theme", theme.value);
                          setPreviewDark(theme.value === "dark");
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-sm transition-colors",
                          selected ? "border-foreground bg-muted/40 font-medium text-foreground" : "border-border text-muted-foreground hover:border-border-hover hover:text-foreground",
                        )}
                      >
                        <theme.icon className="h-4 w-4" /> {theme.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Use Dark when your website has a dark background. Match visitor follows each visitor's device setting.
                </p>
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="text-sm font-medium text-foreground">Show star ratings</span>
                <Switch checked={state.showRating} onCheckedChange={(v) => set("showRating", v)} />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="text-sm font-medium text-foreground">Show the month it was given</span>
                <Switch checked={state.showDate} onCheckedChange={(v) => set("showDate", v)} />
              </label>
              {state.layout === "carousel" && (
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium text-foreground">Rotate on its own</span>
                    <span className="block text-sm text-muted-foreground">Moves to the next one every 7 seconds. It pauses when someone points at it.</span>
                  </span>
                  <Switch checked={state.autoRotate} onCheckedChange={(v) => set("autoRotate", v)} className="shrink-0" />
                </label>
              )}
            </div>
          </Panel>
        </div>

        <aside className="lg:col-span-7" aria-label="Preview">
          <div className="lg:sticky lg:top-20">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="eyebrow">Preview</p>
              {state.theme === "auto" && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Preview on a dark page
                  <Switch checked={previewDark} onCheckedChange={setPreviewDark} />
                </label>
              )}
            </div>
            <div
              className="overflow-hidden rounded-2xl border border-border p-5 transition-colors sm:p-8"
              style={{ backgroundColor: darkPreview ? "#0F0E0C" : "#FFFFFF" }}
            >
              {previewTestimonials.length === 0 ? (
                <div className="flex min-h-[18rem] flex-col items-center justify-center text-center">
                  <p className="display text-2xl" style={{ color: darkPreview ? "#F8F5EE" : "#1A1714" }}>
                    Pick a testimonial
                  </p>
                  <p className="mt-2 max-w-xs text-sm" style={{ color: darkPreview ? "#A8A094" : "#635C54" }}>
                    Tick one on the left and it appears here, exactly as your visitors will see it.
                  </p>
                </div>
              ) : state.layout === "grid" ? (
                <ScaledPreview designWidth={1100}>
                  <WidgetRenderer layout="grid" testimonials={previewTestimonials} theme={darkPreview ? "dark" : "light"} showRating={state.showRating} showDate={state.showDate} />
                </ScaledPreview>
              ) : (
                <WidgetRenderer
                  layout={state.layout}
                  testimonials={previewTestimonials}
                  theme={darkPreview ? "dark" : "light"}
                  showRating={state.showRating}
                  showDate={state.showDate}
                  autoRotate={false}
                />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The background here stands in for your website. The widget itself has no background of its own.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
