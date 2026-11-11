/**
 * The default permission text a client agrees to. {company} is replaced with
 * the form owner's business name when the form is shown. Form owners may edit
 * it. This is plain-language wording, not legal advice.
 */
export const DEFAULT_CONSENT_TEMPLATE =
  "I give {company} permission to use my testimonial, with my name, photo, job title and company, in their marketing. This includes their website, social media, emails and paid advertising. I confirm that this testimonial is my honest experience.";

export function renderConsentText(template: string, companyName: string | null | undefined): string {
  return template.replace(/\{company\}/g, companyName?.trim() || "this business");
}

export const DISPLAY_PREFERENCE_OPTIONS = [
  { value: "full", label: "Full name, title and company" },
  { value: "first_initial", label: "First name and last initial" },
  { value: "anonymous", label: "Keep me anonymous" },
] as const;

export type DisplayPreference = (typeof DISPLAY_PREFERENCE_OPTIONS)[number]["value"];