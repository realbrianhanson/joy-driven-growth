// Public-facing app URL. Used to build embeddable widget snippets that get
// pasted onto customer websites, so it must be the domain the app is actually
// served from. Override per-environment via VITE_PUBLIC_APP_URL; falls back
// to the current window origin at runtime so snippets always work.
export const PUBLIC_APP_URL =
  (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

// Single source of truth for the sales contact email.
export const SALES_EMAIL = "sales@happyclient.io";