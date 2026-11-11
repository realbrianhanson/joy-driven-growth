/**
 * Pure checks for a testimonial that arrives from a public form or the API.
 * Everything here treats the input as untrusted.
 */

export const MAX_CUSTOM_FIELDS_CHARS = 20_000;
export const MAX_CUSTOM_FIELD_KEYS = 40;
const MAX_ANSWER_CHARS = 4000;

type Primitive = string | number | boolean;

function cleanPrimitive(value: unknown): Primitive | null {
  if (typeof value === "string") {
    const trimmed = value.trim().slice(0, MAX_ANSWER_CHARS);
    return trimmed || null;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  return null;
}

/**
 * Keeps answers to custom questions as a flat object of short values.
 * Returns null when the input is too large to store.
 */
export function cleanCustomFields(input: unknown): Record<string, Primitive | Primitive[]> | null {
  if (input == null) return {};
  if (typeof input !== "object" || Array.isArray(input)) return {};

  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > MAX_CUSTOM_FIELD_KEYS) return null;

  const clean: Record<string, Primitive | Primitive[]> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim().slice(0, 300);
    if (!key) continue;
    if (Array.isArray(rawValue)) {
      const list = rawValue
        .map(cleanPrimitive)
        .filter((v): v is Primitive => v !== null)
        .slice(0, 20);
      if (list.length > 0) clean[key] = list;
      continue;
    }
    const value = cleanPrimitive(rawValue);
    if (value !== null) clean[key] = value;
  }

  return JSON.stringify(clean).length > MAX_CUSTOM_FIELDS_CHARS ? null : clean;
}

/** True for an https link to a public file in this project's own storage. */
export function isAllowedMediaUrl(value: unknown, storageHost: string): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > 1000) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === storageHost &&
      url.pathname.startsWith("/storage/v1/object/public/") &&
      !url.pathname.includes("..")
    );
  } catch {
    return false;
  }
}

/** A whole star rating from 1 to 5, or null when none was given. */
export function cleanRating(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(1, Math.min(5, Math.round(parsed)));
}

/** A plausible email address in lower case, or null. A bad address never blocks a testimonial. */
export function cleanEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 200) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

/** Trimmed text up to max characters, or null when empty. */
export function cleanOptionalText(value: unknown, max: number): string | null {
  if (value == null) return null;
  const text = String(value).trim().slice(0, max);
  return text || null;
}

const FORM_SOURCES = ["form", "ai_interview", "sms"];

/** Where a form submission came from. Anything unknown counts as the form itself. */
export function formSource(value: unknown): string {
  return typeof value === "string" && FORM_SOURCES.includes(value) ? value : "form";
}
