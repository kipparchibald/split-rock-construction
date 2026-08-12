import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import type { ProjectStatus } from "@/data/types";
import { isDemoDataEnabled, LIVE_EMPTY_HINT } from "@/lib/runtime-config";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/")({ component: ProjectsPage });

type Filter = "all" | ProjectStatus | "active" | "residential" | "commercial";

function ProjectsPage() {
  const { projects, clients } = useAppStore();
  const [filter, setFilter] = useState<Filter>("active");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length, active: 0 };
    for (const p of projects) {
      c[p.status] = (c[p.status] ?? 0) + 1;
      if (!["complete", "on_hold"].includes(p.status)) c.active += 1;
    }
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    if (filter === "active") return projects.filter((p) => !["complete", "on_hold"].includes(p.status));
    if (filter === "residential" || filter === "commercial") return projects.filter((p) => p.type === filter);
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  return (
    <div>
      <PageHeader title="Jobs" description="Every active and pipeline project. Open a job for schedule, money, logs, and owner items." />
      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "active", label: "Active", count: counts.active },
          { value: "all", label: "All", count: counts.all },
          { value: "residential", label: "Residential", count: projects.filter((p) => p.type === "residential").length },
          { value: "commercial", label: "Commercial", count: projects.filter((p) => p.type === "commercial").length },
          { value: "in_progress", label: "In progress", count: counts.in_progress ?? 0 },
          { value: "punch_list", label: "Punch", count: counts.punch_list ?? 0 },
          { value: "planning", label: "Planning", count: counts.planning ?? 0 },
        ]}
      />
      <div className="border border-border">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.9fr_0.6fr] gap-3 border-b border-border bg-bg-subtle px-4 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle md:grid">
          <span>Job</span><span>Client</span><span>Phase</span><span>Status</span><span>Budget</span><span>%</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[13px] font-medium text-fg">
              {projects.length === 0 && !isDemoDataEnabled ? "No jobs yet" : "No jobs match this filter"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-fg-muted">
              {projects.length === 0 && !isDemoDataEnabled
                ? LIVE_EMPTY_HINT
                : "Try another filter or start a job from Book of Plans."}
            </p>
            {projects.length === 0 && !isDemoDataEnabled ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" asChild>
                  <Link to="/app/clients">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add client
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/app/pricing">Price a bid</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : filtered.map((p) => {
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
                <p className="text-[11px] text-fg-muted">{p.address} · {p.type}</p>
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
