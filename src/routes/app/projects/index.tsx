import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/")({ component: ProjectsPage });

function ProjectsPage() {
  const { projects, clients } = useAppStore();
  return (
    <div>
      <PageHeader title="Jobs" description="Every active and pipeline project. Open a job for schedule, money, logs, and owner items." />
      <div className="border border-border">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.9fr_0.6fr] gap-3 border-b border-border bg-bg-subtle px-4 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle md:grid">
          <span>Job</span><span>Client</span><span>Phase</span><span>Status</span><span>Budget</span><span>%</span>
        </div>
        {projects.map((p) => {
          const client = clients.find((c) => c.id === p.clientId);
          return (
            <Link
              key={p.id}
              to="/app/projects/$projectId"
              params={{ projectId: p.id }}
              className="grid gap-2 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-bg-subtle md:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.9fr_0.6fr] md:items-center md:gap-3"
            >
              <div>
                <p className="text-[13px] font-medium">{p.name}</p>
                <p className="text-[11px] text-fg-muted">{p.address}</p>
              </div>
              <p className="text-[12px] text-fg-muted">{client?.name}</p>
              <p className="text-[12px] text-fg-muted">{p.phase}</p>
              <ProjectStatusBadge status={p.status} />
              <div>
                <p className="text-[12px] tabular-nums">{formatCurrency(p.budget)}</p>
                <p className="text-[11px] tabular-nums text-fg-subtle">spent {formatCurrency(p.spent)}</p>
              </div>
              <div>
                <Progress value={p.progress} className="mb-1" />
                <p className="text-[11px] tabular-nums text-fg-subtle">{p.progress}%</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
