import { Star, Video, Mic, Sparkles, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FormSettings, Question } from "./types";

function renderQuestionPreview(q: Question, accent: string) {
  const placeholder = q.placeholder || "Your answer…";
  if (q.type === "rating") {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className="w-7 h-7" style={{ color: accent }} />
        ))}
      </div>
    );
  }
  if (q.type === "long_text") {
    return (
      <div className="w-full h-24 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
        {placeholder}
      </div>
    );
  }
  if (q.type === "short_text") {
    return (
      <div className="w-full h-10 rounded-lg border border-border bg-background px-3 flex items-center text-xs text-muted-foreground">
        {placeholder}
      </div>
    );
  }
  if (q.type === "multiple_choice") {
    return (
      <div className="flex flex-wrap gap-2">
        {["Option A", "Option B", "Option C"].map((o) => (
          <span key={o} className="px-3 py-1.5 rounded-full border border-border text-xs">{o}</span>
        ))}
      </div>
    );
  }
  if (q.type === "video") {
    return (
      <div className="w-full rounded-lg border border-dashed border-border bg-background p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Video className="w-6 h-6" />
        <span className="text-xs">Tap to record video</span>
      </div>
    );
  }
  if (q.type === "audio") {
    return (
      <div className="w-full rounded-lg border border-dashed border-border bg-background p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Mic className="w-6 h-6" />
        <span className="text-xs">Tap to record audio</span>
      </div>
    );
  }
  if (q.type === "sentiment") {
    return (
      <div className="flex gap-2">
        {["😞", "😐", "🙂", "😄", "🤩"].map((e, i) => (
          <span key={i} className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-lg">{e}</span>
        ))}
      </div>
    );
  }
  return <div className="h-10 rounded-lg border border-border bg-background" />;
}

function PreviewFrame({
  device,
  settings,
  questions,
}: {
  device: "mobile" | "desktop";
  settings: FormSettings;
  questions: Question[];
}) {
  const accent = settings.brandColor || "#6366F1";
  const initial = (settings.name || "F").trim().charAt(0).toUpperCase();
  return (
    <div
      className={`mx-auto bg-card border border-border rounded-2xl shadow-subtle overflow-hidden transition-all ${device === "mobile" ? "w-full max-w-[380px]" : "w-full max-w-[640px]"}`}
    >
      <div className="p-6 text-center border-b border-border" style={{ backgroundColor: accent + "12" }}>
        {settings.logo ? (
          <img src={settings.logo} alt="" className="w-14 h-14 rounded-xl mx-auto mb-4 object-cover" />
        ) : (
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-semibold"
            style={{ backgroundColor: accent }}
          >
            {initial}
          </div>
        )}
        {settings.welcomeEnabled && (
          <>
            <h2 className="text-lg font-semibold text-foreground">{settings.welcomeTitle || "Welcome"}</h2>
            {settings.welcomeMessage && (
              <p className="text-sm text-muted-foreground mt-1.5">{settings.welcomeMessage}</p>
            )}
          </>
        )}
      </div>

      <div className="max-h-[480px] overflow-y-auto p-6 space-y-6">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No questions yet.</p>
        ) : (
          questions.map((q, i) => (
            <div key={q.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">{i + 1}.</span>
                <Label className="text-sm font-medium leading-snug">
                  {q.question || <span className="text-muted-foreground italic">Untitled</span>}
                  {q.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              </div>
              {q.helpText && (
                <p className="text-xs text-muted-foreground pl-4">{q.helpText}</p>
              )}
              <div className="pl-4">{renderQuestionPreview(q, accent)}</div>
            </div>
          ))
        )}

        {settings.consentEnabled && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded border border-border mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {settings.consentText.slice(0, 220)}{settings.consentText.length > 220 ? "…" : ""}
              </p>
            </div>
          </div>
        )}

        <Button className="w-full" style={{ backgroundColor: accent }}>Submit</Button>

        <div className="text-center pt-2">
          <p className="text-[10px] text-muted-foreground">
            After submit: <span className="font-medium text-foreground">{settings.thankYouTitle}</span>
          </p>
        </div>

        {settings.aiInterviewEnabled && (
          <div className="rounded-lg border border-dashed border-border p-3 flex items-start gap-2 bg-muted/30">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div className="text-[11px] text-muted-foreground">
              This form also has a conversational <span className="font-medium text-foreground">AI Interview</span> version at{" "}
              <span className="font-mono break-all">/collect/{settings.slug}/ai</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  settings: FormSettings;
  questions: Question[];
  previewDevice: "mobile" | "desktop";
  setPreviewDevice: (d: "mobile" | "desktop") => void;
}

export function PreviewPane({ settings, questions, previewDevice, setPreviewDevice }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Button variant={previewDevice === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("mobile")}>
          <Smartphone className="w-4 h-4 mr-1.5" /> Mobile
        </Button>
        <Button variant={previewDevice === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("desktop")}>
          <Monitor className="w-4 h-4 mr-1.5" /> Desktop
        </Button>
      </div>
      <PreviewFrame device={previewDevice} settings={settings} questions={questions} />
    </div>
  );
}