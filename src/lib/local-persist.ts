/**
 * Lightweight browser persistence until Neon-backed tables cover every module.
 * Survives refresh; cleared per-browser; not a multi-device source of truth.
 */

const PREFIX = "split-rock-os:";

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function removeJson(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export const PERSIST_KEYS = {
  vendors: "vendors",
  policies: "insurance-policies",
  waivers: "lien-waivers",
  permitPackages: "permit-packages",
  acknowledgedAlerts: "acknowledged-alerts",
  designSessions: "design-sessions",
} as const;
