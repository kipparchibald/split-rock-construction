/**
 * Small security helpers for redirects, input caps, and same-origin checks.
 * Prefer these over ad-hoc string handling in auth / client code.
 */

/** Max free-text lengths (client + local storage poison resistance). */
export const LIMITS = {
  estimateBrief: 500,
  dailyLogWork: 2000,
  dailyLogBlockers: 1000,
  clientName: 120,
  clientNotes: 2000,
  closedJobName: 160,
  closedJobNotes: 500,
  closedJobTags: 24,
  closedJobsStored: 50,
  activityFeed: 80,
} as const;

/**
 * Resolve a user-supplied path/href to a same-origin relative location.
 * Blocks open redirects (`//evil.com`, `https://evil.com`, `javascript:`, …).
 */
export function safeInternalHref(href: string, origin: string, fallback = "/"): string {
  const raw = (href ?? "").trim();
  if (!raw) return fallback;
  // Protocol-relative and scheme URLs are never safe as internal targets.
  if (raw.startsWith("//") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    try {
      const abs = new URL(raw, origin);
      if (abs.origin !== origin) return fallback;
      return `${abs.pathname}${abs.search}${abs.hash}` || fallback;
    } catch {
      return fallback;
    }
  }
  try {
    const u = new URL(raw, origin);
    if (u.origin !== origin) return fallback;
    // Disallow backslash tricks that some browsers normalize oddly
    if (raw.includes("\\")) return fallback;
    const path = `${u.pathname}${u.search}${u.hash}`;
    return path.startsWith("/") ? path : fallback;
  } catch {
    return fallback;
  }
}

/** Clamp a number into a finite non-negative range (money / counts). */
export function safeNonNegNumber(value: unknown, max = 1e12): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

/** Truncate user text for storage / UI. */
export function clampText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
