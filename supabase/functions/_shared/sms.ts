/**
 * Pure rules for text campaigns. A text costs money and reaches a real
 * phone, so every limit is checked on the server and never trusted from
 * the browser.
 */

/** Texts each plan may send in a calendar month. null means no monthly cap. Keep in step with src/lib/billing-plans.ts. */
export const SMS_MONTHLY_ALLOWANCE: Record<string, number | null> = {
  free: 0,
  starter: 100,
  pro: 500,
  scale: null,
};

export const MAX_CAMPAIGN_RECIPIENTS = 1000;
export const MAX_SMS_SEGMENTS = 3;

export function monthlyAllowance(plan: string | null | undefined): number | null {
  const key = (plan ?? "free").toLowerCase();
  return key in SMS_MONTHLY_ALLOWANCE ? SMS_MONTHLY_ALLOWANCE[key] : 0;
}

export interface Recipient {
  phone: string;
  first_name: string;
}

/** A phone number in E.164 form: a plus sign, then 8 to 15 digits. */
export function isE164(phone: unknown): phone is string {
  return typeof phone === "string" && /^\+[1-9]\d{7,14}$/.test(phone);
}

/**
 * Reads the recipient list stored on a campaign. Bad entries and repeats are
 * dropped, so one person never gets the same text twice.
 */
export function cleanRecipients(input: unknown): Recipient[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const clean: Recipient[] = [];
  for (const entry of input) {
    const record = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    if (!isE164(record.phone) || seen.has(record.phone)) continue;
    seen.add(record.phone);
    const name = typeof record.first_name === "string" ? record.first_name.trim().split(/\s+/)[0] ?? "" : "";
    clean.push({ phone: record.phone, first_name: name.slice(0, 40) });
  }
  return clean;
}

/**
 * Country calling codes this app may text. The default is the US and Canada.
 * Texting every country by default invites toll fraud, where a fake account
 * sends texts to premium numbers that the attacker owns.
 */
export function allowedCountryCodes(setting: string | null | undefined): string[] {
  const codes = (setting ?? "")
    .split(",")
    .map((code) => code.trim().replace(/^\+/, ""))
    .filter((code) => /^\d{1,4}$/.test(code));
  return codes.length > 0 ? codes : ["1"];
}

/** The numbers that fall outside the allowed countries. */
export function blockedNumbers(recipients: Recipient[], codes: string[]): string[] {
  return recipients.filter((r) => !codes.some((code) => r.phone.startsWith(`+${code}`))).map((r) => r.phone);
}

/** Fills in the two placeholders a campaign message can use. */
export function renderMessage(template: string, firstName: string, formLink: string): string {
  return template.replace(/\{first_name\}/g, firstName.trim() || "there").replace(/\{form_link\}/g, formLink);
}

const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€";

/** How many texts a carrier bills for one message. Plain characters fit 160 in one text. Emoji cut that to 70. */
export function smsSegments(message: string): number {
  let units = 0;
  for (const char of message) {
    if (GSM_BASIC.includes(char)) units += 1;
    else if (GSM_EXTENDED.includes(char)) units += 2;
    else {
      const length = message.length;
      return length === 0 ? 0 : length <= 70 ? 1 : Math.ceil(length / 67);
    }
  }
  return units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153);
}

/** The first day of the current month in UTC, as an ISO string. The monthly allowance counts from here. */
export function monthStartIso(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export type CampaignProblem =
  | { error: "no_recipients" }
  | { error: "too_many_recipients"; limit: number }
  | { error: "country_not_allowed"; numbers: string[] }
  | { error: "missing_form_link" }
  | { error: "message_too_long"; segments: number }
  | { error: "sms_not_in_plan" }
  | { error: "sms_allowance_exceeded"; remaining: number };

interface CampaignCheck {
  recipients: Recipient[];
  template: string;
  formLink: string;
  plan: string | null;
  usedThisMonth: number;
  countryCodes: string[];
}

/** Every rule a campaign must pass before a single text is queued. Returns the first problem, or null. */
export function checkCampaign(input: CampaignCheck): CampaignProblem | null {
  const { recipients, template, formLink, plan, usedThisMonth, countryCodes } = input;

  const allowance = monthlyAllowance(plan);
  if (allowance === 0) return { error: "sms_not_in_plan" };

  if (recipients.length === 0) return { error: "no_recipients" };
  if (recipients.length > MAX_CAMPAIGN_RECIPIENTS) return { error: "too_many_recipients", limit: MAX_CAMPAIGN_RECIPIENTS };

  const blocked = blockedNumbers(recipients, countryCodes);
  if (blocked.length > 0) return { error: "country_not_allowed", numbers: blocked.slice(0, 5) };

  if (!template.includes("{form_link}")) return { error: "missing_form_link" };

  const longestName = recipients.reduce((longest, r) => (r.first_name.length > longest.length ? r.first_name : longest), "");
  const segments = smsSegments(renderMessage(template, longestName, formLink));
  if (segments > MAX_SMS_SEGMENTS) return { error: "message_too_long", segments };

  if (allowance !== null && usedThisMonth + recipients.length > allowance) {
    return { error: "sms_allowance_exceeded", remaining: Math.max(0, allowance - usedThisMonth) };
  }
  return null;
}
