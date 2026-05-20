// Public-facing app URL. Used to build embeddable widget snippets that get
// pasted onto customer websites, so it must be the production domain — never
// the Lovable preview URL.
// Override per-environment via VITE_PUBLIC_APP_URL; falls back to the
// production domain.
export const PUBLIC_APP_URL =
  (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://happyclient.io";