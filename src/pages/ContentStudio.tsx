import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  FileText,
  Image as ImageIcon,
  Library,
  Linkedin,
  Loader2,
  Mail,
  MessageSquareQuote,
  PenLine,
  RefreshCw,
  Search,
  ShieldAlert,
  Twitter,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContentRenderer, CopyContentButton } from "@/components/content/ContentRenderer";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { Stars } from "@/components/shared/Stars";
import { useApprovedTestimonials } from "@/components/shared/TestimonialPicker";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { CONTENT_FORMATS, type ContentKind, contentErrorMessage, flattenContent } from "@/lib/content";
import { readFunctionErrorCode } from "@/lib/form-config";
import { roleLine } from "@/lib/format";
import { maskName } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

const FORMAT_ICONS: Record<ContentKind, LucideIcon> = {
  linkedin: Linkedin,
  twitter: Twitter,
  email: Mail,
  casestudy: FileText,
  quote: ImageIcon,
};

const MAX_VERSIONS = 3;

interface Version {
  kind: ContentKind;
  data: unknown;
  /** Numbers in the draft that are not in the testimonial. */
  unverified: string[];
  saved: boolean;
}

function StepTitle({ step, children }: { step: number; children: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-foreground">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold tabular-nums text-background">
        {step}
      </span>
      {children}
    </h2>
  );
}

/**
 * Turns one approved testimonial into a post, an email section, a case study
 * or a quote image. The draft is built from the client's own words, and the
 * owner reads it before it goes anywhere.
 */
