import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  DEFAULT_PLAN_FILE_ID,
  loadPlanFile,
  planObjectUrl,
  type StoredPlanFile,
} from "@/lib/plan-file-store";
import { cn } from "@/lib/utils";

/**
 * Renders the uploaded plan PDF or image from IndexedDB.
 * No IFC/GLB required — this is the PDF-only production path.
 */
export function PlanSheetViewer({
  className,
  reloadKey,
  onLoaded,
}: {
  className?: string;
  /** Bump when a new file is saved so the viewer reloads. */
  reloadKey?: string | number;
  onLoaded?: (file: StoredPlanFile | null) => void;
}) {
  const [file, setFile] = useState<StoredPlanFile | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    (async () => {
      setStatus("loading");
      const stored = await loadPlanFile(DEFAULT_PLAN_FILE_ID);
      if (cancelled) return;
      if (!stored) {
        setFile(null);
        setUrl(null);
        setStatus("empty");
        onLoaded?.(null);
        return;
      }
      const objectUrl = planObjectUrl(stored);
      revoked = objectUrl;
      setFile(stored);
      setUrl(objectUrl);
      setStatus("ready");
      onLoaded?.(stored);
    })().catch(() => {
      if (!cancelled) {
        setStatus("error");
        onLoaded?.(null);
      }
    });

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [reloadKey, onLoaded]);

  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] sm:aspect-[16/10] items-center justify-center gap-2 bg-bg-subtle text-[12px] text-fg-muted",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        Loading plan sheet…
      </div>
    );
  }

  if (status === "empty" || !file || !url) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] sm:aspect-[16/10] flex-col items-center justify-center gap-2 bg-bg-subtle px-6 text-center",
          className,
        )}
      >
        <FileText className="h-8 w-8 text-fg-subtle" strokeWidth={1.5} />
        <p className="text-[13px] font-medium text-fg">No plan sheet yet</p>
        <p className="max-w-sm text-[12px] text-fg-muted">
          Upload a PDF or floor-plan image on the Plans tab. Finish selection and the WebGL room still
          work — the sheet is for reference during the meeting.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] sm:aspect-[16/10] items-center justify-center bg-bg-subtle text-[12px] text-fg-muted",
          className,
        )}
      >
        Could not open plan file. Re-upload from the Plans tab.
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col bg-[#1a1c1e]", className)}>
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-1.5 text-[11px] text-white/70">
        {file.kind === "pdf" ? (
          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        <span className="truncate font-medium text-white/90">{file.name}</span>
        <span className="ml-auto shrink-0">
          {(file.size / 1024).toFixed(0)} KB · {file.kind.toUpperCase()}
        </span>
      </div>
      {file.kind === "pdf" ? (
        <iframe
          title={file.name}
          src={url}
          className="min-h-[14rem] w-full flex-1 bg-white aspect-[4/3] sm:min-h-[20rem] sm:aspect-[16/10]"
        />
      ) : file.kind === "image" ? (
        <div className="flex aspect-[4/3] sm:aspect-[16/10] items-center justify-center overflow-auto bg-[#111]">
          <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div className="flex aspect-[4/3] sm:aspect-[16/10] flex-col items-center justify-center gap-2 px-4 text-center text-[12px] text-white/70">
          <p>This file type is stored but not previewable in-browser.</p>
          <a href={url} download={file.name} className="underline text-white">
            Download {file.name}
          </a>
        </div>
      )}
      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-white/60">
        Plan sheet · PDF/image path — no BIM required
      </p>
    </div>
  );
}
