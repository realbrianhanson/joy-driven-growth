import { useState } from "react";
import { useParams } from "react-router-dom";
import { Star, ArrowRight, ArrowLeft, Check, Copy, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";
import { VideoRecorder } from "@/components/testimonials/VideoRecorder";
import { AudioRecorder } from "@/components/testimonials/AudioRecorder";
import { useFormBySlug } from "@/hooks/use-forms";
import { supabase } from "@/integrations/supabase/client";

type FormStep = "welcome" | "info" | "rating" | "content" | "thankyou";

export default function PublicForm() {
  const { slug } = useParams();
  const { data: form, isLoading, error } = useFormBySlug(slug ?? "");

  const [step, setStep] = useState<FormStep>("welcome");
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#6366F1", "#818CF8", "#A5B4FC", "#16A34A", "#D97706"],
    });
  };

  const handleSubmit = async () => {
    if (!form || !slug) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-testimonial", {
        body: {
          form_slug: slug,
          content,
          rating,
          author_name: authorName,
          author_email: authorEmail || undefined,
          author_title: authorTitle || undefined,
          author_company: authorCompany || undefined,
          type: "text",
        },
      });
      if (error) throw error;
      setStep("thankyou");
      setTimeout(fireConfetti, 300);
    } catch (err) {
      console.error("Submit error:", err);
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

  // Loading
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

  // Not found
  if (error || !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-xl shadow-subtle border p-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-destructive-light mx-auto mb-5 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Form not available</h2>
          <p className="text-sm text-muted-foreground">This form is no longer available or has been unpublished.</p>
        </div>
      </div>
    );
  }

  const brandColor = form.primary_color ?? "#6366F1";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* WELCOME */}
        {step === "welcome" && (
          <div className="bg-card rounded-xl shadow-subtle border p-8 animate-fade-in text-center">
            <div
              className="w-14 h-14 rounded-xl mx-auto mb-5 flex items-center justify-center text-white"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-xl font-bold">{form.name.charAt(0)}</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {form.welcome_title ?? "Share Your Experience"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {form.welcome_message ?? "We'd love to hear about your experience."}
            </p>
            <Button onClick={() => setStep("info")} className="w-full">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Takes about 2 minutes</p>
          </div>
        )}

        {/* INFO */}
        {step === "info" && (
          <div className="bg-card rounded-xl shadow-subtle border overflow-hidden animate-fade-in">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Step 1 of 3</span>
                <span>33%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "33%" }} />
              </div>
            </div>
            <div className="p-8 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Tell us about yourself</h3>
              <div>
                <label className="text-sm font-medium text-foreground">Your name <span className="text-destructive">*</span></label>
                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Jane Smith" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="jane@company.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input value={authorTitle} onChange={(e) => setAuthorTitle(e.target.value)} placeholder="CEO" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Company</label>
                <Input value={authorCompany} onChange={(e) => setAuthorCompany(e.target.value)} placeholder="Acme Inc" className="mt-1" />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep("welcome")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep("rating")} disabled={!authorName.trim()}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* RATING */}
        {step === "rating" && (
          <div className="bg-card rounded-xl shadow-subtle border overflow-hidden animate-fade-in">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Step 2 of 3</span>
                <span>66%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "66%" }} />
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                How would you rate your experience? <span className="text-destructive">*</span>
              </h3>
              <div className="flex justify-center gap-2 my-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="group">
                    <Star className={`w-10 h-10 transition-all duration-150 group-hover:scale-110 ${rating >= star ? "fill-warning text-warning" : "text-muted-foreground/40 group-hover:text-warning"}`} />
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep("info")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep("content")} disabled={rating === 0}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {step === "content" && (
          <div className="bg-card rounded-xl shadow-subtle border overflow-hidden animate-fade-in">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Step 3 of 3</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-foreground mb-1">Share your experience</h3>
              <p className="text-sm text-muted-foreground mb-4">What did you enjoy most? What results did you achieve?</p>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell us about your experience..." rows={5} className="resize-none" />
              <div className="flex justify-between pt-6">
                <Button variant="ghost" onClick={() => setStep("rating")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* THANK YOU */}
        {step === "thankyou" && (
          <div className="bg-card rounded-xl shadow-subtle border p-8 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-xl bg-success-light mx-auto mb-5 flex items-center justify-center">
              <Check className="w-7 h-7 text-success" strokeWidth={3} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {form.thank_you_title ?? "Thank you!"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {form.thank_you_message ?? "Thank you for sharing your story."}
            </p>

            {form.incentive_enabled && form.incentive_value && (
              <div className="bg-warning-light rounded-lg p-4 mb-5">
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
              <p className="text-xs font-semibold text-foreground">Testimonial</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
