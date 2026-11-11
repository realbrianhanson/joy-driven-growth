import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  DollarSign,
  Loader2,
  Pencil,
  PenLine,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Stars } from "@/components/shared/Stars";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLogSale, useTestimonialSales, useUpdateTestimonial } from "@/hooks/use-testimonials";
import { parseFormConfig, readFunctionErrorCode } from "@/lib/form-config";
import { formatCurrency, formatDate, roleLine } from "@/lib/format";
import { answerEntries, maskName, sourceLabel, type TestimonialRow, type TestimonialStatus } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

interface Analysis {
  themes?: string[];
  goldenQuotes?: string[];
  summary?: string;
  bestUsedFor?: string[];
}

interface TestimonialDrawerProps {
  testimonial: TestimonialRow | null;
  open: boolean;
  onClose: () => void;
  onStatus: (id: string, status: TestimonialStatus) => void;
  onFeature: (id: string, featured: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DISPLAY_LABELS: Record<string, string> = {
  full: "Full name, title and company",
  first_initial: "First name and last initial",
  anonymous: "Anonymous",
};

async function aiFailureMessage(err: unknown): Promise<string> {
  const code = ((await readFunctionErrorCode(err)) ?? (err instanceof Error ? err.message : "")).toLowerCase();
  if (code.includes("rate")) return "The AI is busy. Wait a few seconds and try again.";
  if (code.includes("credit") || code.includes("unavailable") || code.includes("not_configured")) {
    return "The AI is not available right now. Try again later.";
  }
  if (code.includes("nothing_to_develop")) return "There is no written text to work from.";
  return "The AI did not answer. Try again in a moment.";
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-border-subtle px-6 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="eyebrow">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Everything about one testimonial, in a side panel: play it, approve it, tag it, log sales against it. */
export function TestimonialDrawer({ testimonial: t, open, onClose, onStatus, onFeature, onEdit, onDelete }: TestimonialDrawerProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTestimonial();
  const logSale = useLogSale();
  const { data: sales } = useTestimonialSales(open && t ? t.id : null);

  const [tagInput, setTagInput] = useState("");
  const [isDeveloping, setIsDeveloping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [saleAmount, setSaleAmount] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [showSaleForm, setShowSaleForm] = useState(false);

  const testimonialId = t?.id ?? null;
  useEffect(() => {
    setAnalysis(null);
    setTagInput("");
    setSaleAmount("");
    setSaleNote("");
    setShowSaleForm(false);
  }, [testimonialId]);

  const { data: formQuestions } = useQuery({
    queryKey: ["form-questions", t?.form_id],
    enabled: open && !!t?.form_id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("forms").select("custom_questions").eq("id", t!.form_id!).maybeSingle();
      if (error) throw error;
      return parseFormConfig(data?.custom_questions).prompts;
    },
  });

  if (!t) return null;

  const status = t.status ?? "pending";
  const text = (t.content ?? "").trim();
  const role = roleLine(t.author_title, t.author_company);
  const tags = t.tags ?? [];
  const answers = answerEntries(t.custom_fields, formQuestions);
  const totalSales = Number(t.revenue_attributed ?? 0);
  const publicName = maskName(t.author_name, t.display_preference);

  const saveTags = (next: string[]) => {
    updateMutation.mutate(
      { id: t.id, tags: next },
      { onError: () => toast.error("The tags did not save. Try again.") },
    );
  };

  const addTag = (event: FormEvent) => {
    event.preventDefault();
    const tag = tagInput.trim().toLowerCase().slice(0, 30);
    if (!tag) return;
    setTagInput("");
    if (!tags.includes(tag)) saveTags([...tags, tag].slice(0, 12));
  };

  const develop = async () => {
    setIsDeveloping(true);
    try {
      const { data, error } = await supabase.functions.invoke("develop-testimonial", { body: { testimonial_id: t.id } });
      if (error) throw error;
      const failure = (data as { error?: string } | null)?.error;
      if (failure) throw new Error(failure);
      await queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Polished draft ready");
    } catch (err) {
      toast.error(await aiFailureMessage(err));
    } finally {
      setIsDeveloping(false);
    }
  };

  const analyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-testimonial", {
        body: { content: text, name: t.author_name, company: t.author_company ?? "", rating: t.rating ?? 0 },
      });
      if (error) throw error;
      const failure = (data as { error?: string } | null)?.error;
      if (failure) throw new Error(failure);
      setAnalysis(data as Analysis);
    } catch (err) {
      toast.error(await aiFailureMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitSale = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number.parseFloat(saleAmount.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter the sale amount as a number, like 2500.");
      return;
    }
    logSale.mutate(
      { testimonialId: t.id, amount, note: saleNote },
      {
        onSuccess: () => {
          toast.success(`${formatCurrency(amount)} logged`);
          setSaleAmount("");
          setSaleNote("");
          setShowSaleForm(false);
        },
        onError: () => toast.error("The sale did not save. Try again."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <div className="flex items-start gap-4 px-6 pb-5 pt-6 pr-14">
          <PersonAvatar name={t.author_name} src={t.author_avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="display truncate text-[1.75rem] font-normal leading-tight">{t.author_name}</SheetTitle>
            <SheetDescription className="truncate text-sm text-muted-foreground">
              {[role, formatDate(t.created_at), sourceLabel(t.source)].filter(Boolean).join(" · ")}
            </SheetDescription>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusBadge status={status} />
              <Stars rating={t.rating} />
              {t.is_featured && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-deep">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" /> Featured
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {(t.type === "video" || t.type === "audio") && (
            <div className="px-6 pb-5">
              {t.type === "video" && t.video_url ? (
                <video src={t.video_url} poster={t.thumbnail_url ?? undefined} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black object-contain" />
              ) : t.type === "audio" && t.audio_url ? (
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <audio src={t.audio_url} controls preload="metadata" className="w-full" />
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  The recording for this testimonial is missing.
                </p>
              )}
              {(t.video_url || t.audio_url) && (
                <p className="mt-2 text-right">
                  <a href={t.video_url ?? t.audio_url ?? "#"} target="_blank" rel="noopener noreferrer" download className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                    Open the file
                  </a>
                </p>
              )}
            </div>
          )}

          <Section
            title={t.type === "text" ? "What they wrote" : "Written note"}
            action={
              <div className="flex items-center gap-1">
                {text && <CopyButton text={text} variant="ghost" />}
                <Button variant="ghost" size="sm" onClick={() => onEdit(t.id)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            }
          >
            {text ? (
              <p className="quote whitespace-pre-wrap text-[1.3rem] text-foreground">&ldquo;{text}&rdquo;</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No written text.</p>
            )}

            {answers.length > 0 && (
              <dl className="mt-5 space-y-3 rounded-xl bg-muted/50 p-4">
                {answers.map((entry) => (
                  <div key={entry.label}>
                    <dt className="text-xs font-medium text-muted-foreground">{entry.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{entry.answer}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Section>

          <Section title="Permission">
            <div className={cn("flex gap-3 rounded-xl border px-4 py-3", t.consent_given ? "border-success/25 bg-success-light/60" : "border-warning/30 bg-warning-light/60")}>
              {t.consent_given ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />}
              <div className="min-w-0 text-sm">
                <p className="font-medium text-foreground">
                  {t.consent_given ? "Permission to publish is on record" : "No permission on record"}
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {t.consent_given
                    ? `Agreed ${t.consent_timestamp ? formatDate(t.consent_timestamp) : ""}. Shown publicly as ${publicName}.`
                    : "Ask this person before you use their words in marketing."}
                </p>
                {t.consent_given && t.consent_text && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Read what they agreed to</summary>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t.consent_text}</p>
                  </details>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Name display: {DISPLAY_LABELS[t.display_preference] ?? DISPLAY_LABELS.full}
              {t.author_email ? ` · ${t.author_email}` : ""}
            </p>
          </Section>

          {(text || t.developed_content) && (
            <Section
              title="Polished version"
              action={
                <Button variant="ghost" size="sm" onClick={develop} disabled={isDeveloping || !text}>
                  {isDeveloping ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                  {t.developed_content ? "Redo" : "Write it"}
                </Button>
              }
            >
              {t.developed_content ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{t.developed_content}</p>
                    <div className="mt-3 flex justify-end">
                      <CopyButton text={t.developed_content} />
                    </div>
                  </div>
                  {t.developed_pull_quote && (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Pull quote</p>
                        <p className="mt-0.5 text-sm text-foreground">&ldquo;{t.developed_pull_quote}&rdquo;</p>
                      </div>
                      <CopyButton text={t.developed_pull_quote} iconOnly variant="ghost" label="Copy pull quote" />
                    </div>
                  )}
                  {t.developed_one_liner && (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">One line</p>
                        <p className="mt-0.5 text-sm text-foreground">{t.developed_one_liner}</p>
                      </div>
                      <CopyButton text={t.developed_one_liner} iconOnly variant="ghost" label="Copy one line" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    AI tidied the wording and added nothing new. Send it to {t.author_name.split(" ")[0]} to approve before you publish it under their name.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  AI turns the raw answers into one clean, copy-ready testimonial. It keeps to what the client said.
                </p>
              )}
            </Section>
          )}

          {text && (
            <Section
              title="Best lines"
              action={
                <Button variant="ghost" size="sm" onClick={analyze} disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                  {analysis ? "Redo" : "Find them"}
                </Button>
              }
            >
              {analysis ? (
                <div className="space-y-4">
                  {(analysis.goldenQuotes ?? []).length > 0 && (
                    <ul className="space-y-2">
                      {analysis.goldenQuotes!.map((quote) => (
                        <li key={quote} className="flex items-start justify-between gap-3 rounded-xl border border-gold/30 bg-gold-light/50 px-4 py-3">
                          <p className="text-sm text-foreground">&ldquo;{quote}&rdquo;</p>
                          <CopyButton text={quote} iconOnly variant="ghost" label="Copy quote" />
                        </li>
                      ))}
                    </ul>
                  )}
                  {analysis.summary && <p className="text-sm text-muted-foreground">{analysis.summary}</p>}
                  {[...(analysis.themes ?? []), ...(analysis.bestUsedFor ?? [])].length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(analysis.themes ?? []).map((theme) => (
                        <span key={`theme-${theme}`} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">{theme}</span>
                      ))}
                      {(analysis.bestUsedFor ?? []).map((use) => (
                        <span key={`use-${use}`} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Good for: {use}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">AI picks the strongest sentences to quote and says where to use them.</p>
              )}
            </Section>
          )}

          <Section
            title="Sales this helped close"
            action={
              !showSaleForm && (
                <Button variant="ghost" size="sm" onClick={() => setShowSaleForm(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Log a sale
                </Button>
              )
            }
          >
            <p className="display text-[2rem] text-foreground">{formatCurrency(totalSales)}</p>
            {totalSales === 0 && !showSaleForm && (
              <p className="mt-1 text-sm text-muted-foreground">
                When a buyer says this testimonial helped them decide, log the sale here. Your results page adds it up.
              </p>
            )}

            {showSaleForm && (
              <form onSubmit={submitSale} className="mt-3 space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
                  <div>
                    <Label htmlFor="sale-amount">Amount (USD)</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="sale-amount" inputMode="decimal" className="pl-8" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} placeholder="2500" autoFocus required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sale-note">
                      Note <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input id="sale-note" className="mt-1.5" value={saleNote} onChange={(e) => setSaleNote(e.target.value)} placeholder="Who bought, and what" maxLength={300} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowSaleForm(false)}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={logSale.isPending}>
                    {logSale.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Save sale
                  </Button>
                </div>
              </form>
            )}

            {(sales ?? []).length > 0 && (
              <ul className="mt-3 divide-y divide-border-subtle text-sm">
                {sales!.map((sale) => {
                  const note = typeof sale.metadata?.note === "string" ? sale.metadata.note : "";
                  return (
                    <li key={sale.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate text-muted-foreground">
                        {formatDate(sale.created_at)}
                        {note ? ` · ${note}` : ""}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">{formatCurrency(Number(sale.amount))}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Tags">
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-2.5 pr-1 text-xs text-foreground">
                  {tag}
                  <button
                    type="button"
                    onClick={() => saveTags(tags.filter((x) => x !== tag))}
                    aria-label={`Remove tag ${tag}`}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-border hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <form onSubmit={addTag} className="flex items-center gap-1.5">
                <Label htmlFor="tag-input" className="sr-only">Add a tag</Label>
                <Input id="tag-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag" maxLength={30} className="h-8 w-32 text-sm md:text-sm" />
                <Button type="submit" variant="outline" size="sm" className="h-8" disabled={!tagInput.trim()}>
                  Add
                </Button>
              </form>
            </div>
          </Section>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card px-6 py-4">
          {status !== "approved" && (
            <Button onClick={() => onStatus(t.id, "approved")}>
              <Check className="mr-1.5" /> Approve
            </Button>
          )}
          {status === "pending" && (
            <Button variant="outline" onClick={() => onStatus(t.id, "rejected")}>
              <X className="mr-1.5" /> Reject
            </Button>
          )}
          {status !== "pending" && (
            <Button variant="outline" onClick={() => onStatus(t.id, "pending")}>
              <RotateCcw className="mr-1.5" /> Move to review
            </Button>
          )}
          <Button variant="outline" onClick={() => onFeature(t.id, !t.is_featured)} aria-pressed={!!t.is_featured}>
            <Star className={cn("mr-1.5", t.is_featured && "fill-gold text-gold")} /> {t.is_featured ? "Featured" : "Feature"}
          </Button>
          {text && (
            <Button asChild variant="outline">
              <Link to={`/dashboard/content?testimonial=${t.id}`}>
                <PenLine className="mr-1.5" /> Make content
              </Link>
            </Button>
          )}
          <Button variant="ghost" className="ml-auto text-destructive hover:bg-destructive-light hover:text-destructive" onClick={() => onDelete(t.id)}>
            <Trash2 className="mr-1.5" /> Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
