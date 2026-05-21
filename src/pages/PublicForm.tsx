import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Star, ArrowRight, ArrowLeft, Check, Copy, Loader2, AlertCircle, MessageSquare, Video as VideoIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { VideoRecorder } from "@/components/testimonials/VideoRecorder";
import { AudioRecorder } from "@/components/testimonials/AudioRecorder";
import { useFormBySlug } from "@/hooks/use-forms";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CONSENT_TEMPLATE, DISPLAY_PREFERENCE_OPTIONS, renderConsentText, type DisplayPreference } from "@/lib/consent";

type FormStep = "welcome" | "testimonial" | "custom" | "info" | "consent" | "uploading" | "thankyou";
type TestimonialType = "text" | "video" | "audio";

const MIN_TEXT_LENGTH = 15;

interface CustomQuestion {
  id: string;
  type: "short_text" | "long_text" | "rating" | "multiple_choice" | "sentiment";
  question: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
}

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();
  const { data: form, isLoading, error } = useFormBySlug(slug ?? "");

  const { data: ownerCompany } = useQuery({
    queryKey: ["form-owner-company", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_form_owner_company", { p_slug: slug! });
      if (error) return null;
      return (data as string | null) ?? null;
    },
  });

  const [step, setStep] = useState<FormStep>("welcome");
  const [lastStepBeforeSubmit, setLastStepBeforeSubmit] = useState<FormStep>("testimonial");
  const [testimonialType, setTestimonialType] = useState<TestimonialType>("text");
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState("");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [, setMediaUrl] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<DisplayPreference>("full");

  const availableTypes = useMemo<TestimonialType[]>(() => {
    if (!form) return ["text"];
    const t: TestimonialType[] = [];
    if (form.collect_text) t.push("text");
    if (form.collect_video) t.push("video");
    if (form.collect_audio) t.push("audio");
    return t.length > 0 ? t : ["text"];
  }, [form]);

  const customQuestions = useMemo<CustomQuestion[]>(() => {
    const cq = (form?.custom_questions as { questions?: CustomQuestion[] } | null)?.questions;
    return Array.isArray(cq) ? cq.filter((q) => q && q.type !== ("video" as never) && q.type !== ("audio" as never)) : [];
  }, [form]);

  const videoMaxLength = useMemo(() => {
    const cq = form?.custom_questions as { settings?: { video_max_length?: number } } | null;
    return cq?.settings?.video_max_length ?? 60;
  }, [form]);

  const consentSettings = useMemo(() => {
    const s = (form?.custom_questions as { settings?: { consent_enabled?: boolean; consent_text?: string; name_display_enabled?: boolean } } | null)?.settings ?? {};
    return {
      consentEnabled: s.consent_enabled ?? true,
      consentText: s.consent_text ?? DEFAULT_CONSENT_TEMPLATE,
      nameDisplayEnabled: s.name_display_enabled ?? true,
    };
  }, [form]);

  const renderedConsentText = useMemo(
    () => renderConsentText(consentSettings.consentText, ownerCompany),
    [consentSettings.consentText, ownerCompany],
  );

  const needsConsentStep = consentSettings.consentEnabled || consentSettings.nameDisplayEnabled;

  const brandColor = form?.primary_color ?? "#F97316";

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#F97316", "#F59E0B", "#FBBF24", "#FB7185", "#10B981"],
    });
  };

  const uploadMedia = async (): Promise<string | null> => {
    if (!mediaBlob || testimonialType === "text") return null;
    const ext = "webm";
    const path = `submissions/${slug}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(path, mediaBlob, {
        contentType: testimonialType === "video" ? "video/webm" : "audio/webm",
        upsert: false,
      });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    const { data: publicData } = supabase.storage.from("videos").getPublicUrl(path);
    return publicData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form || !slug) return;
    setLastStepBeforeSubmit(step);
    setIsSubmitting(true);
    setStep("uploading");
    try {
      let video_url: string | undefined;
      let audio_url: string | undefined;
      if (testimonialType === "video") video_url = (await uploadMedia()) ?? undefined;
      if (testimonialType === "audio") audio_url = (await uploadMedia()) ?? undefined;

      const { data, error } = await supabase.functions.invoke("submit-testimonial", {
        body: {
          form_slug: slug,
          content: testimonialType === "text" ? content : content || undefined,
          rating: rating >= 1 && rating <= 5 ? rating : undefined,
          author_name: authorName,
          author_email: authorEmail || undefined,
          author_title: authorTitle || undefined,
          author_company: authorCompany || undefined,
          type: testimonialType,
          video_url,
          audio_url,
          custom_fields: customAnswers,
          source: "form",
          consent_given: consentSettings.consentEnabled ? consentChecked : false,
          consent_text: consentSettings.consentEnabled ? renderedConsentText : undefined,
          display_preference: consentSettings.nameDisplayEnabled ? displayPreference : "full",
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

      setStep("thankyou");
      setTimeout(fireConfetti, 300);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit testimonial. Please try again.");
      setStep(lastStepBeforeSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = () => {
    if (form?.incentive_value) {
      navigator.clipboard.writeText(form.incentive_value);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-14 w-14 rounded-xl mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-xl shadow-sm border p-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 mx-auto mb-5 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Form not available</h2>
          <p className="text-sm text-muted-foreground">This form is no longer available or has been unpublished.</p>
        </div>
      </div>
    );
  }

  const stepOrder = useMemo<FormStep[]>(() => {
    const o: FormStep[] = ["testimonial"];
    if (customQuestions.length > 0) o.push("custom");
    o.push("info");
    if (needsConsentStep) o.push("consent");
    return o;
  }, [customQuestions.length, needsConsentStep]);

  const goNext = () => {
    if (step === "welcome") {
      setStep(stepOrder[0]);
      return;
    }
    const idx = stepOrder.indexOf(step);
    if (idx >= 0 && idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };

  const goBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx <= 0) setStep("welcome");
    else setStep(stepOrder[idx - 1]);
  };

  const stepIndex = (() => {
    const idx = stepOrder.indexOf(step);
    return { current: Math.max(1, idx + 1), total: stepOrder.length };
  })();

  const isLastStep = step === stepOrder[stepOrder.length - 1];

  const textTooShort = testimonialType === "text" && content.trim().length < MIN_TEXT_LENGTH;
  const testimonialIncomplete =
    (testimonialType === "text" && textTooShort) ||
    (testimonialType !== "text" && !mediaBlob) ||
    (!!form.require_rating && rating === 0);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === "welcome" && (
          <div className="bg-card rounded-xl shadow-sm border p-8 animate-fade-in text-center">
            {form.logo_url ? (
              <img src={form.logo_url} alt="" className="h-10 mx-auto mb-5" />
            ) : (
              <div
                className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center text-white"
                style={{ backgroundColor: brandColor }}
              >
                <span className="text-xl font-bold">{form.name.charAt(0)}</span>
              </div>
            )}
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {form.welcome_title ?? "Share Your Experience"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {form.welcome_message ?? "We'd love to hear about your experience."}
            </p>
            <Button onClick={goNext} className="w-full" style={{ backgroundColor: brandColor }}>
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Takes about 2 minutes</p>
          </div>
        )}

        {step === "testimonial" && (
          <StepShell index={stepIndex.current} total={stepIndex.total} brandColor={brandColor}>
            <h3 className="text-lg font-semibold text-foreground mb-1">Share your experience</h3>
            <p className="text-sm text-muted-foreground mb-4">What did you enjoy most? What results did you achieve?</p>

            {availableTypes.length > 1 && (
              <div className="grid grid-cols-1 gap-2 mb-5">
                {availableTypes.includes("text") && (
                  <TypeOption icon={MessageSquare} label="Write it" desc="Type out your testimonial" selected={testimonialType === "text"} onSelect={() => setTestimonialType("text")} brandColor={brandColor} />
                )}
                {availableTypes.includes("video") && (
                  <TypeOption icon={VideoIcon} label="Record a video" desc={`Up to ${videoMaxLength} seconds`} selected={testimonialType === "video"} onSelect={() => setTestimonialType("video")} brandColor={brandColor} />
                )}
                {availableTypes.includes("audio") && (
                  <TypeOption icon={Mic} label="Record audio" desc={`Up to ${videoMaxLength} seconds`} selected={testimonialType === "audio"} onSelect={() => setTestimonialType("audio")} brandColor={brandColor} />
                )}
              </div>
            )}

            <div className="mb-5">
              <label className="text-sm font-medium text-foreground block mb-2 text-center">
                How would you rate your experience?
                {form.require_rating && <span className="text-destructive ml-1">*</span>}
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="group" aria-label={`${star} star${star !== 1 ? "s" : ""}`}>
                    <Star className={`w-8 h-8 transition-all duration-150 group-hover:scale-110 ${rating >= star ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40 group-hover:text-amber-400"}`} />
                  </button>
                ))}
              </div>
            </div>

            {testimonialType === "text" && (
              <>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell us about your experience..." rows={5} className="resize-none" />
                {textTooShort && content.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {MIN_TEXT_LENGTH - content.trim().length} more character{MIN_TEXT_LENGTH - content.trim().length === 1 ? "" : "s"} needed
                  </p>
                )}
              </>
            )}

            {testimonialType === "video" && (
              <VideoRecorder
                maxDuration={videoMaxLength}
                onRecordingComplete={(blob, url) => {
                  setMediaBlob(blob);
                  setMediaUrl(url);
                }}
              />
            )}

            {testimonialType === "audio" && (
              <AudioRecorder
                maxDuration={videoMaxLength}
                onRecordingComplete={(blob, url) => {
                  setMediaBlob(blob);
                  setMediaUrl(url);
                }}
              />
            )}

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button onClick={goNext} disabled={testimonialIncomplete} style={{ backgroundColor: brandColor }}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </StepShell>
        )}

        {step === "info" && (
          <StepShell index={stepIndex.current} total={stepIndex.total} brandColor={brandColor}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Tell us about yourself</h3>
            <div className="space-y-3">
              <LabeledInput required label="Your name" value={authorName} onChange={setAuthorName} placeholder="Jane Smith" />
              <LabeledInput optional label="Email" value={authorEmail} onChange={setAuthorEmail} placeholder="jane@company.com" type="email" />
              <LabeledInput optional label="Title" value={authorTitle} onChange={setAuthorTitle} placeholder="CEO" />
              <LabeledInput optional label="Company" value={authorCompany} onChange={setAuthorCompany} placeholder="Acme Inc" />
            </div>
            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button
                onClick={isLastStep ? handleSubmit : goNext}
                disabled={isSubmitting || !authorName.trim()}
                style={{ backgroundColor: brandColor }}
              >
                {isLastStep ? (isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit") : <>Next <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </div>
          </StepShell>
        )}

        {step === "custom" && (
          <StepShell index={stepIndex.current} total={stepIndex.total} brandColor={brandColor}>
            <h3 className="text-lg font-semibold text-foreground mb-4">A few more questions</h3>
            <div className="space-y-4">
              {customQuestions.map((q) => (
                <div key={q.id}>
                  <label className="text-sm font-medium text-foreground">
                    {q.question}{q.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {q.helpText && (
                    <p className="text-xs text-muted-foreground mt-1">{q.helpText}</p>
                  )}
                  {q.type === "long_text" ? (
                    <Textarea
                      value={customAnswers[q.id] ?? ""}
                      onChange={(e) => setCustomAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                      placeholder={q.placeholder}
                      rows={3}
                      className="mt-1 resize-none"
                    />
                  ) : (
                    <Input
                      value={customAnswers[q.id] ?? ""}
                      onChange={(e) => setCustomAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                      placeholder={q.placeholder}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button
                onClick={goNext}
                disabled={isSubmitting}
                style={{ backgroundColor: brandColor }}
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </StepShell>
        )}

        {step === "consent" && (
          <StepShell index={stepIndex.current} total={stepIndex.total} brandColor={brandColor}>
            <h3 className="text-lg font-semibold text-foreground mb-1">One last thing</h3>
            <p className="text-sm text-muted-foreground mb-4">Please confirm before we save your testimonial.</p>

            {consentSettings.nameDisplayEnabled && (
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground">How would you like to be shown?</label>
                <div className="mt-2 space-y-2">
                  {DISPLAY_PREFERENCE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-start gap-2 p-3 rounded-lg border border-border cursor-pointer hover:border-primary/40">
                      <input
                        type="radio"
                        name="display_preference"
                        value={opt.value}
                        checked={displayPreference === opt.value}
                        onChange={() => setDisplayPreference(opt.value)}
                        className="mt-1"
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {consentSettings.consentEnabled && (
              <label className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-foreground leading-relaxed">{renderedConsentText}</span>
              </label>
            )}

            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={goBack}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (consentSettings.consentEnabled && !consentChecked)}
                style={{ backgroundColor: brandColor }}
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit"}
              </Button>
            </div>
          </StepShell>
        )}

        {step === "uploading" && (
          <div className="bg-card rounded-xl shadow-sm border p-8 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Submitting your testimonial...</p>
          </div>
        )}

        {step === "thankyou" && (
          <div className="bg-card rounded-xl shadow-sm border p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 mx-auto mb-5 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-600" strokeWidth={3} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {form.thank_you_title ?? "Thank you!"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {form.thank_you_message ?? "Thank you for sharing your story."}
            </p>

            {form.incentive_enabled && form.incentive_value && (
              <div className="bg-amber-50 rounded-lg p-4 mb-5 border border-amber-200">
                <p className="text-sm font-medium text-foreground mb-2">Here's your reward</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-card px-4 py-2 rounded-lg font-mono text-sm font-bold border">{form.incentive_value}</code>
                  <Button variant="outline" size="sm" onClick={copyCode}>
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Powered by</p>
              <p className="text-xs font-semibold text-foreground">Happy Client</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepShell({ index, total, brandColor, children }: { index: number; total: number; brandColor: string; children: React.ReactNode }) {
  const pct = Math.round((index / total) * 100);
  return (
    <div className="bg-card rounded-xl shadow-sm border overflow-hidden animate-fade-in">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {index} of {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: brandColor }} />
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, required, optional, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; optional?: boolean; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {optional && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
      </label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} className="mt-1" />
    </div>
  );
}

function TypeOption({ icon: Icon, label, desc, selected, onSelect, brandColor }: { icon: typeof MessageSquare; label: string; desc: string; selected: boolean; onSelect: () => void; brandColor: string }) {
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
      style={selected ? { borderColor: brandColor, backgroundColor: `${brandColor}10` } : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
