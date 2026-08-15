import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/data/store";
import type { Phase } from "@/data/types";
import { cn, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/schedule")({ component: SchedulePage });

type Scope = "all" | "residential" | "commercial";

const MS_DAY = 86_400_000;

function parseDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function monthTicks(rangeStart: Date, rangeEnd: Date) {
  const ticks: { label: string; offset: number }[] = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  if (cursor < rangeStart) cursor.setMonth(cursor.getMonth() + 1);
  while (cursor <= rangeEnd) {
    ticks.push({
      label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      offset: daysBetween(rangeStart, cursor),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return ticks;
}

function phaseTone(pct: number, end: Date, today: Date): "done" | "active" | "late" | "future" {
  if (pct >= 100) return "done";
  if (end < today && pct < 100) return "late";
  if (pct > 0) return "active";
  return "future";
}

const toneClass: Record<ReturnType<typeof phaseTone>, string> = {
  done: "bg-success/80 text-fg-inverse",
  active: "bg-primary text-primary-fg",
  late: "bg-danger text-fg-inverse",
  future: "bg-bg-subtle text-fg-muted border border-border",
};

function SchedulePage() {
  const projects = useAppStore((s) => s.projects);
  const members = useAppStore((s) => s.members);
  const crews = useAppStore((s) => s.crews);
  const [scope, setScope] = useState<Scope>("all");
  const [mode, setMode] = useState<"gantt" | "list">("gantt");

  // Prefer list on phone — Gantt needs horizontal scroll
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setMode(mq.matches ? "gantt" : "list");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    return t;
  }, []);

  const active = useMemo(() => {
    return projects
      .filter((p) => !["complete", "on_hold"].includes(p.status))
      .filter((p) => (scope === "all" ? true : p.type === scope));
  }, [projects, scope]);

  const { rangeStart, totalDays, ticks, lateCount } = useMemo(() => {
    let min = today;
    let max = addDays(today, 90);
    let late = 0;
    for (const p of active) {
      for (const s of p.schedule) {
        const start = parseDay(s.start);
        const end = parseDay(s.end);
        if (start && start < min) min = start;
        if (end && end > max) max = end;
        if (end && end < today && s.pct < 100) late += 1;
      }
    }
    // pad a bit for readability
    min = addDays(min, -7);
    max = addDays(max, 14);
    const total = Math.max(daysBetween(min, max), 30);
    return {
      rangeStart: min,
      totalDays: total,
      ticks: monthTicks(min, max),
      lateCount: late,
    };
  }, [active, today]);

  const crewOnJob = (projectId: string) => members.filter((m) => m.projectId === projectId);
  const crewsOnJob = (projectId: string) => crews.filter((c) => c.projectId === projectId);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Multi-job phase timeline — Gantt view across residential and commercial work. Late phases flag red."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Active jobs" value={String(active.length)} hint="On the board" />
        <StatCard label="Late phases" value={String(lateCount)} hint="Past end date, not complete" />
        <StatCard
          label="People staged"
          value={String(members.filter((m) => m.projectId && active.some((p) => p.id === m.projectId)).length)}
          hint="Assigned to visible jobs"
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={scope}
          onChange={setScope}
          options={[
            { value: "all", label: "All", count: projects.filter((p) => !["complete", "on_hold"].includes(p.status)).length },
            {
              value: "residential",
              label: "Residential",
              count: projects.filter((p) => p.type === "residential" && !["complete", "on_hold"].includes(p.status)).length,
            },
            {
              value: "commercial",
              label: "Commercial",
              count: projects.filter((p) => p.type === "commercial" && !["complete", "on_hold"].includes(p.status)).length,
            },
          ]}
        />
        <FilterChips
          value={mode}
          onChange={setMode}
          options={[
            { value: "gantt", label: "Gantt" },
            { value: "list", label: "List" },
          ]}
        />
      </div>

      {mode === "gantt" ? (
        <div className="overflow-x-auto border border-border bg-bg-elevated">
          <div className="min-w-[720px]">
            {/* Axis */}
            <div className="sticky top-0 z-10 grid border-b border-border bg-bg-elevated" style={{ gridTemplateColumns: "11rem 1fr" }}>
              <div className="border-r border-border px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
                Job / phase
              </div>
              <div className="relative h-9">
                {ticks.map((t) => (
                  <div
                    key={t.label + t.offset}
                    className="absolute top-0 bottom-0 border-l border-border/80"
                    style={{ left: `${(t.offset / totalDays) * 100}%` }}
                  >
                    <span className="absolute left-1 top-1.5 text-[10px] tabular-nums text-fg-subtle">{t.label}</span>
                  </div>
                ))}
                {/* Today line on axis */}
                {(() => {
                  const off = daysBetween(rangeStart, today);
                  if (off < 0 || off > totalDays) return null;
                  return (
                    <div
                      className="absolute top-0 bottom-0 z-10 w-px bg-danger"
                      style={{ left: `${(off / totalDays) * 100}%` }}
                      title="Today"
                    />
                  );
                })()}
              </div>
            </div>

            {active.map((p) => {
              const crew = crewOnJob(p.id);
              const crewNames = crewsOnJob(p.id);
              return (
                <div key={p.id} className="border-b border-border last:border-0">
                  <div className="grid items-center bg-bg-subtle/60" style={{ gridTemplateColumns: "11rem 1fr" }}>
                    <div className="border-r border-border px-3 py-2.5">
                      <Link
                        to="/app/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="block truncate text-[12px] font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="truncate text-[10px] text-fg-subtle">
                        {p.superintendent} · {p.progress}%
                      </p>
                    </div>
                    <div className="relative h-10 px-0">
                      {/* job span */}
                      {(() => {
                        const start = parseDay(p.startDate);
                        const end = parseDay(p.endDate);
                        if (!start || !end) return null;
                        const left = Math.max(0, daysBetween(rangeStart, start));
                        const right = Math.min(totalDays, daysBetween(rangeStart, end));
                        const width = Math.max(right - left, 1);
                        return (
                          <div
                            className="absolute top-3 h-4 border border-border-strong/40 bg-chart-3/30"
                            style={{
                              left: `${(left / totalDays) * 100}%`,
                              width: `${(width / totalDays) * 100}%`,
                            }}
                          />
                        );
                      })()}
                      {(() => {
                        const off = daysBetween(rangeStart, today);
                        if (off < 0 || off > totalDays) return null;
                        return (
                          <div
                            className="absolute top-0 bottom-0 z-10 w-px bg-danger/70"
                            style={{ left: `${(off / totalDays) * 100}%` }}
                          />
                        );
                      })()}
                    </div>
                  </div>

                  {p.schedule.map((s) => {
                    const start = parseDay(s.start);
                    const end = parseDay(s.end);
                    if (!start || !end) return null;
                    const left = Math.max(0, daysBetween(rangeStart, start));
                    const right = Math.min(totalDays, daysBetween(rangeStart, end));
                    const width = Math.max(right - left, 1);
                    const tone = phaseTone(s.pct, end, today);
                    return (
                      <div
                        key={s.phase}
                        className="grid items-center"
                        style={{ gridTemplateColumns: "11rem 1fr" }}
                      >
                        <div className="flex items-center gap-1 border-r border-border px-3 py-1.5">
                          {tone === "late" ? (
                            <AlertTriangle className="h-3 w-3 shrink-0 text-danger" strokeWidth={1.75} />
                          ) : null}
                          <span className="truncate text-[11px] text-fg-muted">{s.phase as Phase}</span>
                        </div>
                        <div className="relative h-7">
                          {(() => {
                            const off = daysBetween(rangeStart, today);
                            if (off < 0 || off > totalDays) return null;
                            return (
                              <div
                                className="absolute top-0 bottom-0 z-10 w-px bg-danger/40"
                                style={{ left: `${(off / totalDays) * 100}%` }}
                              />
                            );
                          })()}
                          <div
                            className={cn(
                              "absolute top-1 flex h-5 items-center overflow-hidden px-1.5 text-[9px] font-medium tabular-nums tracking-wide",
                              toneClass[tone],
                            )}
                            style={{
                              left: `${(left / totalDays) * 100}%`,
                              width: `${(width / totalDays) * 100}%`,
                              minWidth: "1.25rem",
                            }}
                            title={`${s.phase}: ${formatDate(s.start)} – ${formatDate(s.end)} · ${s.pct}%`}
                          >
                            <span className="truncate">{s.pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(crew.length > 0 || crewNames.length > 0) && (
                    <div className="grid border-t border-border/60 bg-bg" style={{ gridTemplateColumns: "11rem 1fr" }}>
                      <div className="border-r border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.06em] text-fg-subtle">
                        Crew
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-3 py-1.5">
                        {crewNames.map((c) => (
                          <Badge key={c.id} variant="outline" className="text-[10px]">
                            {c.name}
                          </Badge>
                        ))}
                        {crew.map((m) => (
                          <span key={m.id} className="text-[11px] text-fg-muted">
                            {m.name}
                            <span className="text-fg-subtle"> · {m.trade}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!active.length ? (
              <p className="px-4 py-10 text-center text-[13px] text-fg-muted">No active jobs on the schedule.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border px-3 py-2 text-[10px] text-fg-subtle">
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-4 bg-primary" /> Active</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-4 bg-success/80" /> Done</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-4 bg-danger" /> Late</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-4 border border-border bg-bg-subtle" /> Future</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-px bg-danger" /> Today</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map((p) => {
            const crew = crewOnJob(p.id);
            return (
              <div key={p.id} className="border border-border bg-bg-elevated p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="text-[13px] font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <Badge variant="outline">{p.status.replace(/_/g, " ")}</Badge>
                    <Badge variant="secondary">{p.type}</Badge>
                  </div>
                  <span className="text-[11px] text-fg-subtle">
                    {p.phase} · {p.progress}% · Super: {p.superintendent}
                  </span>
                </div>
                {crew.length > 0 ? (
                  <p className="mb-3 text-[11px] text-fg-muted">
                    Crew on job: {crew.map((m) => m.name).join(", ")}
                  </p>
                ) : null}
                <div className="space-y-2">
                  {p.schedule.map((s) => {
                    const end = parseDay(s.end);
                    const late = end && end < today && s.pct < 100;
                    return (
                      <div
                        key={s.phase}
                        className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 sm:grid-cols-[9rem_1fr_11rem]"
                      >
                        <span className={cn("truncate text-[11px]", late ? "text-danger" : "text-fg-muted")}>
                          {late ? "⚠ " : ""}
                          {s.phase}
                        </span>
                        <div className="h-1.5 overflow-hidden bg-bg-subtle">
                          <div
                            className={cn("h-full transition-all", late ? "bg-danger" : s.pct >= 100 ? "bg-success" : "bg-primary")}
                            style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                          />
                        </div>
                        <span className="hidden text-right text-[10px] tabular-nums text-fg-subtle sm:block">
                          {formatDate(s.start)}–{formatDate(s.end)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!active.length ? (
            <p className="text-[13px] text-fg-muted">No active jobs on the schedule.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
