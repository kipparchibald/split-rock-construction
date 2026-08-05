import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Cloud, CloudRain, Snowflake, Sun, Wind } from "lucide-react";
import { PhotoDropzone } from "@/components/field/photo-dropzone";
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

const WEATHER: { value: DailyLogWeather; label: string; icon: typeof Sun }[] = [
  { value: "clear", label: "Clear", icon: Sun },
  { value: "overcast", label: "Overcast", icon: Cloud },
  { value: "rain", label: "Rain", icon: CloudRain },
  { value: "snow", label: "Snow", icon: Snowflake },
  { value: "wind", label: "Wind", icon: Wind },
];

function DailyLogsPage() {
  const { dailyLogs, projects, addDailyLog } = useAppStore();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [workDone, setWorkDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [crewCount, setCrewCount] = useState("4");
  const [hours, setHours] = useState("32");
  const [weather, setWeather] = useState<DailyLogWeather>("clear");
  const [photos, setPhotos] = useState<string[]>([]);

  function postLog() {
    if (!projectId || !workDone.trim()) return;
    const crew = Math.min(500, Math.max(0, Math.floor(Number(crewCount) || 0)));
    const hrs = Math.min(24 * 31, Math.max(0, Number(hours) || 0));
    addDailyLog({
      projectId,
      date: new Date().toISOString().slice(0, 10),
      weather,
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
        description="Site notes, weather, and photos for the job record and owner portal. Drag photos onto the drop zone or tap to browse."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/field">Field board</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="space-y-3 border border-border bg-bg-elevated p-4">
          <p className="text-sm font-medium">Post log</p>
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
          <div>
            <Label>Weather</Label>
            <div className="mt-1 grid grid-cols-5 gap-1">
              {WEATHER.map((w) => {
                const Icon = w.icon;
                const on = weather === w.value;
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setWeather(w.value)}
                    className={cn(
                      "flex min-h-11 flex-col items-center justify-center gap-0.5 border px-1 py-1.5 text-center transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-bg text-fg-muted hover:bg-bg-subtle hover:text-fg",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span className="text-[10px] font-medium leading-none">{w.label}</span>
                  </button>
                );
              })}
            </div>
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
            <PhotoDropzone className="mt-1" photos={photos} onChange={setPhotos} />
          </div>
          <Button type="button" className="w-full min-h-11" onClick={postLog}>
            Post log
          </Button>
        </form>
        <div className="space-y-2">
          {dailyLogs.map((l) => {
            const p = projects.find((x) => x.id === l.projectId);
            const w = WEATHER.find((x) => x.value === l.weather);
            const WIcon = w?.icon ?? Sun;
            return (
              <div key={l.id} className="border border-border bg-bg-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: l.projectId }}
                    className="text-sm font-medium hover:underline"
                  >
                    {p?.name}
                  </Link>
                  <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-fg-subtle">
                    <WIcon className="h-3 w-3" strokeWidth={1.75} />
                    {w?.label ?? l.weather} · {formatDate(l.date)} · {l.crewCount} crew · {l.hours}h
                  </span>
                </div>
                <p className="mt-2 text-sm text-fg-muted">{l.workDone}</p>
                {l.blockers ? (
                  <p className="mt-1 text-xs text-warning">Blocker: {l.blockers}</p>
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
                <p className="mt-2 text-xs text-fg-subtle">{l.author}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
