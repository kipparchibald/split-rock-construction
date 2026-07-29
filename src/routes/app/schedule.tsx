import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/schedule")({ component: SchedulePage });

function SchedulePage() {
  const projects = useAppStore((s) => s.projects).filter((p) => !["complete", "on_hold"].includes(p.status));
  return (
    <div>
      <PageHeader title="Schedule" description="Phase timelines across active jobs — like a builder Gantt at a glance." />
      <div className="space-y-4">
        {projects.map((p) => (
          <div key={p.id} className="border border-border bg-bg-elevated p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Link to="/app/projects/$projectId" params={{ projectId: p.id }} className="text-[13px] font-medium hover:underline">{p.name}</Link>
              <span className="text-[11px] text-fg-subtle">{p.phase} · {p.progress}%</span>
            </div>
            <div className="space-y-2">
              {p.schedule.map((s) => (
                <div key={s.phase} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 sm:grid-cols-[9rem_1fr_11rem]">
                  <span className="truncate text-[11px] text-fg-muted">{s.phase}</span>
                  <Progress value={s.pct} />
                  <span className="hidden text-right text-[10px] tabular-nums text-fg-subtle sm:block">{formatDate(s.start)}–{formatDate(s.end)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
