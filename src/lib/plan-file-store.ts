/**
 * Browser store for plan PDFs / images.
 * localStorage is too small for full plan sets; IndexedDB holds the bytes.
 * Session metadata still lives in localStorage via design-sessions.
 */

const DB_NAME = "split-rock-plans";
const DB_VERSION = 1;
const STORE = "files";

export interface StoredPlanFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  /** PDF | image | other */
  kind: "pdf" | "image" | "other";
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export function planKindFromFile(file: { name: string; type: string }): "pdf" | "image" | "other" {
  const t = (file.type || "").toLowerCase();
  const n = file.name.toLowerCase();
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic)$/i.test(n)) return "image";
  return "other";
}

/** Default session id for Design Center until multi-job plan binding lands. */
export const DEFAULT_PLAN_FILE_ID = "design-center-active";

export async function savePlanFile(
  file: File,
  id: string = DEFAULT_PLAN_FILE_ID,
): Promise<StoredPlanFile> {
  const kind = planKindFromFile(file);
  const record: StoredPlanFile = {
    id,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
    kind,
    blob: file,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IDB write failed"));
    tx.objectStore(STORE).put(record);
  });
  db.close();
  return record;
}

export async function loadPlanFile(id: string = DEFAULT_PLAN_FILE_ID): Promise<StoredPlanFile | null> {
  try {
    const db = await openDb();
    const record = await new Promise<StoredPlanFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as StoredPlanFile) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IDB read failed"));
    });
    db.close();
    return record;
  } catch {
    return null;
  }
}

export async function deletePlanFile(id: string = DEFAULT_PLAN_FILE_ID): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IDB delete failed"));
      tx.objectStore(STORE).delete(id);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

/** Create a revocable object URL for iframe / img preview. Caller must revoke. */
export function planObjectUrl(file: StoredPlanFile): string {
  return URL.createObjectURL(file.blob);
}
