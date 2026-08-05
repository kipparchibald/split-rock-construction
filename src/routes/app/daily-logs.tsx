import { useCallback, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import type { DailyLogWeather } from "@/data/types";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/daily-logs")({ component: DailyLogsPage });

const MAX_PHOTOS = 8;
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB per image (data-URL storage)

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Not an image"));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error(`Too large (max ${MAX_BYTES / 1024 / 1024} MB)`));
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

function DailyLogsPage() {
  const { dailyLogs, projects, addDailyLog } = useAppStore();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [workDone, setWorkDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [crewCount, setCrewCount] = useState("4");
  const [hours, setHours] = useState("32");
  const [photos, setPhotos] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      toast.error("Drop image files only (JPG, PNG, HEIC, WebP)");
      return;
    }
    setBusy(true);
    try {
      const next: string[] = [];
      for (const file of files) {
        if (photos.length + next.length >= MAX_PHOTOS) {
          toast.message(`Max ${MAX_PHOTOS} photos per log`);
          break;
        }
        try {
          next.push(await readImageAsDataUrl(file));
        } catch (err) {
          toast.error(
            err instanceof Error ? `${file.name}: ${err.message}` : `Could not read ${file.name}`,
          );
        }
      }
      if (next.length) {
        setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
        toast.success(
          next.length === 1 ? "Photo added" : `${next.length} photos added`,
        );
      }
    } finally {
      setBusy(false);
    }
  }, [photos.length]);

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function postLog() {
    if (!projectId || !workDone.trim()) return;
    const crew = Math.min(500, Math.max(0, Math.floor(Number(crewCount) || 0)));
    const hrs = Math.min(24 * 31, Math.max(0, Number(hours) || 0));
    addDailyLog({
      projectId,
      date: new Date().toISOString().slice(0, 10),
      weather: "clear" as DailyLogWeather,
      crewCount: crew,
      hours: hrs,
      workDone: workDone.trim().slice(0, 2000),
      blockers: blockers.trim().slice(0, 1000) || undefined,
      author: "Field",
      photos: photos.length ? photos : undefined,
    });
    setWorkDone("");
    setBlockers("");
    setPhotos([]);
    toast.success("Daily log posted");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    postLog();
  }

  return (
    <div>
      <PageHeader
        title="Daily logs"
        description="What happened on site today — work notes plus site photos for the owner portal. Drag photos onto the drop zone or tap to browse."
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="space-y-3 border border-border bg-bg-elevated p-4">
          <p className="text-[13px] font-medium">Post log</p>
          <div>
            <Label>Job</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Crew</Label>
              <Input
                className="mt-1"
                value={crewCount}
                onChange={(e) => setCrewCount(e.target.value)}
              />
            </div>
            <div>
              <Label>Hours</Label>
              <Input className="mt-1" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="work-done">Work completed</Label>
            <Textarea
              id="work-done"
              className="mt-1"
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="blockers">Blockers (optional)</Label>
            <Textarea
              id="blockers"
              className="mt-1"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </div>

          <div>
            <Label>Site photos</Label>
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
                "mt-1 flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed px-3 py-4 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/10 text-fg"
                  : "border-border bg-bg text-fg-muted hover:border-primary/50 hover:bg-bg-subtle",
                busy && "opacity-60 pointer-events-none",
              )}
            >
              <ImagePlus className="h-6 w-6 text-fg-subtle" strokeWidth={1.5} />
              <p className="text-[13px] font-medium text-fg">
                {dragOver ? "Drop photos here" : "Drag & drop site photos"}
              </p>
              <p className="text-[11px] text-fg-subtle">
                or click to browse · phone camera works · up to {MAX_PHOTOS} images
              </p>
            </div>

            {photos.length > 0 ? (
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {photos.map((src, i) => (
                  <li key={i} className="relative aspect-[4/3] border border-border bg-bg">
                    <img
                      src={src}
                      alt={`Site photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(i);
                      }}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/70 text-white hover:bg-black"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Button type="button" className="w-full" onClick={postLog} disabled={busy}>
            Post log
          </Button>
        </form>

        <div className="space-y-2">
          {dailyLogs.map((l) => {
            const p = projects.find((x) => x.id === l.projectId);
            return (
              <div key={l.id} className="border border-border bg-bg-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: l.projectId }}
                    className="text-[13px] font-medium hover:underline"
                  >
                    {p?.name}
                  </Link>
                  <span className="text-[11px] tabular-nums text-fg-subtle">
                    {formatDate(l.date)} · {l.crewCount} crew · {l.hours}h
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-fg-muted">{l.workDone}</p>
                {l.blockers ? (
                  <p className="mt-1 text-[12px] text-warning">Blocker: {l.blockers}</p>
                ) : null}
                {l.photos?.length ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {l.photos.map((src, i) => (
                      <img
                        key={`${l.id}-${i}`}
                        src={src}
                        alt="Site photo"
                        className="h-24 w-32 shrink-0 border border-border object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-[11px] text-fg-subtle">
                  {l.author} · {l.weather}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
