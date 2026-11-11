/** URL-safe slug: lowercase letters, digits and single hyphens. */
export function slugify(input: string, maxLength = 48): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function randomSuffix(length = 4): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/**
 * A slug that is unlikely to collide. Slugs are unique across every account,
 * so a bare "feedback" would fail for the second person who tries it.
 */
export function suggestSlug(name: string, fallback = "form"): string {
  const base = slugify(name, 40) || fallback;
  return `${base}-${randomSuffix()}`;
}

/** Cleans what a person types into a slug field, without fighting them mid-word. */
export function sanitizeSlugInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}
