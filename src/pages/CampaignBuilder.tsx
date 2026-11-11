import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useForms } from "@/hooks/use-forms";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/hooks/use-workspace";
import { SMS_MONTHLY_ALLOWANCE } from "@/lib/billing-plans";
import { PUBLIC_APP_URL } from "@/lib/config";
import { pluralize } from "@/lib/format";
import { MAX_RECIPIENTS, MAX_SMS_SEGMENTS, parseRecipients, recipientsToText, renderMessage, smsSize } from "@/lib/recipients";
import { cn } from "@/lib/utils";

const STEPS = ["Form", "Message", "People", "Send"] as const;
const DEFAULT_MESSAGE =
  "Hi {first_name}, would you share a few words about working with us? It takes about 2 minutes: {form_link} Reply STOP to opt out.";

/** The local date and time one hour from now, in the shape a datetime-local input wants. */
function defaultSchedule(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

interface StartResult {
  ok?: boolean;
  error?: string;
  queued?: number;
  status?: string;
  remaining?: number;
  numbers?: string[];
  limit?: number;
}

/** Reads the JSON body of a failed function call. */
async function readFunctionError(error: unknown): Promise<StartResult | null> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context && typeof (context as Response).json === "function") {
    try {
      const body = await (context as Response).clone().json();
      return body && typeof body.error === "string" ? (body as StartResult) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Says why a campaign did not start, in words the owner can act on. */
function startErrorMessage(result: StartResult): string {
  switch (result.error) {
    case "sms_not_in_plan":
      return "Text campaigns are part of the Starter plan and up.";
    case "sms_allowance_exceeded":
      return `Your plan has ${pluralize(result.remaining ?? 0, "text")} left this month. Shorten the list, or move to a bigger plan.`;
    case "country_not_allowed":
      return `Texts to these numbers are not turned on yet: ${(result.numbers ?? []).join(", ")}. Only US and Canada numbers can be sent to.`;
    case "sms_not_configured":
    case "unreachable":
      return "Text messages are not set up for this app yet.";
    case "form_not_ready":
      return "The form for this campaign is not published. Publish it, then send.";
    case "message_too_long":
      return "The message is too long once a name and the link are filled in. Shorten it.";
    case "missing_form_link":
      return "Add {form_link} to the message so clients can reach your form.";
    case "too_many_recipients":
      return `One campaign can go to ${(result.limit ?? MAX_RECIPIENTS).toLocaleString()} people. Split the list.`;
    case "no_recipients":
      return "The list has no usable phone numbers.";
    case "campaign_already_started":
      return "This campaign has already started.";
    case "rate_limited":
      return "Too many tries in a row. Wait a minute, then send again.";
    case "forbidden":
      return "You have view-only access, so you cannot send campaigns.";
    default:
      return "The campaign did not start.";
  }
}

/** Four short steps to text a form link to a list of clients. A draft can be saved and finished later. */
export default function CampaignBuilder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft");
  const { workspaceOwnerId } = useWorkspace();
  const { plan, isLoading: planLoading } = usePlan();
  const allowance = SMS_MONTHLY_ALLOWANCE[plan] ?? 0;
  const { data: forms, isLoading: formsLoading } = useForms();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [formId, setFormId] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [recipientsText, setRecipientsText] = useState("");
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule);
  const [confirmedConsent, setConfirmedConsent] = useState(false);
  const [busy, setBusy] = useState<null | "draft" | "send">(null);

  const { data: draft, isLoading: draftLoading } = useQuery({
    queryKey: ["campaign-draft", draftId],
    enabled: !!draftId,
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").eq("id", draftId!).eq("status", "draft").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!draft) return;
    setName(draft.name ?? "");
    setFormId(draft.form_id ?? "");
    if (draft.message_template) setMessage(draft.message_template);
    setRecipientsText(recipientsToText(draft.recipients));
  }, [draft]);

  const publishedForms = useMemo(() => (forms ?? []).filter((form) => form.is_published), [forms]);
  const selectedForm = publishedForms.find((form) => form.id === formId) ?? null;
  const formLink = selectedForm ? `${PUBLIC_APP_URL}/collect/${selectedForm.slug}` : `${PUBLIC_APP_URL}/collect/your-form`;

  const recipients = useMemo(() => parseRecipients(recipientsText), [recipientsText]);
  const outsideNorthAmerica = recipients.valid.filter((person) => !person.phone.startsWith("+1")).length;
  const preview = renderMessage(message, "Sarah", formLink);
  const size = smsSize(preview);
  const tooLong = size.segments > MAX_SMS_SEGMENTS;
  const hasLink = message.includes("{form_link}");
  const scheduleTime = timing === "scheduled" ? new Date(scheduledAt).getTime() : null;
  const scheduleInPast = scheduleTime !== null && (!Number.isFinite(scheduleTime) || scheduleTime < Date.now());

  const problems: (string | null)[] = [
    !name.trim() ? "Give the campaign a name." : !selectedForm ? "Pick the form your clients will fill in." : null,
    !message.trim()
      ? "Write a message."
      : !hasLink
        ? "Add {form_link} so clients can reach your form."
        : tooLong
          ? `The message is too long. Shorten it to ${MAX_SMS_SEGMENTS} texts or fewer.`
          : null,
    recipients.valid.length === 0
      ? "Add at least one phone number."
      : recipients.valid.length > MAX_RECIPIENTS
        ? `One campaign can go to ${MAX_RECIPIENTS.toLocaleString()} people. Split the list.`
        : null,
    scheduleInPast ? "Pick a time in the future." : !confirmedConsent ? "Confirm that these clients agreed to get texts from you." : null,
  ];
  const firstProblemStep = problems.findIndex((problem) => problem !== null);
  const canOpen = (target: number) => target <= step || problems.slice(0, target).every((problem) => problem === null);

  const campaignFields = (status: "draft") => ({
    user_id: workspaceOwnerId!,
    name: name.trim(),
    form_id: formId || null,
    type: "sms" as const,
    status,
    message_template: message,
    recipients: recipients.valid as never,
    total_recipients: recipients.valid.length,
    scheduled_at: null,
  });

  /** Saves the campaign: updates the open draft, or creates a new row. */
  const saveCampaign = async (status: "draft") => {
    const query = draft
      ? supabase.from("campaigns").update(campaignFields(status)).eq("id", draft.id).select().single()
      : supabase.from("campaigns").insert(campaignFields(status)).select().single();
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  const saveDraft = async () => {
    if (!workspaceOwnerId || !name.trim() || busy) return;
    setBusy("draft");
    try {
      await saveCampaign("draft");
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Draft saved");
      navigate("/dashboard/campaigns");
    } catch (err) {
      console.error("Draft save failed:", err);
      toast.error("The draft did not save. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!workspaceOwnerId || firstProblemStep !== -1 || busy) return;
    setBusy("send");
    try {
      // The campaign is saved as a draft, then the server checks every rule and queues the texts.
      const campaign = await saveCampaign("draft");
      const { data, error } = await supabase.functions.invoke("start-campaign", {
        body: { campaign_id: campaign.id, scheduled_at: timing === "scheduled" ? new Date(scheduledAt).toISOString() : null },
      });
      const result = (data ?? null) as StartResult | null;
      const failure = error ? ((await readFunctionError(error)) ?? { error: "unreachable" }) : result?.error ? result : null;

      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      if (failure) {
        toast.error(startErrorMessage(failure), { description: "Nothing was sent. The campaign is saved as a draft.", duration: 9000 });
        if (!draft) navigate(`/dashboard/campaigns/new?draft=${campaign.id}`, { replace: true });
        return;
      }

      toast.success(
        result?.status === "scheduled"
          ? `Scheduled for ${new Date(scheduledAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
          : `${pluralize(result?.queued ?? recipients.valid.length, "text")} queued. Sending starts within a minute.`,
      );
      navigate("/dashboard/campaigns");
    } catch (err) {
      console.error("Campaign send failed:", err);
      toast.error("The campaign did not start, and no texts were sent. Try again.");
    } finally {
      setBusy(null);
    }
  };

  if (draftId && draftLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10" role="status" aria-label="Loading draft">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const stepProblem = problems[step];

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur md:top-0">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
              <Link to="/dashboard/campaigns">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Campaigns
              </Link>
            </Button>
            <h1 className="truncate text-sm font-semibold text-foreground">{name.trim() || "New text campaign"}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={saveDraft} disabled={!name.trim() || busy !== null}>
            {busy === "draft" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Save draft
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {!planLoading && allowance === 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-light/60 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
            <p className="text-sm text-foreground">
              Text campaigns are part of the Starter plan and up. You can build and save this campaign now, and send it after you upgrade.{" "}
              <Link to="/dashboard/settings/billing" className="font-medium underline underline-offset-4">
                See plans
              </Link>
            </p>
          </div>
        )}
        <ol className="mb-8 flex items-center gap-2" aria-label="Steps">
          {STEPS.map((label, index) => {
            const done = index < step && problems[index] === null;
            const current = index === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => canOpen(index) && setStep(index)}
                  disabled={!canOpen(index)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    current ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      current ? "bg-background text-foreground" : done ? "bg-success-light text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className={cn(!current && "hidden sm:inline")}>{label}</span>
                </button>
                {index < STEPS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="display text-3xl text-foreground">Which form are you sending?</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Each client gets a text with a link to this form.</p>
              </div>
              <div>
                <Label htmlFor="campaign-name">Campaign name</Label>
                <Input
                  id="campaign-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Spring clients"
                  maxLength={80}
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">Only you see this name.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Form</p>
                <div className="mt-2 space-y-2" role="radiogroup" aria-label="Form">
                  {formsLoading && <Skeleton className="h-16 w-full rounded-xl" />}
                  {!formsLoading &&
                    publishedForms.map((form) => {
                      const isSelected = form.id === formId;
                      return (
                        <button
                          key={form.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setFormId(form.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                            isSelected ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{form.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {PUBLIC_APP_URL.replace(/^https?:\/\//, "")}/collect/{form.slug}
                            </span>
                          </span>
                          {isSelected && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground">
                              <Check className="h-3 w-3 text-background" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  {!formsLoading && publishedForms.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                      <p className="text-sm text-muted-foreground">You need a published form before you can send a campaign.</p>
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link to="/dashboard/forms/new">Create a form</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="display text-3xl text-foreground">Write the text</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Keep it short and personal. Say who you are.</p>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor="campaign-message">Message</Label>
                  <span className={cn("text-xs tabular-nums", tooLong ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {size.characters} characters, {pluralize(size.segments, "text")} per person
                  </span>
                </div>
                <Textarea
                  id="campaign-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={600}
                  className="mt-1.5 resize-none"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setMessage((m) => `${m}{first_name}`)}>
                    Add first name
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setMessage((m) => `${m} {form_link}`)}>
                    Add form link
                  </Button>
                </div>
                {size.unicode && !tooLong && (
                  <p className="mt-2 text-xs text-muted-foreground">An emoji or special character in the message makes each text hold fewer characters.</p>
                )}
              </div>
              <div>
                <p className="eyebrow mb-2">What Sarah will see</p>
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
                    {preview}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="display text-3xl text-foreground">Who gets it?</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Paste one person on each line: a mobile number, then a comma and a first name.</p>
              </div>
              <div>
                <Label htmlFor="campaign-recipients">Phone numbers</Label>
                <Textarea
                  id="campaign-recipients"
                  value={recipientsText}
                  onChange={(e) => setRecipientsText(e.target.value)}
                  rows={9}
                  placeholder={"(904) 555-0142, Jane\n904-555-0177, Marcus\n+44 7700 900123, Priya"}
                  className="mt-1.5 resize-none font-mono text-sm"
                />
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className={cn("font-medium", recipients.valid.length > 0 ? "text-success" : "text-muted-foreground")}>
                    {pluralize(recipients.valid.length, "number")} ready
                  </span>
                  {recipients.duplicates > 0 && <span className="text-muted-foreground">{pluralize(recipients.duplicates, "repeat")} removed</span>}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  US and Canada numbers work as you write them. For another country, start with + and the country code.
                </p>
                {outsideNorthAmerica > 0 && (
                  <p className="mt-1.5 text-xs text-warning">
                    {pluralize(outsideNorthAmerica, "number is", "numbers are")} outside the US and Canada. Those send only when that country is turned on
                    for this app.
                  </p>
                )}
                {recipients.invalid.length > 0 && (
                  <div className="mt-3 rounded-xl border border-warning/40 bg-warning-light px-4 py-3 text-sm" role="alert">
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      {pluralize(recipients.invalid.length, "line")} skipped. No phone number found.
                    </p>
                    <ul className="mt-1.5 space-y-0.5 font-mono text-xs text-muted-foreground">
                      {recipients.invalid.slice(0, 5).map((line, index) => (
                        <li key={index} className="truncate">
                          {line}
                        </li>
                      ))}
                      {recipients.invalid.length > 5 && <li>and {recipients.invalid.length - 5} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="display text-3xl text-foreground">Check it and send</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">Texts cannot be taken back after they go out.</p>
              </div>

              <dl className="divide-y divide-border rounded-xl border border-border">
                {[
                  { label: "Form", value: selectedForm?.name ?? "None" },
                  { label: "People", value: pluralize(recipients.valid.length, "person", "people") },
                  { label: "Texts to send", value: (recipients.valid.length * size.segments).toLocaleString() },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium tabular-nums text-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <fieldset>
                <legend className="text-sm font-medium text-foreground">When</legend>
                <div className="mt-2 space-y-2">
                  {(
                    [
                      { value: "now", title: "Send now", note: "Texts start to go out within a minute." },
                      { value: "scheduled", title: "Send later", note: "Pick a day and a time." },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                        timing === option.value ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                      )}
                    >
                      <input
                        type="radio"
                        name="timing"
                        value={option.value}
                        checked={timing === option.value}
                        onChange={() => setTiming(option.value)}
                        className="mt-1 h-4 w-4 accent-[hsl(var(--foreground))]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{option.title}</span>
                        <span className="block text-sm text-muted-foreground">{option.note}</span>
                        {option.value === "scheduled" && timing === "scheduled" && (
                          <Input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            aria-label="Date and time to send"
                            className="mt-2 w-full sm:w-auto"
                          />
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-gold-light/60 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={confirmedConsent}
                  onChange={(e) => setConfirmedConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--foreground))]"
                />
                <span className="text-sm text-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="h-4 w-4 text-gold-deep" />
                    Every person on this list agreed to get texts from my business.
                  </span>
                  <span className="mt-1 block text-muted-foreground">
                    The law in the US and many other countries requires this. You are responsible for consent and for carrier registration of your sending number.
                  </span>
                </span>
              </label>
            </div>
          )}

          {stepProblem && (
            <p className="mt-5 text-sm text-muted-foreground" role="status">
              {stepProblem}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setStep((current) => current - 1)} disabled={step === 0 || busy !== null}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((current) => current + 1)} disabled={problems[step] !== null}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={send} disabled={firstProblemStep !== -1 || busy !== null}>
                {busy === "send" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {busy === "send" ? "Queueing texts" : timing === "now" ? `Send to ${pluralize(recipients.valid.length, "person", "people")}` : "Schedule campaign"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
