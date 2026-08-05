/** Shared helpers for field / daily-log site photos (client-side data URLs). */

export const MAX_SITE_PHOTOS = 8;
export const MAX_SITE_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image"));
      return;
    }
    if (file.size > MAX_SITE_PHOTO_BYTES) {
      reject(new Error(`Too large (max ${MAX_SITE_PHOTO_BYTES / 1024 / 1024} MB)`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Read failed"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

export async function filesToDataUrls(
  fileList: FileList | File[],
  alreadyCount: number,
): Promise<{ urls: string[]; errors: string[] }> {
  const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of files) {
    if (alreadyCount + urls.length >= MAX_SITE_PHOTOS) {
      errors.push(`Max ${MAX_SITE_PHOTOS} photos`);
      break;
    }
    try {
      urls.push(await readImageAsDataUrl(file));
    } catch (err) {
      errors.push(err instanceof Error ? `${file.name}: ${err.message}` : `Could not read ${file.name}`);
    }
  }
  if (files.length === 0) errors.push("Drop image files only (JPG, PNG, WebP)");
  return { urls, errors };
}
