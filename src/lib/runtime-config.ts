/**
 * Runtime flags for Split Rock OS.
 *
 * Production / live publish:
 *   Set VITE_SPLIT_ROCK_DEMO=false so fictional seed jobs do not appear.
 *
 * Local sandbox (default):
 *   Demo data stays on so the suite is explorable without a real job yet.
 */
function envFlag(key: string): string | undefined {
  try {
    // Vite
    const vite = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (vite && typeof vite[key] === "string") return vite[key];
  } catch {
    /* ignore */
  }
  return undefined;
}

/** When true, load fictional projects / crews / COIs for training. */
export const isDemoDataEnabled: boolean = (() => {
  const v = (envFlag("VITE_SPLIT_ROCK_DEMO") ?? "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "off";
})();

/** Soft banner in the shell when demo data is active. */
export const DEMO_BANNER =
  "Demo data is active — fictional jobs and 555 numbers. Set VITE_SPLIT_ROCK_DEMO=false for live publish.";

export const LIVE_EMPTY_HINT =
  "Live mode: no seed jobs. Add your first client and project to begin.";
