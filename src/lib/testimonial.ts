import type { Database } from "@/integrations/supabase/types";

export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type TestimonialStatus = Database["public"]["Enums"]["testimonial_status"];
export type TestimonialType = Database["public"]["Enums"]["testimonial_type"];

export const SOURCE_LABELS: Record<string, string> = {
  form: "Form",
  ai_interview: "Guided interview",
  import: "Imported",
  manual: "Added by you",
  api: "API",
  sms: "SMS",
};

export function sourceLabel(source: string | null | undefined): string {
  return SOURCE_LABELS[source ?? "form"] ?? "Form";
}

/**
 * How a name appears in public, by the display choice the customer made.
 * Mirrors the database function mask_author_name so previews match the live page.
 */
export function maskName(name: string | null | undefined, preference: string | null | undefined): string {
  const clean = (name ?? "").trim() || "Anonymous";
  if (preference === "anonymous") return "Anonymous";
  if (preference === "first_initial") {
    const [first, ...rest] = clean.split(/\s+/);
    const last = rest.join(" ").trim();
    return last ? `${first} ${last[0].toUpperCase()}.` : first;
  }
  return clean;
}

/** The words to show for a testimonial: the reviewed draft if one exists, else what they wrote. */
export function displayContent(t: Pick<TestimonialRow, "content">): string {
  return (t.content ?? "").trim();
}

export interface AnswerEntry {
  label: string;
  answer: string;
}

/**
 * Custom answers as label and answer pairs. Older submissions are keyed by
 * question id ("2"); newer ones by the question text. Pass the form's
 * questions to turn ids back into the words the customer saw.
 */
export function answerEntries(
  customFields: unknown,
  questions?: { id: string; question: string }[],
): AnswerEntry[] {
  if (!customFields || typeof customFields !== "object" || Array.isArray(customFields)) return [];
  const byId = new Map((questions ?? []).map((q) => [q.id, q.question]));
  return Object.entries(customFields as Record<string, unknown>)
    .map(([key, value]) => ({
      label: byId.get(key) ?? (/^\d+$/.test(key) ? `Question ${key}` : key),
      answer: typeof value === "string" ? value.trim() : value == null ? "" : JSON.stringify(value),
    }))
    .filter((entry) => entry.answer.length > 0);
}

/* ───────────────────────── CSV import ───────────────────────── */

export interface ImportRow {
  author_name: string;
  content: string;
  rating: number | null;
  author_title: string | null;
  author_company: string | null;
  author_email: string | null;
}

export interface ImportResult {
  rows: ImportRow[];
  skipped: number;
  error: string | null;
}

/** RFC 4180 style parser: quoted fields, escaped quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  author_name: ["name", "author", "author name", "author_name", "customer", "customer name", "full name", "reviewer"],
  content: ["testimonial", "content", "review", "quote", "text", "feedback", "comment", "message", "body"],
  rating: ["rating", "stars", "score", "star rating"],
  author_title: ["title", "job title", "role", "position", "author_title"],
  author_company: ["company", "organization", "organisation", "business", "author_company"],
  author_email: ["email", "e-mail", "email address", "author_email"],
};

export const IMPORT_MAX_ROWS = 500;

/**
 * Turns a pasted or uploaded CSV into testimonial rows. Needs a header row
 * with at least a name column and a testimonial column; other columns are optional.
 */
export function parseTestimonialCsv(text: string): ImportResult {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { rows: [], skipped: 0, error: "Add a header row and at least one testimonial." };
  }

  const header = table[0].map((h) => h.trim().toLowerCase());
  const indexOf = (field: keyof ImportRow) => header.findIndex((h) => HEADER_ALIASES[field].includes(h));
  const nameIdx = indexOf("author_name");
  const contentIdx = indexOf("content");
  if (nameIdx === -1 || contentIdx === -1) {
    return {
      rows: [],
      skipped: 0,
      error: 'The first row needs a "name" column and a "testimonial" column.',
    };
  }
  const ratingIdx = indexOf("rating");
  const titleIdx = indexOf("author_title");
  const companyIdx = indexOf("author_company");
  const emailIdx = indexOf("author_email");

  const cell = (r: string[], idx: number) => (idx >= 0 ? (r[idx] ?? "").trim() : "");
  const rows: ImportRow[] = [];
  let skipped = 0;

  for (const r of table.slice(1)) {
    const author_name = cell(r, nameIdx).slice(0, 200);
    const content = cell(r, contentIdx).slice(0, 4000);
    if (!author_name || !content) {
      skipped++;
      continue;
    }
    const parsedRating = Math.round(Number.parseFloat(cell(r, ratingIdx)));
    const email = cell(r, emailIdx);
    rows.push({
      author_name,
      content,
      rating: parsedRating >= 1 && parsedRating <= 5 ? parsedRating : null,
      author_title: cell(r, titleIdx).slice(0, 200) || null,
      author_company: cell(r, companyIdx).slice(0, 200) || null,
      author_email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 200) : null,
    });
  }

  if (rows.length === 0) {
    return { rows: [], skipped, error: "No rows had both a name and a testimonial." };
  }
  if (rows.length > IMPORT_MAX_ROWS) {
    return {
      rows: [],
      skipped,
      error: `That file has ${rows.length} testimonials. Import up to ${IMPORT_MAX_ROWS} at a time.`,
    };
  }
  return { rows, skipped, error: null };
}

/** CSV text for an export. Quotes any field that needs it. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const s = value == null ? "" : String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
}

export function downloadTextFile(filename: string, text: string, mime = "text/csv;charset=utf-8"): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
