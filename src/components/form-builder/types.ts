import { DEFAULT_CONSENT_TEMPLATE } from "@/lib/consent";
import type { QuestionPurpose } from "@/lib/form-templates";

/** A written prompt on a form. The star rating and the recording are separate steps. */
export interface Question {
  id: string;
  type: "short_text" | "long_text";
  question: string;
  placeholder?: string;
  helpText?: string;
  purpose?: QuestionPurpose;
  required: boolean;
}

export type ReviewPlatform = "none" | "google" | "trustpilot" | "facebook" | "g2" | "capterra" | "other";

export interface FormSettings {
  name: string;
  slug: string;
  published: boolean;
  logo: string | null;
  brandColor: string;
  welcomeEnabled: boolean;
  welcomeTitle: string;
  welcomeMessage: string;
  thankYouTitle: string;
  thankYouMessage: string;
  confettiEnabled: boolean;
  collectText: boolean;
  collectVideo: boolean;
  collectAudio: boolean;
  videoMaxLength: number;
  requireRating: boolean;
  requirePhoto: boolean;
  aiInterviewEnabled: boolean;
  aiCustomPrompt: string;
  incentiveEnabled: boolean;
  incentiveValue: string;
  consentEnabled: boolean;
  consentText: string;
  nameDisplayEnabled: boolean;
  reviewPlatform: ReviewPlatform;
  reviewUrl: string;
}

export const DEFAULT_BRAND_COLOR = "#1a1714";

export const defaultSettings: FormSettings = {
  name: "Client testimonials",
  slug: "",
  published: true,
  logo: null,
  brandColor: DEFAULT_BRAND_COLOR,
  welcomeEnabled: true,
  welcomeTitle: "Share your experience",
  welcomeMessage: "We would love to hear how it went. It takes about two minutes.",
  thankYouTitle: "Thank you",
  thankYouMessage: "Your words mean a lot to us.",
  confettiEnabled: true,
  collectText: true,
  collectVideo: true,
  collectAudio: false,
  videoMaxLength: 60,
  requireRating: true,
  requirePhoto: false,
  aiInterviewEnabled: false,
  aiCustomPrompt: "",
  incentiveEnabled: false,
  incentiveValue: "",
  consentEnabled: true,
  consentText: DEFAULT_CONSENT_TEMPLATE,
  nameDisplayEnabled: true,
  reviewPlatform: "none",
  reviewUrl: "",
};

interface RawQuestion {
  id?: unknown;
  type?: unknown;
  question?: unknown;
  placeholder?: unknown;
  helpText?: unknown;
  purpose?: unknown;
  required?: unknown;
}

/**
 * Turns saved or template questions into written prompts.
 * A rating question becomes the "require a rating" switch. Older question
 * kinds that the public form never drew properly become plain text prompts.
 */
export function toPrompts(raw: unknown): { prompts: Question[]; hasRating: boolean; hasRequiredRating: boolean } {
  const list: RawQuestion[] = Array.isArray(raw) ? (raw as RawQuestion[]) : [];
  let hasRating = false;
  let hasRequiredRating = false;
  const prompts: Question[] = [];

  list.forEach((q, i) => {
    if (!q || typeof q !== "object") return;
    if (q.type === "rating") {
      hasRating = true;
      if (q.required === true) hasRequiredRating = true;
      return;
    }
    prompts.push({
      id: String(q.id ?? `q${i + 1}`),
      type: q.type === "short_text" ? "short_text" : "long_text",
      question: typeof q.question === "string" ? q.question : "",
      placeholder: typeof q.placeholder === "string" && q.placeholder ? q.placeholder : undefined,
      helpText: typeof q.helpText === "string" && q.helpText ? q.helpText : undefined,
      purpose: typeof q.purpose === "string" ? (q.purpose as QuestionPurpose) : undefined,
      required: q.required === true,
    });
  });

  return { prompts, hasRating, hasRequiredRating };
}

export function newQuestionId(): string {
  return `q${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}
