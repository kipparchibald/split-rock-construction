import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { filesToDataUrls, MAX_SITE_PHOTOS } from "@/lib/site-photos";
import { toast } from "sonner";

type PhotoDropzoneProps = {
  photos: string[];
  onChange: (photos: string[]) => void;
  className?: string;
  compact?: boolean;
};

export function PhotoDropzone({ photos, onChange, className, compact }: PhotoDropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  async function addFiles(fileList: FileList | File[]) {
    setBusy(true);
    try {
      const { urls, errors } = await filesToDataUrls(fileList, photos.length);
      for (const e of errors) toast.error(e);
      if (urls.length) {
        onChange([...photos, ...urls].slice(0, MAX_SITE_PHOTOS));
        toast.success(urls.length === 1 ? "Photo added" : `${urls.length} photos added`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onClick={() => fileRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed px-3 text-center transition-colors",
          compact ? "min-h-20 py-3" : "min-h-[7.5rem] py-4",
          dragOver
            ? "border-primary bg-primary/10 text-fg"
            : "border-border bg-bg text-fg-muted hover:border-border-strong hover:bg-bg-subtle",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <ImagePlus className={cn("text-fg-subtle", compact ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.5} />
        <p className="text-sm font-medium text-fg">
          {dragOver ? "Drop photos here" : "Drag & drop site photos"}
        </p>
        <p className="text-xs text-fg-subtle">
          or tap to browse · camera ok · up to {MAX_SITE_PHOTOS}
        </p>
      </div>

      {photos.length > 0 ? (
        <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((src, i) => (
            <li key={i} className="relative aspect-[4/3] border border-border bg-bg">
              <img src={src} alt={`Site photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(photos.filter((_, idx) => idx !== i));
                }}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-bg-inverse/80 text-fg-inverse hover:bg-bg-inverse"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
