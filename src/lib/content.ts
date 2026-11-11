import type { Database } from "@/integrations/supabase/types";

export type ContentKind = "linkedin" | "twitter" | "email" | "casestudy" | "quote";
type ContentDbType = Database["public"]["Enums"]["content_type"];

export interface ContentFormat {
  id: ContentKind;
  title: string;
  description: string;
  dbType: ContentDbType;
}

/** Every format the generator can write. Each one has a prompt on the server and a renderer here. */
export const CONTENT_FORMATS: ContentFormat[] = [
  { id: "linkedin", title: "LinkedIn post", description: "A client story for your feed", dbType: "linkedin_post" },
  { id: "twitter", title: "X thread", description: "Four to six short posts", dbType: "twitter_thread" },
  { id: "email", title: "Email proof", description: "A short section for sales emails", dbType: "email_snippet" },
  { id: "casestudy", title: "Case study", description: "Challenge, solution, results", dbType: "case_study" },
  { id: "quote", title: "Quote graphic", description: "A square image to download", dbType: "quote_graphic" },
];

/** Labels for saved rows, including formats that older versions of the app could save. */
const DB_TYPE_LABELS: Record<string, string> = {
  linkedin_post: "LinkedIn post",
  twitter_thread: "X thread",
  email_snippet: "Email proof",
  case_study: "Case study",
  quote_graphic: "Quote graphic",
  instagram_carousel: "Instagram carousel",
  video_highlight: "Video highlight",
  ai_avatar: "Video script",
};

export function contentTypeLabel(dbType: string): string {
  return DB_TYPE_LABELS[dbType] ?? "Draft";
}

export function kindFromDbType(dbType: string): ContentKind | null {
  return CONTENT_FORMATS.find((f) => f.dbType === dbType)?.id ?? null;
}

export function isContentKind(value: unknown): value is ContentKind {
  return typeof value === "string" && CONTENT_FORMATS.some((f) => f.id === value);
}

export interface LinkedInContent {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface ThreadContent {
  tweets: string[];
}

export interface EmailContent {
  subjectLines: string[];
  preheader: string;
  body: string;
  cta: string;
}

export interface CaseStudyContent {
  headline: string;
  challenge: string;
  solution: string;
  results: string;
  metrics: { label: string; value: string }[];
  pullQuote: string;
}

export interface QuoteContent {
  quote: string;
  author: string;
  company: string;
  rating: number | null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str).filter(Boolean) : [];
}

// Generated content comes from an AI model and from older saved rows, so
// every reader below accepts anything and fills gaps with empty values.

export function readLinkedIn(data: unknown): LinkedInContent {
  const d = record(data);
  return { hook: str(d.hook), body: str(d.body), cta: str(d.cta), hashtags: strList(d.hashtags) };
}

export function readThread(data: unknown): ThreadContent {
  return { tweets: strList(record(data).tweets) };
}

export function readEmail(data: unknown): EmailContent {
  const d = record(data);
  return { subjectLines: strList(d.subjectLines), preheader: str(d.preheader), body: str(d.body), cta: str(d.cta) };
}

export function readCaseStudy(data: unknown): CaseStudyContent {
  const d = record(data);
  const metrics = (Array.isArray(d.metrics) ? d.metrics : [])
    .map((m) => ({ label: str(record(m).label), value: str(record(m).value) }))
    .filter((m) => m.label && m.value);
  return {
    headline: str(d.headline),
    challenge: str(d.challenge),
    solution: str(d.solution),
    results: str(d.results),
    metrics,
    pullQuote: str(d.pullQuote),
  };
}

export function readQuote(data: unknown): QuoteContent {
  const d = record(data);
  const rating = typeof d.rating === "number" && d.rating >= 1 && d.rating <= 5 ? Math.round(d.rating) : null;
  return { quote: str(d.quote), author: str(d.author), company: str(d.company), rating };
}

function joinBlocks(blocks: (string | false | null | undefined)[]): string {
  return blocks.filter((b): b is string => typeof b === "string" && b.trim().length > 0).join("\n\n");
}

/** A generated piece as plain text, ready to paste somewhere else. */
export function flattenContent(kind: ContentKind, data: unknown): string {
  switch (kind) {
    case "linkedin": {
      const d = readLinkedIn(data);
      return joinBlocks([d.hook, d.body, d.cta, d.hashtags.join(" ")]);
    }
    case "twitter":
      return joinBlocks(readThread(data).tweets);
    case "email": {
      const d = readEmail(data);
      return joinBlocks([
        d.subjectLines[0] && `Subject: ${d.subjectLines[0]}`,
        d.preheader && `Preview: ${d.preheader}`,
        d.body,
        d.cta && `[${d.cta}]`,
      ]);
    }
    case "casestudy": {
      const d = readCaseStudy(data);
      return joinBlocks([
        d.headline,
        d.challenge && `The challenge\n${d.challenge}`,
        d.solution && `The solution\n${d.solution}`,
        d.results && `The results\n${d.results}`,
        d.metrics.map((m) => `${m.label}: ${m.value}`).join("\n"),
        d.pullQuote && `"${d.pullQuote}"`,
      ]);
    }
    case "quote": {
      const d = readQuote(data);
      const byline = [d.author, d.company].filter(Boolean).join(", ");
      return [d.quote && `"${d.quote}"`, byline].filter(Boolean).join("\n");
    }
  }
}

/**
 * The text of a saved row. New rows store plain text. Rows saved by older
 * versions of the app stored raw JSON, which is turned back into text here.
 */
export function readableStoredContent(dbType: string, raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    const kind = kindFromDbType(dbType);
    const flat = kind ? flattenContent(kind, parsed) : "";
    if (flat) return flat;
    // An older format with no renderer: show its words, one per line.
    const words: string[] = [];
    const walk = (value: unknown) => {
      if (typeof value === "string" && value.trim()) words.push(value.trim());
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(parsed);
    return words.join("\n\n") || trimmed;
  } catch {
    return trimmed;
  }
}

/** The structured data saved beside a draft, when the row has it. */
export function storedStructure(metadata: unknown): { kind: ContentKind; data: unknown } | null {
  const m = record(metadata);
  if (!isContentKind(m.contentTypeKey) || !m.structured || typeof m.structured !== "object") return null;
  return { kind: m.contentTypeKey, data: m.structured };
}

/** Turns an error code from the generator into words the owner can act on. */
export function contentErrorMessage(code: string | null | undefined): string {
  const c = (code ?? "").toLowerCase();
  if (c.includes("rate")) return "Too many drafts at once. Wait a minute, then try again.";
  if (c.includes("credit") || c.includes("unavailable") || c.includes("not_configured")) {
    return "The AI writer is not available right now. Try again later.";
  }
  if (c.includes("no_text")) return "This testimonial has no written text to work from.";
  if (c.includes("no_testimonials")) return "That testimonial is not approved, or it was deleted.";
  if (c.includes("generation_failed") || c.includes("parse")) return "The draft came back in the wrong shape. Try again.";
  return "The draft did not come through. Try again.";
}
