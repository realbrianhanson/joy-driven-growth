/** Helpers for text campaigns: reading a pasted contact list and sizing a message. */

export interface Recipient {
  phone: string;
  first_name: string;
}

export interface ParsedRecipients {
  valid: Recipient[];
  /** Lines with no usable phone number, as the owner typed them. */
  invalid: string[];
  /** How many repeated numbers were dropped. */
  duplicates: number;
}

export const MAX_RECIPIENTS = 1000;

/**
 * Turns a phone number as people type it into E.164 form, or null.
 * A 10-digit number is read as US or Canada, because that is how owners
 * there write their own numbers. Other countries need the + and country code.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  if (/[a-z]/i.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (hasPlus) return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Reads a pasted list with one person on each line. A line is a phone number,
 * with an optional first name before or after it, separated by a comma or a tab.
 */
export function parseRecipients(text: string): ParsedRecipients {
  const valid: Recipient[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(/[,\t;]/).map((part) => part.trim()).filter(Boolean);
    const phoneIndex = parts.findIndex((part) => normalizePhone(part) !== null);
    if (phoneIndex === -1) {
      // A header row is not a mistake worth reporting.
      if (!/^(phone|number|mobile|cell)\b/i.test(line)) invalid.push(line);
      continue;
    }
    const phone = normalizePhone(parts[phoneIndex])!;
    if (seen.has(phone)) {
      duplicates += 1;
      continue;
    }
    seen.add(phone);
    const name = parts.find((_, index) => index !== phoneIndex) ?? "";
    valid.push({ phone, first_name: name.split(/\s+/)[0]?.slice(0, 40) ?? "" });
  }

  return { valid, invalid, duplicates };
}

/** The recipient list as text again, for a draft that is opened later. */
export function recipientsToText(recipients: unknown): string {
  if (!Array.isArray(recipients)) return "";
  return recipients
    .map((r) => {
      const record = r && typeof r === "object" ? (r as Record<string, unknown>) : {};
      const phone = typeof record.phone === "string" ? record.phone : "";
      const name = typeof record.first_name === "string" ? record.first_name : "";
      return phone ? (name ? `${phone}, ${name}` : phone) : "";
    })
    .filter(Boolean)
    .join("\n");
}

/** Fills in the two placeholders a campaign message can use. */
export function renderMessage(template: string, firstName: string, formLink: string): string {
  return template.replace(/\{first_name\}/g, firstName.trim() || "there").replace(/\{form_link\}/g, formLink);
}

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€";

export interface SmsSize {
  characters: number;
  /** How many texts the carrier bills and joins for one person. */
  segments: number;
  /** True when a character such as an emoji forces the shorter 70-character format. */
  unicode: boolean;
}

/** How a message is split into texts. Plain characters fit 160 in one text. Emoji and some symbols cut that to 70. */
export function smsSize(message: string): SmsSize {
  let units = 0;
  let unicode = false;
  for (const char of message) {
    if (GSM_BASIC.includes(char)) units += 1;
    else if (GSM_EXTENDED.includes(char)) units += 2;
    else {
      unicode = true;
      break;
    }
  }
  if (unicode) {
    const length = message.length;
    return { characters: length, segments: length <= 70 ? (length === 0 ? 0 : 1) : Math.ceil(length / 67), unicode: true };
  }
  return { characters: units, segments: units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153), unicode: false };
}

/** The most texts one message may take. Longer messages are refused before sending. */
export const MAX_SMS_SEGMENTS = 3;
