/**
 * Default marketing-use consent text. {company} is replaced with the form
 * owner's company name at render time. This is a sensible plain-language
 * default — form owners may edit it. Not legal advice.
 */
export const DEFAULT_CONSENT_TEMPLATE =
  "I give {company} permission to use my testimonial — including my name, photo, job title, and company — in their marketing materials, including their website, social media, emails, and paid advertising. I confirm this testimonial reflects my genuine, honest experience.";

export function renderConsentText(template: string, companyName: string | null | undefined): string {
  return template.replace(/\{company\}/g, companyName?.trim() || "this business");
}

export const DISPLAY_PREFERENCE_OPTIONS = [
  { value: "full", label: "Full name, title, and company" },
  { value: "first_initial", label: "First name and last initial only" },
  { value: "anonymous", label: "Keep me anonymous" },
] as const;

export type DisplayPreference = (typeof DISPLAY_PREFERENCE_OPTIONS)[number]["value"];