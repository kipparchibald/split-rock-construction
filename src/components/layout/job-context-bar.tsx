import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/data/types";
import { formatCurrency } from "@/lib/utils";

export function JobContextBar({
  project,
  contractTotal,
}: {
  project: Project;
  contractTotal: number;
}) {
  return (
    <div className="sticky top-12 z-10 -mx-4 mb-5 border-b border-border bg-bg-elevated/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.75} />
          Jobs
        </Link>
        <span className="hidden text-fg-subtle sm:inline">/</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[13px] font-medium">{project.name}</p>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="truncate text-[11px] text-fg-subtle">
            {project.phase} · {project.superintendent}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] tabular-nums">
          <span className="hidden text-fg-muted sm:inline">{project.progress}%</span>
          <span className="font-medium">{formatCurrency(contractTotal)}</span>
        </div>
      </div>
      <Progress value={project.progress} className="mt-2" />
    </div>
  );
}
