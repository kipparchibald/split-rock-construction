import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/schedule")({ component: SchedulePage });

function SchedulePage() {
  const projects = useAppStore((s) => s.projects).filter((p) => !["complete", "on_hold"].includes(p.status));
  const members = useAppStore((s) => s.members);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Phase timelines across active jobs — Gantt-style overview with crew assignments. Use the job hub schedule tab for per-job detail."
      />
      <div className="space-y-4">
        {projects.map((p) => {
          const crew = members.filter((m) => m.projectId === p.id);
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
                {p.schedule.map((s) => (
                  <div
                    key={s.phase}
                    className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 sm:grid-cols-[9rem_1fr_11rem]"
                  >
                    <span className="truncate text-[11px] text-fg-muted">{s.phase}</span>
                    <Progress value={s.pct} />
                    <span className="hidden text-right text-[10px] tabular-nums text-fg-subtle sm:block">
                      {formatDate(s.start)}–{formatDate(s.end)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {!projects.length ? (
          <p className="text-[13px] text-fg-muted">No active jobs on the schedule.</p>
        ) : null}
      </div>
    </div>
  );
}
