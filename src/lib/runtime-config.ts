/**
 * Runtime flags for Split Rock OS.
 *
 * Production builds (`import.meta.env.PROD`):
 *   Default to **live** (no fictional seed jobs) unless `VITE_SPLIT_ROCK_DEMO=true`.
 *   Set `VITE_SPLIT_ROCK_DEMO=false` explicitly on Vercel for clarity.
 *
 * Dev / sandbox preview:
 *   Default to **demo** so the suite is explorable without credentials.
 */
function envFlag(key: string): string | undefined {
  try {
    const vite = (import.meta as ImportMeta & { env?: Record<string, string | boolean> }).env;
    if (vite && typeof vite[key] === "string") return vite[key];
  } catch {
    /* ignore */
  }
  return undefined;
}

function isViteProductionBuild(): boolean {
  try {
    return Boolean(
      (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD,
    );
  } catch {
    return false;
  }
}

/** Parse `VITE_SPLIT_ROCK_DEMO` (or any tri-state flag) into a boolean. Unset → true (legacy parse default). */
export function parseDemoFlag(raw: string | undefined): boolean {
  const v = (raw ?? "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "off";
}

/**
 * Resolve demo vs live with explicit env override, then environment default:
 * - unset + production build → live (no seed jobs)
 * - unset + dev/preview → demo (explorable sandbox)
 */
export function resolveDemoDataEnabled(
  rawFlag: string | undefined,
  isProductionBuild: boolean,
): boolean {
  if (rawFlag !== undefined) return parseDemoFlag(rawFlag);
  return isProductionBuild ? false : true;
}

/** When true, load fictional projects / crews / COIs for training. */
export const isDemoDataEnabled: boolean = resolveDemoDataEnabled(
  envFlag("VITE_SPLIT_ROCK_DEMO"),
  isViteProductionBuild(),
);

/** Operator shell — may name demo clients/jobs for training context. */
export const DEMO_BANNER_OPERATOR =
  "Training mode — fictional clients (Hart, Willow Creek), 555 phone numbers, and sample jobs. Not real production data.";

/** Client portal — never name other households or jobs (isolation tests + privacy). */
export const DEMO_BANNER_CLIENT =
  "Training mode — sample data and 555 numbers. Not live production data.";

/** @deprecated Use DEMO_BANNER_OPERATOR or DEMO_BANNER_CLIENT */
export const DEMO_BANNER = DEMO_BANNER_OPERATOR;

/** Shown in operator shell when live mode is active (no seed jobs). */
export const LIVE_MODE_BANNER =
  "Live CRM — real jobs only. Fictional seed jobs are hidden. Add clients and projects, or ingest leads from partner sites.";

export const LIVE_EMPTY_HINT_OPERATOR =
  "Your live CRM is empty — no Hart / Willow Creek seed jobs. Add a client, price a bid, or wait for ingested leads.";

export const LIVE_EMPTY_HINT_CLIENT =
  "Live mode — your portal shows only your jobs. Add a client record or wait for Split Rock to link your build.";

/** @deprecated Use LIVE_EMPTY_HINT_OPERATOR or LIVE_EMPTY_HINT_CLIENT */
export const LIVE_EMPTY_HINT = LIVE_EMPTY_HINT_OPERATOR;

export const DEMO_EMPTY_HINT_OPERATOR =
  "Demo mode — sample jobs for training. Set VITE_SPLIT_ROCK_DEMO=false on production for live CRM.";

export const DEMO_EMPTY_HINT_CLIENT =
  "Demo mode — sample data for training only. Not live production data.";

/** @deprecated Use DEMO_EMPTY_HINT_OPERATOR or DEMO_EMPTY_HINT_CLIENT */
export const DEMO_EMPTY_HINT = DEMO_EMPTY_HINT_OPERATOR;

export type ModeCalloutAudience = "operator" | "client";

export function demoBannerFor(audience: ModeCalloutAudience): string {
  return audience === "client" ? DEMO_BANNER_CLIENT : DEMO_BANNER_OPERATOR;
}

export function demoEmptyHintFor(audience: ModeCalloutAudience): string {
  return audience === "client" ? DEMO_EMPTY_HINT_CLIENT : DEMO_EMPTY_HINT_OPERATOR;
}

export function liveEmptyHintFor(audience: ModeCalloutAudience): string {
  return audience === "client" ? LIVE_EMPTY_HINT_CLIENT : LIVE_EMPTY_HINT_OPERATOR;
}
