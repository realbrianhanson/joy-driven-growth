import { forwardRef, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ExternalLink,
  Loader2,
  MessageCircle,
  Mic,
  PenLine,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useFormBySlug } from "@/hooks/use-forms";
import { MediaCapture } from "@/components/testimonials/MediaCapture";
import { StarInput } from "@/components/shared/Stars";
import { CopyButton } from "@/components/shared/CopyButton";
import { LogoMark } from "@/components/shared/Logo";
import { PublicNotice } from "@/components/shared/PublicNotice";
import { DISPLAY_PREFERENCE_OPTIONS, renderConsentText, type DisplayPreference } from "@/lib/consent";
import {
  answersByQuestion,
  composeStory,
  firstMissingPrompt,
  parseFormConfig,
  readFunctionErrorCode,
  submitErrorMessage,
} from "@/lib/form-config";
import { contentTypeFor, extensionForMime, MAX_PHOTO_BYTES, resizeImageToSquare } from "@/lib/media";
import { readableTextColor, safeHex } from "@/lib/format";
import { maskName } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

type Step = "welcome" | "rate" | "story" | "about" | "permission" | "sending" | "done";
type Format = "text" | "video" | "audio";

const MIN_TEXT_LENGTH = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Draft {
  rating: number;
  answers: Record<string, string>;
  freeText: string;
  note: string;
  authorName: string;
  authorEmail: string;
  authorTitle: string;
  authorCompany: string;
}

const draftKey = (slug: string) => `hc-draft:${slug}`;

function loadDraft(slug: string): Partial<Draft> {
  try {
    const raw = sessionStorage.getItem(draftKey(slug));
    return raw ? (JSON.parse(raw) as Partial<Draft>) : {};
  } catch {
    return {};
  }
}

class UploadError extends Error {}

