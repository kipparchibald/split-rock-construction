import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Cloud,
  CloudRain,
  HardHat,
  NotebookPen,
  Shield,
  Snowflake,
  Sun,
  Wind,
} from "lucide-react";
import { PhotoDropzone } from "@/components/field/photo-dropzone";
import { VoiceLogCapture } from "@/components/field/voice-log-capture";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/data/store";
import type { DailyLogWeather, Project } from "@/data/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/field")({ component: FieldBoardPage });

const WEATHER: { value: DailyLogWeather; label: string; icon: typeof Sun }[] = [
  { value: "clear", label: "Clear", icon: Sun },
  { value: "overcast", label: "Overcast", icon: Cloud },
  { value: "rain", label: "Rain", icon: CloudRain },
  { value: "snow", label: "Snow", icon: Snowflake },
  { value: "wind", label: "Wind", icon: Wind },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function FieldBoardPage() {
  const projects = useAppStore((s) => s.projects);
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  const changeOrders = useAppStore((s) => s.changeOrders);
  const safety = useAppStore((s) => s.safety);
  const addDailyLog = useAppStore((s) => s.addDailyLog);

  const active = useMemo(
    () => projects.filter((p) => !["complete", "on_hold"].includes(p.status)),
    [projects],
  );

  const today = todayISO();

  const logsTodayByJob = useMemo(() => {
    const map = new Map<string, (typeof dailyLogs)[0]>();
    for (const l of dailyLogs) {
      if (l.date === today && !map.has(l.projectId)) map.set(l.projectId, l);
    }
    return map;
  }, [dailyLogs, today]);

  const blockers = useMemo(() => {
    return dailyLogs
      .filter((l) => l.blockers && l.blockers.trim())
      .slice(0, 12)
      .map((l) => ({
        id: l.id,
        projectId: l.projectId,
        date: l.date,
        text: l.blockers!,
        job: projects.find((p) => p.id === l.projectId)?.name ?? "Job",
      }));
  }, [dailyLogs, projects]);

  const openSafety = safety.filter((s) => s.status !== "closed");
  const pendingCO = changeOrders.filter((c) => c.status === "pending_owner");
  const missingLogJobs = active.filter((p) => !logsTodayByJob.has(p.id));

  const [jobId, setJobId] = useState(active[0]?.id ?? "");
  const [workDone, setWorkDone] = useState("");
  const [blockerNote, setBlockerNote] = useState("");
  const [crewCount, setCrewCount] = useState("4");
  const [hours, setHours] = useState("8");
  const [weather, setWeather] = useState<DailyLogWeather>("clear");
  const [photos, setPhotos] = useState<string[]>([]);

  function quickPost() {
    if (!jobId || !workDone.trim()) {
      toast.error("Pick a job and write what got done");
      return;
    }
    addDailyLog({
      projectId: jobId,
      date: today,
      weather,
      crewCount: Math.min(500, Math.max(0, Math.floor(Number(crewCount) || 0))),
      hours: Math.min(24, Math.max(0, Number(hours) || 0)),
      workDone: workDone.trim().slice(0, 2000),
      blockers: blockerNote.trim().slice(0, 1000) || undefined,
      author: "Field",
      photos: photos.length ? photos : undefined,
    });
    setWorkDone("");
    setBlockerNote("");
    setPhotos([]);
    toast.success("Field update posted");
  }

  return (
    <div>
      <PageHeader
        title="Field board"
        description="GC & foreman — log today, clear blockers, and chase owner decisions without hunting menus."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/portal">Client portal</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/daily-logs">All logs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/app/schedule">Schedule</Link>
            </Button>
          </>
        }
      />

      {pendingCO.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2 border border-warning/35 bg-warning/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-fg">
              {pendingCO.length} owner decision{pendingCO.length > 1 ? "s" : ""} open
            </p>
            <p className="mt-0.5 text-[12px] text-fg-muted">
              Change orders waiting in the client portal — confirm owners see them.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link to="/app/portal" search={{ project: pendingCO[0]!.projectId }}>
              Open portal
              <ArrowRight className="ml-1 h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Pulse label="Active jobs" value={String(active.length)} tone="default" />
        <Pulse
          label="No log today"
          value={String(missingLogJobs.length)}
          tone={missingLogJobs.length ? "warn" : "ok"}
        />
        <Pulse
          label="Open blockers"
          value={String(blockers.length)}
          tone={blockers.length ? "warn" : "ok"}
        />
        <Pulse
          label="Safety open"
          value={String(openSafety.length)}
          tone={openSafety.length ? "danger" : "ok"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="border border-border bg-bg-elevated p-4">
          <div className="mb-3 flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-fg-subtle" strokeWidth={1.75} />
            <h2 className="text-sm font-medium">Log today</h2>
            <Badge variant="outline" className="ml-auto text-[10px]">
              {formatDate(today)}
            </Badge>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Job</Label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {active.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {logsTodayByJob.has(p.id) ? " · logged" : ""}
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
                  className="mt-1"
                  inputMode="numeric"
                  value={crewCount}
                  onChange={(e) => setCrewCount(e.target.value)}
                />
              </div>
              <div>
                <Label>Hours</Label>
                <Input
                  className="mt-1"
                  inputMode="decimal"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            </div>

            <VoiceLogCapture
              form={{
                workDone,
                blockers: blockerNote,
                crewCount,
                hours,
                weather,
              }}
              onFormChange={(next) => {
                setWorkDone(next.workDone);
                setBlockerNote(next.blockers);
                setCrewCount(next.crewCount);
                setHours(next.hours);
                setWeather(next.weather);
              }}
            />

            <div>
              <Label>What got done</Label>
              <Textarea
                className="mt-1 min-h-20"
                placeholder="Framing north wall, MEP rough in garage…"
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
              />
            </div>

            <div>
              <Label>Blocker (optional)</Label>
              <Textarea
                className="mt-1 min-h-14"
                placeholder="Waiting on window delivery / inspection…"
                value={blockerNote}
                onChange={(e) => setBlockerNote(e.target.value)}
              />
            </div>

            <div>
              <Label>Site photos</Label>
              <PhotoDropzone className="mt-1" photos={photos} onChange={setPhotos} compact />
            </div>

            <Button type="button" className="w-full min-h-11" onClick={quickPost}>
              Post update
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="border border-border bg-bg-elevated">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-medium">Keep moving</h2>
              <span className="text-xs text-fg-subtle">Priorities</span>
            </div>
            <ul className="divide-y divide-border">
              {missingLogJobs.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full min-h-11 items-center gap-3 px-4 py-3 text-left hover:bg-bg-subtle"
                    onClick={() => setJobId(p.id)}
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">No daily log yet</p>
                      <p className="text-xs text-fg-muted">
                        {p.name} · {p.phase}
                      </p>
                    </div>
                    <span className="text-xs text-fg">Update</span>
                  </button>
                </li>
              ))}
              {pendingCO.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: c.projectId }}
                    className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-bg-subtle"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Owner decision · {c.number}</p>
                      <p className="text-xs text-fg-muted">{c.title}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
              {openSafety.slice(0, 3).map((s) => (
                <li key={s.id}>
                  <Link
                    to="/app/safety"
                    className="flex min-h-11 items-center gap-3 px-4 py-3 hover:bg-bg-subtle"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Safety · {s.title}</p>
                      <p className="text-xs text-fg-muted">{formatDate(s.date)}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                  </Link>
                </li>
              ))}
              {missingLogJobs.length === 0 && pendingCO.length === 0 && openSafety.length === 0 ? (
                <li className="flex items-center gap-2 px-4 py-6 text-sm text-fg-muted">
                  <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} />
                  Field is current — no urgent gaps.
                </li>
              ) : null}
            </ul>
          </div>

          {blockers.length > 0 ? (
            <div className="border border-border bg-bg-elevated">
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-warning" strokeWidth={1.75} />
                <h2 className="text-sm font-medium">Open blockers</h2>
              </div>
              <ul className="divide-y divide-border">
                {blockers.slice(0, 6).map((b) => (
                  <li key={b.id} className="px-4 py-3">
                    <p className="text-xs font-medium text-fg">{b.job}</p>
                    <p className="mt-0.5 text-xs text-warning">{b.text}</p>
                    <p className="mt-1 text-xs text-fg-subtle">{formatDate(b.date)}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <QuickLink to="/app/schedule" icon={CalendarRange} label="Schedule" />
            <QuickLink to="/app/crews" icon={HardHat} label="Crews" />
            <QuickLink to="/app/safety" icon={Shield} label="Safety" />
            <QuickLink to="/app/daily-logs" icon={ClipboardList} label="All logs" />
          </div>
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Jobs in motion</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/app/projects">All jobs</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((p) => (
            <JobCard
              key={p.id}
              project={p}
              todayLog={logsTodayByJob.get(p.id)}
              onLog={() => setJobId(p.id)}
            />
          ))}
          {active.length === 0 ? (
            <p className="text-sm text-fg-muted">No active jobs yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Pulse({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "ok" | "warn" | "danger";
}) {
  return (
    <div className="border border-border bg-bg-elevated px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.06em] text-fg-subtle">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-medium tabular-nums",
          tone === "ok" && "text-success",
          tone === "warn" && "text-warning",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-14 flex-col items-center justify-center gap-1.5 border border-border bg-bg-elevated px-2 py-3 text-center transition-colors hover:bg-bg-subtle"
    >
      <Icon className="h-4 w-4 text-fg-muted" strokeWidth={1.75} />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function JobCard({
  project,
  todayLog,
  onLog,
}: {
  project: Project;
  todayLog?: {
    workDone: string;
    blockers?: string;
    crewCount: number;
    hours: number;
    weather: DailyLogWeather;
    photos?: string[];
  };
  onLog: () => void;
}) {
  const w = WEATHER.find((x) => x.value === todayLog?.weather);
  const WIcon = w?.icon ?? Sun;

  return (
    <div className="border border-border bg-bg-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to="/app/projects/$projectId"
            params={{ projectId: project.id }}
            className="text-sm font-medium hover:underline"
          >
            {project.name}
          </Link>
          <p className="mt-0.5 text-xs text-fg-muted">
            {project.phase} · {project.superintendent || "—"}
          </p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>
      <Progress value={project.progress} className="mt-3" />
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-fg-subtle">
        <span>{project.progress}%</span>
        <span>
          {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
        </span>
      </div>
      {todayLog ? (
        <div className="mt-3 border border-border bg-bg px-2.5 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.06em] text-success">Logged today</p>
            <span className="inline-flex items-center gap-1 text-xs text-fg-subtle">
              <WIcon className="h-3 w-3" strokeWidth={1.75} />
              {w?.label ?? todayLog.weather}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{todayLog.workDone}</p>
          {todayLog.blockers ? (
            <p className="mt-1 text-xs text-warning">Blocker: {todayLog.blockers}</p>
          ) : null}
          <p className="mt-1 text-xs text-fg-subtle">
            {todayLog.crewCount} crew · {todayLog.hours}h
            {todayLog.photos?.length ? ` · ${todayLog.photos.length} photo${todayLog.photos.length > 1 ? "s" : ""}` : ""}
          </p>
          {todayLog.photos?.length ? (
            <div className="mt-2 flex gap-1.5 overflow-x-auto">
              {todayLog.photos.slice(0, 4).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-12 w-16 shrink-0 border border-border object-cover"
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" className="mt-3 w-full min-h-10" onClick={onLog}>
          Log today
        </Button>
      )}
    </div>
  );
}
