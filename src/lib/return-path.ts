/**
 * Remembers where a visitor was headed before they had to sign in.
 *
 * A sign-in on the same tab can carry the path in the URL. A sign-up cannot:
 * the confirmation email opens a new tab on the dashboard. The path is kept
 * in localStorage for a short time so that tab can pick it up, for example
 * to finish accepting a team invite.
 */

const KEY = "hc-return-to";
const MAX_AGE_MS = 60 * 60 * 1000;

/** Only paths on this site. Never a full URL, so a link cannot send someone to another site. */
export function isSafePath(path: string | null | undefined): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

export function rememberReturnPath(path: string, now: number = Date.now()): void {
  if (!isSafePath(path)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, at: now }));
  } catch {
    // Storage is blocked. The sign-in still works, the visitor just lands on the dashboard.
  }
}

export function clearReturnPath(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Reads the remembered path once and forgets it. Returns null when there is none or it is too old. */
export function takeReturnPath(now: number = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    const saved = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof saved.at !== "number" || now - saved.at > MAX_AGE_MS || now < saved.at) return null;
    return isSafePath(saved.path as string) ? (saved.path as string) : null;
  } catch {
    return null;
  }
}