export default function PublicForm() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: form, isLoading, error } = useFormBySlug(slug);

  const { data: ownerCompany } = useQuery({
    queryKey: ["form-owner-company", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_form_owner_company", { p_slug: slug });
      if (error) return null;
      return (data as string | null) ?? null;
    },
  });

  const draft = useMemo(() => loadDraft(slug), [slug]);

  const [step, setStep] = useState<Step>("welcome");
  const [format, setFormat] = useState<Format>("text");
  const [rating, setRating] = useState(draft.rating ?? 0);
  const [answers, setAnswers] = useState<Record<string, string>>(draft.answers ?? {});
  const [freeText, setFreeText] = useState(draft.freeText ?? "");
  const [note, setNote] = useState(draft.note ?? "");
  const [media, setMedia] = useState<Blob | null>(null);
  const [authorName, setAuthorName] = useState(draft.authorName ?? "");
  const [authorEmail, setAuthorEmail] = useState(draft.authorEmail ?? "");
  const [authorTitle, setAuthorTitle] = useState(draft.authorTitle ?? "");
  const [authorCompany, setAuthorCompany] = useState(draft.authorCompany ?? "");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<DisplayPreference>("full");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showProblems, setShowProblems] = useState(false);
  const [sendingLabel, setSendingLabel] = useState("Sending your testimonial");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const config = useMemo(() => parseFormConfig(form?.custom_questions), [form?.custom_questions]);

  const formats = useMemo<Format[]>(() => {
    if (!form) return ["text"];
    const list: Format[] = [];
    if (form.collect_text) list.push("text");
    if (form.collect_video) list.push("video");
    if (form.collect_audio) list.push("audio");
    return list.length > 0 ? list : ["text"];
  }, [form]);

  // Keep the chosen format valid, and skip the welcome screen when it is turned off.
  useEffect(() => {
    if (!form) return;
    if (!formats.includes(format)) setFormat(formats[0]);
    if (!config.welcomeEnabled) setStep((s) => (s === "welcome" ? "rate" : s));
  }, [form, formats, format, config.welcomeEnabled]);

  // Save written answers as they go, so a refresh or a dropped connection does not lose them.
  useEffect(() => {
    if (!slug || step === "done") return;
    try {
      const value: Draft = { rating, answers, freeText, note, authorName, authorEmail, authorTitle, authorCompany };
      sessionStorage.setItem(draftKey(slug), JSON.stringify(value));
    } catch {
      /* Private browsing can block storage. The form still works. */
    }
  }, [slug, step, rating, answers, freeText, note, authorName, authorEmail, authorTitle, authorCompany]);

  // Move focus and scroll to the top of each new step.
  useEffect(() => {
    if (step === "welcome") return;
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
    setShowProblems(false);
  }, [step]);

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  useEffect(() => {
    if (form) document.title = `${ownerCompany || form.name}: share your experience`;
  }, [form, ownerCompany]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4" role="status" aria-label="Loading">
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="mx-auto h-10 w-40" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PublicNotice
        tone="error"
        title="This form did not load"
        message="Check your connection, then try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }

  if (!form) {
    return (
      <PublicNotice
        title="This form is not available"
        message="It may have been closed or the link may be wrong. Ask the person who sent it for a new link."
      />
    );
  }

  const company = ownerCompany?.trim() || form.name;
  const brand = safeHex(form.primary_color, "#1A1714");
  const brandText = readableTextColor(brand);
  const brandButton = { backgroundColor: brand, color: brandText };
  const consentText = renderConsentText(config.consentText, ownerCompany);
  const needsPermission = config.consentEnabled || config.nameDisplayEnabled;
  const prompts = config.prompts;
  const guided = prompts.length > 0;
  const lowRating = rating > 0 && rating <= 3;

  const steps: Step[] = ["rate", "story", "about", ...(needsPermission ? (["permission"] as Step[]) : [])];
  const stepNumber = Math.max(1, steps.indexOf(step) + 1);
  const isLast = step === steps[steps.length - 1];

  const story = guided ? composeStory(prompts, answers) : freeText.trim();
  const missingPrompt = guided ? firstMissingPrompt(prompts, answers) : null;
  const emailInvalid = authorEmail.trim().length > 0 && !EMAIL_PATTERN.test(authorEmail.trim());

  const problem: string | null = (() => {
    if (step === "rate") {
      return form.require_rating && rating === 0 ? "Choose a star rating to continue." : null;
    }
    if (step === "story") {
      if (format !== "text") return media ? null : `Record or upload your ${format} to continue.`;
      if (missingPrompt) return "Answer the questions marked required.";
      if (story.length < MIN_TEXT_LENGTH) return "Write a sentence or two to continue.";
      if (story.length > 4000) return "That is over 4,000 characters. Trim it a little.";
      return null;
    }
    if (step === "about") {
      if (!authorName.trim()) return "Enter your name to continue.";
      if (emailInvalid) return "That email address does not look right.";
      if (form.require_photo && !photo) return "Add a photo to continue.";
      return null;
    }
    if (step === "permission") {
      return config.consentEnabled && !consentChecked ? "Tick the box to give permission." : null;
    }
    return null;
  })();

  const goBack = () => {
    const index = steps.indexOf(step);
    if (index <= 0) setStep(config.welcomeEnabled ? "welcome" : "rate");
    else setStep(steps[index - 1]);
  };

  const upload = async (file: Blob, path: string, contentType: string): Promise<string> => {
    const { error: uploadError } = await supabase.storage.from("videos").upload(path, file, { contentType, upsert: false });
    if (uploadError) throw new UploadError(uploadError.message);
    return supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async () => {
    const returnTo = step;
    setSubmitError(null);
    setStep("sending");
    try {
      let video_url: string | undefined;
      let audio_url: string | undefined;
      let author_avatar: string | undefined;

      if (format !== "text" && media) {
        setSendingLabel(format === "video" ? "Uploading your video" : "Uploading your recording");
        const ext = extensionForMime(media.type, format);
        const url = await upload(media, `submissions/${slug}/${crypto.randomUUID()}.${ext}`, contentTypeFor(media.type, format));
        if (format === "video") video_url = url;
        else audio_url = url;
      }

      if (photo && displayPreference !== "anonymous") {
        setSendingLabel("Uploading your photo");
        author_avatar = await upload(photo, `submissions/${slug}/${crypto.randomUUID()}.jpg`, "image/jpeg");
      }

      setSendingLabel("Sending your testimonial");
      const content = format === "text" ? story : note.trim() || undefined;
      const { data, error: invokeError } = await supabase.functions.invoke("submit-testimonial", {
        body: {
          form_slug: slug,
          content,
          rating: rating >= 1 && rating <= 5 ? rating : undefined,
          author_name: authorName.trim(),
          author_email: authorEmail.trim() || undefined,
          author_title: authorTitle.trim() || undefined,
          author_company: authorCompany.trim() || undefined,
          author_avatar,
          type: format,
          video_url,
          audio_url,
          custom_fields: format === "text" && guided ? answersByQuestion(prompts, answers) : {},
          source: "form",
          consent_given: config.consentEnabled ? consentChecked : false,
          consent_text: config.consentEnabled ? consentText : undefined,
          display_preference: config.nameDisplayEnabled ? displayPreference : "full",
        },
      });
      if (invokeError) throw invokeError;
      const code = (data as { error?: string } | null)?.error;
      if (code) {
        setSubmitError(submitErrorMessage(code));
        setStep(returnTo);
        return;
      }

      try {
        sessionStorage.removeItem(draftKey(slug));
      } catch {
        /* nothing to clear */
      }
      setStep("done");

      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (config.confettiEnabled && !reducedMotion && !lowRating) {
        setTimeout(() => {
          void confetti({ particleCount: 70, spread: 62, origin: { y: 0.55 }, colors: [brand, "#C0902A", "#E9D9A6", "#1A1714"] });
        }, 250);
      }
    } catch (err) {
      console.error("Testimonial submit failed:", err);
      if (err instanceof UploadError) {
        setSubmitError("Your file did not upload. Check your connection and try again. A shorter recording uploads faster.");
      } else {
        setSubmitError(submitErrorMessage(await readFunctionErrorCode(err)));
      }
      setStep(returnTo);
    }
  };

  const handleNext = () => {
    if (problem) {
      setShowProblems(true);
      return;
    }
    if (isLast) {
      void handleSubmit();
      return;
    }
    setStep(steps[steps.indexOf(step) + 1]);
  };

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose a photo (JPG or PNG).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is larger than 8 MB. Choose a smaller one.");
      return;
    }
    try {
      const resized = await resizeImageToSquare(file);
      setPhoto(resized);
      setPhotoUrl(URL.createObjectURL(resized));
    } catch {
      setPhotoError("That photo could not be read. Try a different one.");
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoError(null);
  };

  const footer = (
    <div className="mt-8">
      {(submitError || (showProblems && problem)) && (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/25 bg-destructive-light px-3.5 py-2.5 text-sm text-destructive">
          {submitError ?? problem}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={goBack}>
          <ArrowLeft className="mr-1.5" /> Back
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleNext}
          aria-disabled={!!problem}
          className={cn("min-w-[9rem]", problem && "opacity-60")}
          style={brandButton}
        >
          {isLast ? "Send testimonial" : "Continue"}
          {!isLast && <ArrowRight className="ml-1.5" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full" style={{ backgroundColor: brand }} aria-hidden="true" />
      <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-8 sm:pt-12">
        <header className="mb-6 flex items-center justify-center">
          {form.logo_url ? (
            <img src={form.logo_url} alt={company} className="h-10 max-w-[12rem] object-contain" />
          ) : (
            <p className="display text-2xl text-foreground">{company}</p>
          )}
        </header>

        <div className="rounded-2xl border border-border bg-card shadow-subtle">
          {step !== "welcome" && step !== "sending" && step !== "done" && (
            <div className="border-b border-border-subtle px-6 pb-4 pt-5 sm:px-8">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Step {stepNumber} of {steps.length}
                </span>
              </div>
              <div
                className="flex gap-1.5"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-valuenow={stepNumber}
                aria-label="Progress"
              >
                {steps.map((s, i) => (
                  <span
                    key={s}
                    className="h-1.5 flex-1 rounded-full bg-muted transition-colors"
                    style={i < stepNumber ? { backgroundColor: brand } : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-7 sm:px-8 sm:py-9">
            {step === "welcome" && (
              <div className="animate-fade-in text-center">
                <h1 className="display text-[2.1rem] text-foreground text-balance">
                  {form.welcome_title?.trim() || "Share your experience"}
                </h1>
                <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground text-pretty">
                  {form.welcome_message?.trim() || `Tell ${company} how it went. Your words help other people decide.`}
                </p>
                <Button type="button" size="lg" className="mt-8 w-full sm:w-auto sm:min-w-[14rem]" style={brandButton} onClick={() => setStep("rate")}>
                  Get started <ArrowRight className="ml-1.5" />
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">Takes about 2 minutes.</p>
              </div>
            )}

            {step === "rate" && (
              <div className="animate-fade-in">
                <StepHeading ref={headingRef} title={`How was your experience with ${company}?`} />
                <div className="mt-6">
                  <StarInput value={rating} onChange={setRating} label="Your rating" />
                  <p className="mt-2 text-center text-sm text-muted-foreground" aria-live="polite">
                    {rating === 0
                      ? form.require_rating
                        ? "Tap a star to rate."
                        : "Optional. Tap a star to rate."
                      : ["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                  </p>
                </div>

                {(formats.length > 1 || config.aiEnabled) && (
                  <fieldset className="mt-8">
                    <legend className="mb-3 text-sm font-medium text-foreground">How would you like to share it?</legend>
                    <div className="grid gap-2.5" role="radiogroup" aria-label="How would you like to share it?">
                      {formats.includes("text") && (
                        <FormatOption icon={PenLine} label="Write it" hint="Type your answers" selected={format === "text"} onSelect={() => setFormat("text")} brand={brand} />
                      )}
                      {formats.includes("video") && (
                        <FormatOption icon={Video} label="Record a video" hint={`Up to ${config.videoMaxLength} seconds, from this device`} selected={format === "video"} onSelect={() => setFormat("video")} brand={brand} />
                      )}
                      {formats.includes("audio") && (
                        <FormatOption icon={Mic} label="Record your voice" hint={`Up to ${config.videoMaxLength} seconds, no camera`} selected={format === "audio"} onSelect={() => setFormat("audio")} brand={brand} />
                      )}
                    </div>
                    {config.aiEnabled && (
                      <Link
                        to={`/collect/${slug}/ai`}
                        className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left transition-colors hover:border-border-hover hover:bg-muted/40"
                      >
                        <MessageCircle className="h-5 w-5 shrink-0 text-foreground" strokeWidth={1.75} />
                        <span>
                          <span className="block text-sm font-medium text-foreground">Not sure what to write?</span>
                          <span className="block text-sm text-muted-foreground">Answer a few chat questions and get a draft to approve.</span>
                        </span>
                        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    )}
                  </fieldset>
                )}
                {footer}
              </div>
            )}

            {step === "story" && (
              <div className="animate-fade-in">
                <StepHeading
                  ref={headingRef}
                  title={lowRating ? "What went wrong?" : format === "text" ? "Tell us about it" : format === "video" ? "Record your video" : "Record your voice"}
                  hint={
                    lowRating
                      ? "Be honest. Specific feedback is what helps most."
                      : format === "text"
                        ? "Write the way you talk. Specific details beat polished sentences."
                        : "Relax and speak naturally, like you are telling a friend."
                  }
                />

                {format === "text" && guided && (
                  <div className="mt-6 space-y-6">
                    {prompts.map((q) => (
                      <PromptField
                        key={q.id}
                        label={q.question}
                        hint={q.helpText}
                        required={!!q.required}
                        invalid={showProblems && !!q.required && !(answers[q.id] ?? "").trim()}
                      >
                        {(id, describedBy) =>
                          q.type === "short_text" ? (
                            <Input
                              id={id}
                              aria-describedby={describedBy}
                              value={answers[q.id] ?? ""}
                              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder={q.placeholder}
                              maxLength={500}
                            />
                          ) : (
                            <Textarea
                              id={id}
                              aria-describedby={describedBy}
                              value={answers[q.id] ?? ""}
                              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder={q.placeholder}
                              rows={3}
                              maxLength={2000}
                              className="resize-y"
                            />
                          )
                        }
                      </PromptField>
                    ))}
                  </div>
                )}

                {format === "text" && !guided && (
                  <div className="mt-6">
                    <label htmlFor="story" className="sr-only">
                      Your testimonial
                    </label>
                    <Textarea
                      id="story"
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder={lowRating ? "What happened, and what would have made it better?" : "What problem did you have before? What changed after?"}
                      rows={7}
                      maxLength={4000}
                      className="resize-y"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {freeText.trim().length < MIN_TEXT_LENGTH ? "A sentence or two is enough." : `${freeText.trim().length} characters`}
                    </p>
                  </div>
                )}

                {format !== "text" && (
                  <div className="mt-6 space-y-5">
                    {guided && (
                      <div className="rounded-xl bg-muted/50 px-4 py-3.5">
                        <p className="eyebrow mb-2">Things you could talk about</p>
                        <ul className="space-y-1.5 text-sm text-foreground">
                          {prompts.slice(0, 5).map((q) => (
                            <li key={q.id} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/50" aria-hidden="true" />
                              {q.question}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <MediaCapture key={format} kind={format} maxDuration={config.videoMaxLength} onChange={setMedia} accent={brand} />
                    <div>
                      <label htmlFor="note" className="text-sm font-medium text-foreground">
                        Add a written note <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className="mt-1.5 resize-y" />
                    </div>
                  </div>
                )}
                {footer}
              </div>
            )}

            {step === "about" && (
              <div className="animate-fade-in">
                <StepHeading ref={headingRef} title="About you" hint="So people know a real person said this." />
                <div className="mt-6 space-y-4">
                  <TextField label="Your name" required value={authorName} onChange={setAuthorName} autoComplete="name" invalid={showProblems && !authorName.trim()} />
                  <TextField
                    label="Email"
                    optional
                    type="email"
                    value={authorEmail}
                    onChange={setAuthorEmail}
                    autoComplete="email"
                    hint={`Only ${company} sees this. It is never shown publicly.`}
                    invalid={emailInvalid}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Job title" optional value={authorTitle} onChange={setAuthorTitle} autoComplete="organization-title" />
                    <TextField label="Company" optional value={authorCompany} onChange={setAuthorCompany} autoComplete="organization" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Your photo{" "}
                      {form.require_photo ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                        {photoUrl ? <img src={photoUrl} alt="Your photo" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-input bg-card px-3 text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-muted focus-within:outline focus-within:outline-2 focus-within:outline-ring">
                          <input type="file" accept="image/*" className="sr-only" onChange={(e) => void handlePhoto(e.target.files?.[0])} />
                          {photoUrl ? "Change photo" : "Add a photo"}
                        </label>
                        {photoUrl && (
                          <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
                            <X className="mr-1" /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    {photoError && (
                      <p role="alert" className="mt-2 text-sm text-destructive">
                        {photoError}
                      </p>
                    )}
                  </div>
                </div>
                {footer}
              </div>
            )}

            {step === "permission" && (
              <div className="animate-fade-in">
                <StepHeading ref={headingRef} title="One last thing" hint="You decide how this is used." />

                {config.nameDisplayEnabled && (
                  <fieldset className="mt-6">
                    <legend className="mb-2.5 text-sm font-medium text-foreground">How should your name appear?</legend>
                    <div className="space-y-2">
                      {DISPLAY_PREFERENCE_OPTIONS.map((option) => {
                        const selected = displayPreference === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                              selected ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                            )}
                          >
                            <input
                              type="radio"
                              name="display_preference"
                              value={option.value}
                              checked={selected}
                              onChange={() => setDisplayPreference(option.value)}
                              className="mt-1 h-4 w-4 accent-[hsl(var(--foreground))]"
                            />
                            <span>
                              <span className="block text-sm font-medium text-foreground">{option.label}</span>
                              <span className="block text-sm text-muted-foreground">
                                Shown as: {maskName(authorName, option.value)}
                                {option.value === "full" && (authorTitle || authorCompany) ? `, ${[authorTitle, authorCompany].filter(Boolean).join(", ")}` : ""}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {config.consentEnabled && (
                  <label
                    className={cn(
                      "mt-6 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                      consentChecked ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                      showProblems && !consentChecked && "border-destructive",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--foreground))]"
                    />
                    <span className="text-sm leading-relaxed text-foreground">{consentText}</span>
                  </label>
                )}
                {footer}
              </div>
            )}

            {step === "sending" && (
              <div className="py-10 text-center" role="status" aria-live="polite">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-base font-medium text-foreground">{sendingLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">Keep this page open. Video can take a minute on a slow connection.</p>
              </div>
            )}

            {step === "done" && (
              <div className="animate-fade-in text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={brandButton}>
                  <Check className="h-7 w-7" strokeWidth={2.5} />
                </div>
                <h1 className="display text-[2.1rem] text-foreground text-balance">{form.thank_you_title?.trim() || "Thank you"}</h1>
                <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground text-pretty">
                  {form.thank_you_message?.trim() || `${company} has your testimonial. It means a lot.`}
                </p>

                {form.incentive_enabled && form.incentive_value && (
                  <div className="mt-7 rounded-xl border border-gold/40 bg-gold-light/60 px-5 py-4">
                    <p className="eyebrow mb-2 text-gold-deep">Your thank-you</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-base font-semibold text-foreground">{form.incentive_value}</code>
                      <CopyButton text={form.incentive_value} iconOnly label="Copy code" />
                    </div>
                  </div>
                )}

                {config.review.show && (
                  <div className="mt-7 rounded-xl border border-border bg-muted/40 px-5 py-5 text-left">
                    <h2 className="text-center text-base font-semibold text-foreground">
                      {config.review.label ? `Would you also post this on ${config.review.label}?` : "Would you also leave a public review?"}
                    </h2>
                    <p className="mt-1 text-center text-sm text-muted-foreground">It takes under a minute and helps people find {company}.</p>
                    {format === "text" && story && (
                      <div className="mt-4">
                        <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-sm text-foreground scrollbar-thin">{story}</div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">Copy your words, then paste them into the review.</p>
                          <CopyButton text={story} label="Copy my words" />
                        </div>
                      </div>
                    )}
                    <Button asChild size="lg" className="mt-4 w-full" style={brandButton}>
                      <a href={config.review.url} target="_blank" rel="noopener noreferrer">
                        {config.review.label ? `Open ${config.review.label}` : "Leave a review"}
                        <ExternalLink className="ml-1.5" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogoMark className="h-3.5 w-3.5" />
            Collected with Happy Client
          </a>
        </footer>
      </main>
    </div>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */

interface StepHeadingProps {
  title: string;
  hint?: string;
}

const StepHeading = forwardRef<HTMLHeadingElement, StepHeadingProps>(({ title, hint }, ref) => (
  <div>
    <h1 ref={ref} tabIndex={-1} className="display text-[1.85rem] text-foreground text-balance outline-none">
      {title}
    </h1>
    {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
  </div>
));
StepHeading.displayName = "StepHeading";

interface FormatOptionProps {
  icon: LucideIcon;
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
  brand: string;
}

function FormatOption({ icon: Icon, label, hint, selected, onSelect, brand }: FormatOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        selected ? "bg-muted/40" : "border-border hover:border-border-hover",
      )}
      style={selected ? { borderColor: brand, boxShadow: `inset 0 0 0 1px ${brand}` } : undefined}
    >
      <Icon className="h-5 w-5 shrink-0 text-foreground" strokeWidth={1.75} />
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-sm text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-transparent" : "border-border-hover")}
        style={selected ? { backgroundColor: brand, color: readableTextColor(brand) } : undefined}
        aria-hidden="true"
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

interface PromptFieldProps {
  label: string;
  hint?: string;
  required: boolean;
  invalid?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

function PromptField({ label, hint, required, invalid, children }: PromptFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className={cn("block text-[0.9375rem] font-medium leading-snug text-foreground", invalid && "text-destructive")}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : <span className="ml-1.5 text-sm font-normal text-muted-foreground">(optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="mt-2">{children(id, hint ? hintId : undefined)}</div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  type?: string;
  autoComplete?: string;
  hint?: string;
  invalid?: boolean;
}

function TextField({ label, value, onChange, required, optional, type = "text", autoComplete, hint, invalid }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
        {optional && <span className="ml-1.5 font-normal text-muted-foreground">(optional)</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={hint ? hintId : undefined}
        maxLength={200}
        className={cn("mt-1.5", invalid && "border-destructive")}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