export default function ContentStudio() {
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { approved, isLoading, error } = useApprovedTestimonials();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("testimonial"));
  const [kind, setKind] = useState<ContentKind | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [active, setActive] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const draftRef = useRef<HTMLElement>(null);

  const withText = useMemo(() => approved.filter((t) => (t.content ?? "").trim().length > 0), [approved]);
  const withoutText = approved.length - withText.length;
  const selected = useMemo(() => withText.find((t) => t.id === selectedId) ?? null, [withText, selectedId]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return withText;
    return withText.filter((t) => [t.author_name, t.author_company, t.content].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [withText, search]);

  // A new testimonial or format starts a fresh set of drafts.
  useEffect(() => {
    setVersions([]);
    setActive(0);
    setFailure(null);
  }, [selectedId, kind]);

  const current = versions[active] ?? null;
  const format = CONTENT_FORMATS.find((f) => f.id === kind) ?? null;

  const generate = async () => {
    if (!selected || !format || !workspaceOwnerId || isGenerating) return;
    setIsGenerating(true);
    setFailure(null);
    // On a phone the draft panel sits below the two steps. Bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => draftRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("generate-content", {
        body: {
          testimonial_ids: [selected.id],
          contentType: format.id,
          workspace_owner_id: workspaceOwnerId,
          // Read by the function version that was live before November 2026.
          testimonials: [
            {
              id: selected.id,
              name: maskName(selected.author_name, selected.display_preference),
              company: selected.author_company ?? "",
              content: selected.content ?? "",
              rating: selected.rating ?? null,
            },
          ],
          contentTypeInfo: { title: format.title, subtitle: format.description },
        },
      });
      if (invokeError) throw invokeError;

      const result = data as { content?: unknown; error?: string; checks?: { unverified_numbers?: string[] } } | null;
      if (result?.error || !result?.content) {
        setFailure(contentErrorMessage(result?.error));
        return;
      }

      const { error: saveError } = await supabase.from("generated_content").insert({
        user_id: workspaceOwnerId,
        testimonial_ids: [selected.id],
        type: format.dbType,
        content: flattenContent(format.id, result.content),
        metadata: { structured: result.content, contentTypeKey: format.id } as never,
      });
      if (saveError) console.error("Saving the draft failed:", saveError);
      else void queryClient.invalidateQueries({ queryKey: ["generated-content"] });

      const version: Version = {
        kind: format.id,
        data: result.content,
        unverified: result.checks?.unverified_numbers ?? [],
        saved: !saveError,
      };
      setVersions((previous) => {
        const next = [...previous, version].slice(-MAX_VERSIONS);
        setActive(next.length - 1);
        return next;
      });
    } catch (err) {
      console.error("Content generation failed:", err);
      setFailure(contentErrorMessage(await readFunctionErrorCode(err)));
    } finally {
      setIsGenerating(false);
    }
  };

  const libraryButton = (
    <Button asChild variant="outline">
      <Link to="/dashboard/content/library">
        <Library className="mr-2 h-4 w-4" />
        Saved content
      </Link>
    </Button>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Content"
        description="Turn one testimonial into a post, an email, a case study or a quote image. AI writes the draft from your client's own words."
        actions={libraryButton}
      />

      {error ? (
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      ) : isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" role="status" aria-label="Loading">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : withText.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="Approve a written testimonial first"
          description={
            approved.length > 0
              ? "Your approved testimonials are recordings with no written text. Content is written from text, so add or collect a written one."
              : "Content is written from testimonials you have approved. Approve one, then come back here."
          }
          actions={
            <Button asChild>
              <Link to="/dashboard/testimonials">Go to testimonials</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="content-step-1">
              <div id="content-step-1">
                <StepTitle step={1}>Pick a testimonial</StepTitle>
              </div>
              {withText.length > 5 && (
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or words"
                    aria-label="Search approved testimonials"
                    className="pl-10"
                  />
                </div>
              )}
              <ul role="radiogroup" aria-label="Approved testimonials" className="max-h-[22rem] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                {visible.map((t) => {
                  const isSelected = t.id === selectedId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                          isSelected ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                        )}
                      >
                        <PersonAvatar name={t.author_name} src={t.author_avatar} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm font-medium text-foreground">{t.author_name}</span>
                            <Stars rating={t.rating} size="xs" />
                          </span>
                          <span className="line-clamp-2 block text-sm text-muted-foreground">{t.content}</span>
                        </span>
                        {isSelected && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground">
                            <Check className="h-3 w-3 text-background" />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {visible.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing matches that search.</li>}
              </ul>
              {withoutText > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {withoutText === 1 ? "1 approved recording is" : `${withoutText} approved recordings are`} not listed, because content is written from text.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="content-step-2">
              <div id="content-step-2">
                <StepTitle step={2}>Pick a format</StepTitle>
              </div>
              <div role="radiogroup" aria-label="Format" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CONTENT_FORMATS.map((option) => {
                  const Icon = FORMAT_ICONS[option.id];
                  const isSelected = kind === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setKind(option.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
                        isSelected ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isSelected ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">{option.title}</span>
                        <span className="block text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <Button className="mt-5 w-full" size="lg" disabled={!selected || !kind || isGenerating} onClick={generate}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                {isGenerating ? "Writing your draft" : versions.length > 0 ? "Write another version" : "Write the draft"}
              </Button>
              {(!selected || !kind) && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {!selected ? "Pick a testimonial to start." : "Pick a format to continue."}
                </p>
              )}
            </section>
          </div>

          <section
            ref={draftRef}
            className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-6"
            aria-live="polite"
            aria-label="Draft"
          >
            {isGenerating ? (
              <div role="status" className="space-y-3 py-2">
                <p className="text-sm font-medium text-foreground">Writing your draft. This takes about 10 seconds.</p>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : failure ? (
              <div className="flex flex-col items-center py-12 text-center" role="alert">
                <AlertTriangle className="mb-3 h-6 w-6 text-warning" />
                <p className="max-w-sm text-sm text-foreground">{failure}</p>
                <Button variant="outline" className="mt-4" onClick={generate} disabled={!selected || !kind}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
              </div>
            ) : current && selected ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">{CONTENT_FORMATS.find((f) => f.id === current.kind)?.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {current.saved ? "Saved to your library." : "This draft did not save. Copy it before you leave."}
                    </p>
                  </div>
                  <CopyContentButton kind={current.kind} data={current.data} variant="default" />
                </div>

                {versions.length > 1 && (
                  <div role="tablist" aria-label="Versions" className="flex gap-1.5">
                    {versions.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        role="tab"
                        aria-selected={active === index}
                        onClick={() => setActive(index)}
                        className={cn(
                          "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                          active === index ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        Version {index + 1}
                      </button>
                    ))}
                  </div>
                )}

                {current.unverified.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning-light px-4 py-3 text-sm text-foreground" role="alert">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <p>
                      Check {current.unverified.length === 1 ? "this number" : "these numbers"} before you post:{" "}
                      <span className="font-semibold">{current.unverified.join(", ")}</span>.{" "}
                      {current.unverified.length === 1 ? "It is" : "They are"} not in the testimonial.
                    </p>
                  </div>
                )}

                {!selected.consent_given && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <p>There is no permission on record for this testimonial. Ask {selected.author_name.split(/\s+/)[0]} before you publish their words.</p>
                  </div>
                )}

                <ContentRenderer kind={current.kind} data={current.data} />

                <details className="group rounded-xl border border-border px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden">
                    <span className="group-open:hidden">Compare with what the client wrote</span>
                    <span className="hidden group-open:inline">What the client wrote</span>
                  </summary>
                  <p className="quote mt-3 whitespace-pre-wrap text-base text-foreground">{selected.content}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[maskName(selected.author_name, selected.display_preference), roleLine(selected.author_title, selected.author_company)]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </details>

                <p className="text-xs text-muted-foreground">
                  AI wrote this draft. Read it against the client's words before you post it, and keep every claim true.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center px-4 py-16 text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold-light">
                  <PenLine className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
                </div>
                <h2 className="display text-2xl text-foreground">Your draft shows up here</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Pick a testimonial and a format. Each draft is saved to your library, and the last {MAX_VERSIONS} versions stay here so you can compare them.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
