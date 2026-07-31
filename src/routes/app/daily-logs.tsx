import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import { formatDate } from "@/lib/utils";
import type { DailyLogWeather } from "@/data/types";
import { toast } from "sonner";

export const Route = createFileRoute("/app/daily-logs")({ component: DailyLogsPage });

const PHOTO_OPTIONS = [
  { value: "none", label: "No photo" },
  { value: "/site-photos/framing.svg", label: "Framing" },
  { value: "/site-photos/foundation.svg", label: "Foundation" },
  { value: "/site-photos/mep.svg", label: "MEP" },
  { value: "/site-photos/site.svg", label: "Site work" },
  { value: "/site-photos/finish.svg", label: "Finishes" },
];

function DailyLogsPage() {
  const { dailyLogs, projects, addDailyLog } = useAppStore();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [workDone, setWorkDone] = useState("");
  const [blockers, setBlockers] = useState("");
  const [crewCount, setCrewCount] = useState("4");
  const [hours, setHours] = useState("32");
  const [photo, setPhoto] = useState("none");

  function postLog() {
    if (!projectId || !workDone.trim()) return;
    const crew = Math.min(500, Math.max(0, Math.floor(Number(crewCount) || 0)));
    const hrs = Math.min(24 * 31, Math.max(0, Number(hours) || 0));
    // Only allow known static site-photo paths (no open path injection into img src)
    const safePhoto =
      photo !== "none" && PHOTO_OPTIONS.some((o) => o.value === photo && o.value.startsWith("/site-photos/"))
        ? photo
        : undefined;
    addDailyLog({
      projectId,
      date: new Date().toISOString().slice(0, 10),
      weather: "clear" as DailyLogWeather,
      crewCount: crew,
      hours: hrs,
      workDone: workDone.trim().slice(0, 2000),
      blockers: blockers.trim().slice(0, 1000) || undefined,
      author: "Field",
      photos: safePhoto ? [safePhoto] : undefined,
    });
    setWorkDone("");
    setBlockers("");
    setPhoto("none");
    toast.success("Daily log posted");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    postLog();
  }

  return (
    <div>
      <PageHeader title="Daily logs" description="What happened on site today — work notes plus site photos for the owner portal." />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="space-y-3 border border-border bg-bg-elevated p-4">
          <p className="text-[13px] font-medium">Post log</p>
          <div>
            <Label>Job</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Crew</Label><Input className="mt-1" value={crewCount} onChange={(e) => setCrewCount(e.target.value)} /></div>
            <div><Label>Hours</Label><Input className="mt-1" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          </div>
          <div>
            <Label htmlFor="work-done">Work completed</Label>
            <Textarea id="work-done" className="mt-1" value={workDone} onChange={(e) => setWorkDone(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="blockers">Blockers (optional)</Label>
            <Textarea id="blockers" className="mt-1" value={blockers} onChange={(e) => setBlockers(e.target.value)} />
          </div>
          <div>
            <Label>Site photo</Label>
            <Select value={photo} onValueChange={setPhoto}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHOTO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {photo !== "none" ? (
            <img src={photo} alt="" className="h-24 w-full border border-border object-cover" />
          ) : null}
          <Button type="button" className="w-full" onClick={postLog}>Post log</Button>
        </form>
        <div className="space-y-2">
          {dailyLogs.map((l) => {
            const p = projects.find((x) => x.id === l.projectId);
            return (
              <div key={l.id} className="border border-border bg-bg-elevated p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/app/projects/$projectId" params={{ projectId: l.projectId }} className="text-[13px] font-medium hover:underline">{p?.name}</Link>
                  <span className="text-[11px] tabular-nums text-fg-subtle">{formatDate(l.date)} · {l.crewCount} crew · {l.hours}h</span>
                </div>
                <p className="mt-2 text-[13px] text-fg-muted">{l.workDone}</p>
                {l.blockers ? <p className="mt-1 text-[12px] text-warning">Blocker: {l.blockers}</p> : null}
                {l.photos?.length ? (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {l.photos.map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt="Site photo"
                        className="h-24 w-32 shrink-0 border border-border object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-[11px] text-fg-subtle">{l.author} · {l.weather}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
