/**
 * Recover from Vite dynamic-import / preload failures after a deploy.
 *
 * When an old tab (or SW-raced graph) tries to import a hashed chunk that no
 * longer exists on the apex CDN, the browser throws
 * "Failed to fetch dynamically imported module". Vite dispatches
 * `vite:preloadError` (cancelable) before rethrowing — we preventDefault and
 * reload once so the next document load picks up the current asset manifest.
 */

export const CHUNK_LOAD_RECOVERY_KEY = "vite_preload_recovery";

/** Min gap between automatic reloads (ms). */
export const CHUNK_LOAD_RECOVERY_COOLDOWN_MS = 30_000;

/**
 * Returns true when a reload should run; records the attempt in sessionStorage.
 * Cool-down prevents reload loops if the chunk is still missing.
 */
export function shouldReloadForPreloadError(
  storage: Pick<Storage, "getItem" | "setItem">,
  now = Date.now(),
  cooldownMs = CHUNK_LOAD_RECOVERY_COOLDOWN_MS,
): boolean {
  try {
    const raw = storage.getItem(CHUNK_LOAD_RECOVERY_KEY);
    if (raw != null) {
      const prev = Number(raw);
      if (Number.isFinite(prev) && now - prev < cooldownMs) return false;
    }
    storage.setItem(CHUNK_LOAD_RECOVERY_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

type PreloadErrorEvent = Event & {
  payload?: unknown;
};

/** Attach window listener; returns disposer. No-op when window unavailable. */
export function attachChunkLoadRecovery(target?: Window): () => void {
  if (!target || typeof target.addEventListener !== "function") return () => {};

  const onPreloadError = (event: Event) => {
    if (!shouldReloadForPreloadError(target.sessionStorage)) return;
    event.preventDefault();
    // Full navigation clears the stale module graph.
    target.location.reload();
  };

  target.addEventListener("vite:preloadError", onPreloadError as EventListener);
  return () => {
    target.removeEventListener("vite:preloadError", onPreloadError as EventListener);
  };
}

export type { PreloadErrorEvent };
