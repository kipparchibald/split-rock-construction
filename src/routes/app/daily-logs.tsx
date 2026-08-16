import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cloud,
  CloudRain,
  Filter,
  NotebookPen,
  Snowflake,
  Sun,
  Wind,
} from "lucide-react";
import { PhotoDropzone } from "@/components/field/photo-dropzone";
import { VoiceLogCapture } from "@/components/field/voice-log-capture";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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

const DRAFT_KEY = "src-daily-log-draft-v1";

type Draft = {
  projectId: string;
  workDone: string;
  blockers: string;
  crewCount: string;
  hours: string;
  weather: DailyLogWeather;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DailyLogsPage() {
  const { dailyLogs, projects, addDailyLog } = useAppStore();
  const activeJobs = useMemo(
    () => projects.filter((p) => !["complete", "on_hold"].includes(p.status)),
    [projects],
  );

  const [projectId, setProjectId] = useState(activeJobs[0]?.id ?? projects[0]?.id ?? "");
  const [workDone, setWorkDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [crewCount, setCrewCount] = useState("4");
  const [hours, setHours] = useState("8");
  const [weather, setWeather] = useState<DailyLogWeather>("clear");
  const [photos, setPhotos] = useState<string[]>([]);
  const [feedJob, setFeedJob] = useState<string>("all");
  const [composerOpen, setComposerOpen] = useState(true);

  // Restore draft once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      if (d.projectId) setProjectId(d.projectId);
      if (d.workDone) setWorkDone(d.workDone);
      if (d.blockers) setBlockers(d.blockers);
      if (d.crewCount) setCrewCount(d.crewCount);
      if (d.hours) setHours(d.hours);
      if (d.weather) setWeather(d.weather);
    } catch {
      /* ignore */
    }
  }, []);

  // Autosave draft (text only — photos stay in memory for session)
  useEffect(() => {
    const draft: Draft = { projectId, workDone, blockers, crewCount, hours, weather };
    try {
      if (!workDone && !blockers) {
        sessionStorage.removeItem(DRAFT_KEY);
      } else {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    } catch {
      /* ignore */
    }
  }, [projectId, workDone, blockers, crewCount, hours, weather]);

  const today = todayISO();
  const loggedToday = useMemo(() => {
    const set = new Set<string>();
    for (const l of dailyLogs) {
      if (l.date === today) set.add(l.projectId);
    }
    return set;
  }, [dailyLogs, today]);

  const missingJobs = activeJobs.filter((p) => !loggedToday.has(p.id));

  const feed = useMemo(() => {
    const list =
      feedJob === "all" ? dailyLogs : dailyLogs.filter((l) => l.projectId === feedJob);
    return list;
  }, [dailyLogs, feedJob]);

  function postLog() {
    if (!projectId || !workDone.trim()) {
      toast.error("Pick a job and write what got done");
      return;
    }
    const crew = Math.min(500, Math.max(0, Math.floor(Number(crewCount) || 0)));
    const hrs = Math.min(24 * 31, Math.max(0, Number(hours) || 0));
    addDailyLog({
      projectId,
      date: today,
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
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    toast.success("Daily log posted", {
      description: "Visible on job hub, field board, and owner portal.",
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    postLog();
  }

  return (
    <div className="max-w-full overflow-x-clip">
      <PageHeader
        title="Daily logs"
        description="One-hand field notes — weather, crew, photos. Drafts auto-save if you leave mid-entry."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/field">Field board</Link>
            </Button>
            <Button
              size="sm"
              className="lg:hidden"
              variant={composerOpen ? "secondary" : "default"}
              onClick={() => setComposerOpen((o) => !o)}
            >
              {composerOpen ? "Hide form" : "New log"}
            </Button>
          </>
        }
      />

      {/* Coverage strip */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="border border-border bg-bg-elevated p-3">
          <p className="label-caps">Logged today</p>
          <p className="mt-1 text-[18px] font-medium tabular-nums">
            {loggedToday.size}
            <span className="text-[12px] font-normal text-fg-subtle"> / {activeJobs.length}</span>
          </p>
        </div>
        <div
          className={cn(
            "border border-border bg-bg-elevated p-3",
            missingJobs.length ? "border-warning/40 bg-warning/5" : "",
          )}
        >
          <p className="label-caps">Still need a log</p>
          <p className="mt-1 text-[18px] font-medium tabular-nums">{missingJobs.length}</p>
        </div>
        <div className="col-span-2 border border-border bg-bg-elevated p-3 sm:col-span-1">
          <p className="label-caps">Total entries</p>
          <p className="mt-1 text-[18px] font-medium tabular-nums">{dailyLogs.length}</p>
        </div>
      </div>

      {missingJobs.length > 0 ? (
        <div className="mb-4 border border-border bg-bg-elevated p-3">
          <div className="mb-2 flex items-center gap-2">
            <NotebookPen className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
            <p className="text-[12px] font-medium">Tap a job to log</p>
          </div>
          <div className="flex max-w-full flex-wrap gap-1.5">
            {missingJobs.map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  "max-w-full min-h-10 truncate border px-3 text-[12px] font-medium transition-colors",
                  projectId === p.id
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-bg text-fg-muted hover:bg-bg-subtle hover:text-fg",
                )}
                onClick={() => {
                  setProjectId(p.id);
                  setComposerOpen(true);
                  document.getElementById("log-composer")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          id="log-composer"
          onSubmit={submit}
          className={cn(
            "space-y-3 border border-border bg-bg-elevated p-4",
            !composerOpen && "hidden lg:block",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Post log</p>
            <Badge variant="outline">{formatDate(today)}</Badge>
          </div>

          <div>
            <Label>Job</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1 min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {loggedToday.has(p.id) ? " · logged today" : ""}
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
              <Label>Crew on site</Label>
              <Input
                className="mt-1 min-h-11"
                inputMode="numeric"
                value={crewCount}
                onChange={(e) => setCrewCount(e.target.value)}
              />
            </div>
            <div>
              <Label>Hours</Label>
              <Input
                className="mt-1 min-h-11"
                inputMode="decimal"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <VoiceLogCapture
            form={{ workDone, blockers, crewCount, hours, weather }}
            onFormChange={(next) => {
              setWorkDone(next.workDone);
              setBlockers(next.blockers);
              setCrewCount(next.crewCount);
              setHours(next.hours);
              setWeather(next.weather);
            }}
          />

          <div>
            <Label htmlFor="work-done">What got done</Label>
            <Textarea
              id="work-done"
              className="mt-1 min-h-24"
              placeholder="Framing north wall, MEP rough, window flashing…"
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="blockers">Blockers (optional)</Label>
            <Textarea
              id="blockers"
              className="mt-1 min-h-14"
              placeholder="Waiting on delivery / inspection / RFI…"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </div>

          <div>
            <Label>Site photos</Label>
            <PhotoDropzone className="mt-1" photos={photos} onChange={setPhotos} />
          </div>

          {(workDone || blockers) && (
            <p className="text-[11px] text-fg-subtle">Draft saved on this device until you post.</p>
          )}

          <Button type="submit" className="w-full min-h-12 text-[14px]" onClick={postLog}>
            Post log
          </Button>
        </form>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
            <p className="text-[12px] font-medium text-fg-muted">Feed</p>
            <div className="flex max-w-full gap-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                className={cn(
                  "min-h-9 shrink-0 border px-2.5 text-[11px] font-medium",
                  feedJob === "all"
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-bg-elevated text-fg-muted",
                )}
                onClick={() => setFeedJob("all")}
              >
                All
              </button>
              {projects.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    "min-h-9 shrink-0 border px-2.5 text-[11px] font-medium",
                    feedJob === p.id
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border bg-bg-elevated text-fg-muted",
                  )}
                  onClick={() => setFeedJob(p.id)}
                >
                  {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {feed.length === 0 ? (
              <p className="border border-border bg-bg-elevated px-4 py-10 text-center text-[13px] text-fg-muted">
                No logs yet{feedJob !== "all" ? " for this job" : ""}. Post the first update.
              </p>
            ) : (
              feed.map((l) => {
                const p = projects.find((x) => x.id === l.projectId);
                const w = WEATHER.find((x) => x.value === l.weather);
                const WIcon = w?.icon ?? Sun;
                return (
                  <article
                    key={l.id}
                    className="border border-border bg-bg-elevated p-4"
                    data-testid="daily-log-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        to="/app/projects/$projectId"
                        params={{ projectId: l.projectId }}
                        search={{ tab: "logs" }}
                        className="text-[14px] font-medium hover:underline"
                      >
                        {p?.name}
                      </Link>
                      <span className="inline-flex items-center gap-1.5 text-[11px] tabular-nums text-fg-subtle">
                        <WIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {w?.label ?? l.weather} · {formatDate(l.date)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-fg-subtle">
                      {l.crewCount} crew · {l.hours}h · {l.author}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{l.workDone}</p>
                    {l.blockers ? (
                      <p className="mt-2 border border-warning/30 bg-warning/5 px-2 py-1.5 text-[12px] text-warning">
                        Blocker: {l.blockers}
                      </p>
                    ) : null}
                    {l.photos?.length ? (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {l.photos.map((src, i) => (
                          <img
                            key={`${l.id}-${i}`}
                            src={src}
                            alt="Site photo"
                            className="h-28 w-36 shrink-0 border border-border object-cover"
                          />
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
