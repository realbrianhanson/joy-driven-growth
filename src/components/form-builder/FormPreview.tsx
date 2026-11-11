import type { ReactNode } from "react";
import { Check, Mic, PenLine, Star, Video } from "lucide-react";
import { renderConsentText } from "@/lib/consent";
import { readableTextColor, safeHex } from "@/lib/format";
import { DEFAULT_BRAND_COLOR, type FormSettings, type Question } from "./types";

interface Props {
  settings: FormSettings;
  questions: Question[];
  company: string | null;
}

function Screen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-1.5">{label}</p>
      <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">{children}</div>
    </div>
  );
}

/** A small, faithful picture of what a client sees, screen by screen. */
export function FormPreview({ settings, questions, company }: Props) {
  const brand = safeHex(settings.brandColor, DEFAULT_BRAND_COLOR);
  const button = { backgroundColor: brand, color: readableTextColor(brand) };
  const name = company?.trim() || settings.name || "your business";
  const formats = [
    settings.collectText && { icon: PenLine, label: "Write it" },
    settings.collectVideo && { icon: Video, label: "Record a video" },
    settings.collectAudio && { icon: Mic, label: "Record your voice" },
  ].filter(Boolean) as { icon: typeof PenLine; label: string }[];

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-4 h-1 rounded-full" style={{ backgroundColor: brand }} />
      <div className="mb-4 flex justify-center">
        {settings.logo ? (
          <img src={settings.logo} alt="" className="h-8 max-w-[9rem] object-contain" />
        ) : (
          <p className="display text-lg text-foreground">{name}</p>
        )}
      </div>

      <div className="space-y-4">
        {settings.welcomeEnabled && (
          <Screen label="Welcome">
            <p className="display text-xl text-foreground">{settings.welcomeTitle || "Share your experience"}</p>
            {settings.welcomeMessage && <p className="mt-1 text-sm text-muted-foreground">{settings.welcomeMessage}</p>}
            <span className="mt-3 inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium" style={button}>
              Get started
            </span>
          </Screen>
        )}

        <Screen label="Rating">
          <p className="text-sm font-medium text-foreground">How was your experience with {name}?</p>
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-5 w-5 fill-gold text-gold" strokeWidth={1.25} />
            ))}
          </div>
          {!settings.requireRating && <p className="mt-1 text-xs text-muted-foreground">Optional</p>}
          {formats.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {formats.map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground">
                  <f.icon className="h-3.5 w-3.5" /> {f.label}
                </span>
              ))}
            </div>
          )}
          {settings.aiInterviewEnabled && <p className="mt-2 text-xs text-muted-foreground">Plus: a guided chat for clients who do not know what to write.</p>}
        </Screen>

        <Screen label={questions.length > 0 ? "Questions" : "Their story"}>
          {questions.length === 0 ? (
            <div className="h-16 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              What problem did you have before? What changed after?
            </div>
          ) : (
            <ol className="space-y-3">
              {questions.map((q) => (
                <li key={q.id}>
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {q.question.trim() || <span className="italic text-muted-foreground">New question</span>}
                    {q.required && <span className="ml-1 text-destructive">*</span>}
                  </p>
                  {q.helpText && <p className="mt-0.5 text-xs text-muted-foreground">{q.helpText}</p>}
                  <div className={`mt-1.5 rounded-lg border border-border bg-background ${q.type === "short_text" ? "h-8" : "h-12"}`} />
                </li>
              ))}
            </ol>
          )}
        </Screen>

        <Screen label="About them">
          <p className="text-sm text-foreground">Name, and if they want: email, job title, company, photo{settings.requirePhoto ? " (required)" : ""}.</p>
        </Screen>

        {(settings.consentEnabled || settings.nameDisplayEnabled) && (
          <Screen label="Permission">
            {settings.nameDisplayEnabled && <p className="text-sm text-foreground">They choose: full name, first name and initial, or anonymous.</p>}
            {settings.consentEnabled && (
              <div className="mt-2 flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border-hover" aria-hidden="true">
                  <Check className="h-3 w-3 text-muted-foreground" />
                </span>
                <p className="line-clamp-4 text-xs leading-relaxed text-muted-foreground">{renderConsentText(settings.consentText, company)}</p>
              </div>
            )}
          </Screen>
        )}

        <Screen label="Thank you">
          <p className="display text-xl text-foreground">{settings.thankYouTitle || "Thank you"}</p>
          {settings.thankYouMessage && <p className="mt-1 text-sm text-muted-foreground">{settings.thankYouMessage}</p>}
          {settings.incentiveEnabled && settings.incentiveValue.trim() && (
            <p className="mt-2 inline-block rounded-lg border border-gold/40 bg-gold-light/60 px-2.5 py-1 font-mono text-xs text-foreground">{settings.incentiveValue}</p>
          )}
          {settings.reviewPlatform !== "none" && settings.reviewUrl.trim() && (
            <p className="mt-2 text-xs text-muted-foreground">Then a button asks them to post a public review too.</p>
          )}
        </Screen>
      </div>
    </div>
  );
}
