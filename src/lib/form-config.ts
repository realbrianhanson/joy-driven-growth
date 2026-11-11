import { DEFAULT_CONSENT_TEMPLATE } from "@/lib/consent";

export type QuestionType = "short_text" | "long_text" | "rating" | "video" | "audio" | "multiple_choice" | "sentiment";

export interface FormQuestion {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  purpose?: string;
}

export type ReviewPrompt = { show: false } | { show: true; label: string; url: string };

export interface FormConfig {
  aiEnabled: boolean;
  aiPrompt: string | null;
  /** Written prompts only. The star rating and the recording are their own steps. */
  prompts: FormQuestion[];
  welcomeEnabled: boolean;
  confettiEnabled: boolean;
  videoMaxLength: number;
  consentEnabled: boolean;
  consentText: string;
  nameDisplayEnabled: boolean;
  review: ReviewPrompt;
}

const REVIEW_LABELS: Record<string, string> = {
  google: "Google",
  trustpilot: "Trustpilot",
  facebook: "Facebook",
  g2: "G2",
  capterra: "Capterra",
  other: "",
};

/** Builds a safe http(s) link to a review page. Returns null for anything else. */
export function buildReviewUrl(platform: string, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let candidate: string;
  if (platform === "google" && !/^https?:\/\//i.test(trimmed) && !trimmed.includes(".")) {
    candidate = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(trimmed)}`;
  } else if (/^https?:\/\//i.test(trimmed)) {
    candidate = trimmed;
  } else {
    candidate = `https://${trimmed}`;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asQuestions(value: unknown): FormQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
    .map((q, i) => ({
      id: String(q.id ?? i + 1),
      type: (typeof q.type === "string" ? q.type : "long_text") as QuestionType,
      question: typeof q.question === "string" ? q.question.trim() : "",
      placeholder: typeof q.placeholder === "string" ? q.placeholder : undefined,
      helpText: typeof q.helpText === "string" ? q.helpText : undefined,
      required: q.required === true,
      purpose: typeof q.purpose === "string" ? q.purpose : undefined,
    }))
    .filter((q) => q.question.length > 0);
}

/** Questions a customer answers in writing. Rating and recordings have their own steps. */
export function writtenPrompts(questions: FormQuestion[]): FormQuestion[] {
  return questions.filter((q) => q.type !== "rating" && q.type !== "video" && q.type !== "audio");
}

/**
 * Reads the JSON stored on a form into settings with safe defaults.
 * Older forms store a bare array of questions; newer ones store an object.
 */
export function parseFormConfig(customQuestions: unknown): FormConfig {
  const root = Array.isArray(customQuestions) ? { questions: customQuestions } : asRecord(customQuestions);
  const settings = asRecord(root.settings);
  const questions = asQuestions(root.questions);

  let platform = typeof settings.review_platform === "string" ? settings.review_platform.trim() : "";
  let value = typeof settings.review_url === "string" ? settings.review_url.trim() : "";
  if (!platform && typeof settings.google_place_id === "string" && settings.google_place_id.trim()) {
    platform = "google";
    value = settings.google_place_id.trim();
  }
  const reviewUrl = platform && platform !== "none" ? buildReviewUrl(platform, value) : null;

  const maxLength = Number(settings.video_max_length);

  return {
    aiEnabled: root.ai_enabled === true,
    aiPrompt: typeof root.ai_prompt === "string" && root.ai_prompt.trim() ? root.ai_prompt.trim() : null,
    prompts: writtenPrompts(questions),
    welcomeEnabled: settings.welcome_enabled !== false,
    confettiEnabled: settings.confetti_enabled !== false,
    videoMaxLength: Number.isFinite(maxLength) && maxLength >= 15 && maxLength <= 300 ? maxLength : 60,
    consentEnabled: settings.consent_enabled !== false,
    consentText:
      typeof settings.consent_text === "string" && settings.consent_text.trim()
        ? settings.consent_text
        : DEFAULT_CONSENT_TEMPLATE,
    nameDisplayEnabled: settings.name_display_enabled !== false,
    review: reviewUrl ? { show: true, label: REVIEW_LABELS[platform] ?? "", url: reviewUrl } : { show: false },
  };
}

/** The customer's written answers joined into one testimonial, in question order. */
export function composeStory(prompts: FormQuestion[], answers: Record<string, string>): string {
  return prompts
    .map((q) => (answers[q.id] ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Answers keyed by the question the customer saw, so they read well later. */
export function answersByQuestion(prompts: FormQuestion[], answers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of prompts) {
    const answer = (answers[q.id] ?? "").trim();
    if (answer) out[q.question.slice(0, 300)] = answer.slice(0, 4000);
  }
  return out;
}

/** The first required prompt left blank, or null when every required prompt has an answer. */
export function firstMissingPrompt(prompts: FormQuestion[], answers: Record<string, string>): FormQuestion | null {
  return prompts.find((q) => q.required && !(answers[q.id] ?? "").trim()) ?? null;
}

const SUBMIT_ERRORS: Record<string, string> = {
  rate_limited: "Too many submissions from this network. Wait a minute, then try again.",
  form_not_found: "This form is no longer accepting responses.",
  form_not_published: "This form is no longer accepting responses.",
  invalid_author_name: "Enter your name, then try again.",
  invalid_content: "Your testimonial is empty or longer than 4,000 characters.",
  missing_video_url: "Your video did not attach. Record or upload it again.",
  missing_audio_url: "Your recording did not attach. Record or upload it again.",
  invalid_video_url: "Your video did not attach. Record or upload it again.",
  invalid_audio_url: "Your recording did not attach. Record or upload it again.",
  invalid_author_avatar: "Your photo did not attach. Remove it or choose another one.",
  invalid_custom_fields: "Your answers are too long to send. Shorten them, then try again.",
};

export const GENERIC_SUBMIT_ERROR = "That did not go through. Your answers are still here. Try again.";

export function submitErrorMessage(code: string | null | undefined): string {
  return (code && SUBMIT_ERRORS[code]) || GENERIC_SUBMIT_ERROR;
}

/**
 * Pulls our error code out of a failed edge function call. supabase-js hides
 * the response body behind error.context, so a plain error.message is useless
 * to the person filling in the form.
 */
export async function readFunctionErrorCode(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context && typeof (context as Response).json === "function") {
    try {
      const body = await (context as Response).clone().json();
      return typeof body?.error === "string" ? body.error : null;
    } catch {
      return null;
    }
  }
  return null;
}
