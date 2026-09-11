import { describe, expect, it } from "vitest";
import {
  CHUNK_LOAD_RECOVERY_COOLDOWN_MS,
  CHUNK_LOAD_RECOVERY_KEY,
  shouldReloadForPreloadError,
} from "./chunk-load-recovery";

function memoryStorage(seed: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key() {
      return null;
    },
  } as Storage;
}

describe("shouldReloadForPreloadError", () => {
  it("allows the first recovery reload and records the timestamp", () => {
    const storage = memoryStorage();
    const now = 1_700_000_000_000;
    expect(shouldReloadForPreloadError(storage, now)).toBe(true);
    expect(storage.getItem(CHUNK_LOAD_RECOVERY_KEY)).toBe(String(now));
  });

  it("blocks reload inside the cool-down window", () => {
    const now = 1_700_000_000_000;
    const storage = memoryStorage({
      [CHUNK_LOAD_RECOVERY_KEY]: String(now),
    });
    expect(shouldReloadForPreloadError(storage, now + 1_000)).toBe(false);
  });

  it("allows another reload after the cool-down", () => {
    const now = 1_700_000_000_000;
    const storage = memoryStorage({
      [CHUNK_LOAD_RECOVERY_KEY]: String(now),
    });
    const later = now + CHUNK_LOAD_RECOVERY_COOLDOWN_MS + 1;
    expect(shouldReloadForPreloadError(storage, later)).toBe(true);
    expect(storage.getItem(CHUNK_LOAD_RECOVERY_KEY)).toBe(String(later));
  });
});
