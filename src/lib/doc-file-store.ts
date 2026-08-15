/**
 * Browser-only document attachments (IndexedDB).
 * Files persist per-browser until cleared — not synced to server or other devices.
 */

const DB_NAME = "split-rock-docs";
const DB_VERSION = 1;
const STORE = "attachments";

export interface StoredDocFile {
  id: string;
  documentId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
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
        const os = db.createObjectStore(STORE, { keyPath: "id" });
        os.createIndex("documentId", "documentId", { unique: false });
      }
    };
  });
}

export async function saveDocAttachment(
  documentId: string,
  file: File,
  id?: string,
): Promise<StoredDocFile> {
  const attachmentId = id ?? `att-${documentId}-${Date.now().toString(36)}`;
  const record: StoredDocFile = {
    id: attachmentId,
    documentId,
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
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

export async function loadDocAttachment(id: string): Promise<StoredDocFile | null> {
  try {
    const db = await openDb();
    const record = await new Promise<StoredDocFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve((req.result as StoredDocFile) ?? null);
      req.onerror = () => reject(req.error ?? new Error("IDB read failed"));
    });
    db.close();
    return record;
  } catch {
    return null;
  }
}

export async function deleteDocAttachment(id: string): Promise<void> {
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

export function docObjectUrl(file: StoredDocFile): string {
  return URL.createObjectURL(file.blob);
}
