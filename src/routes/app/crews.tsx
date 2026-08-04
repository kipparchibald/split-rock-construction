import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/crews")({ component: CrewsPage });

type MemberFilter = "all" | "active" | "pto" | "unassigned";

function CrewsPage() {
  const crews = useAppStore((s) => s.crews);
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const assignMember = useAppStore((s) => s.assignMember);
  const assignCrew = useAppStore((s) => s.assignCrew);
  const [filter, setFilter] = useState<MemberFilter>("all");

  const activeJobs = projects.filter((p) => !["complete", "on_hold"].includes(p.status));

  const stats = useMemo(() => {
    const active = members.filter((m) => m.status === "active").length;
    const pto = members.filter((m) => m.status === "pto").length;
    const unassigned = members.filter((m) => !m.projectId && m.status === "active").length;
    const burn = members
      .filter((m) => m.status === "active" && m.projectId)
      .reduce((s, m) => s + m.rate * 8, 0);
    return { active, pto, unassigned, dailyBurn: burn };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (filter === "active") return m.status === "active";
      if (filter === "pto") return m.status === "pto";
      if (filter === "unassigned") return !m.projectId;
      return true;
    });
  }, [members, filter]);

  function onAssignMember(id: string, value: string) {
    assignMember(id, value === "none" ? undefined : value);
    toast.success(value === "none" ? "Released to yard" : "Assigned to job");
  }

  function onAssignCrew(id: string, value: string) {
    assignCrew(id, value === "none" ? undefined : value);
    toast.success(value === "none" ? "Crew unassigned" : "Crew staged on job");
  }

  return (
    <div>
      <PageHeader
        title="Crews"
        description="Who is on which job — assign crews and people, watch capacity and daily labor burn."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active" value={String(stats.active)} hint="On payroll / available" />
        <StatCard label="On PTO" value={String(stats.pto)} hint="Out of field" />
        <StatCard label="Unassigned" value={String(stats.unassigned)} hint="Active, no job" />
        <StatCard
          label="Daily labor burn"
          value={`$${stats.dailyBurn.toLocaleString()}`}
          hint="8h × rate for staged crew"
        />
      </div>

      <h2 className="mb-2 text-[13px] font-medium">Crew teams</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {crews.map((c) => {
          const lead = members.find((m) => m.id === c.leadId);
          const job = projects.find((p) => p.id === c.projectId);
          return (
            <div key={c.id} className="flex flex-col border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">{c.name}</p>
              <p className="text-[12px] text-fg-muted">
                {c.trade} · lead {lead?.name ?? "—"}
              </p>
              <p className="mt-2 text-[11px] text-fg-subtle">{c.memberIds.length} people</p>
              <div className="mt-3">
                <Select
                  value={c.projectId ?? "none"}
                  onValueChange={(v) => onAssignCrew(c.id, v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assign job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {activeJobs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {job ? (
                <Link
                  to="/app/projects/$projectId"
                  params={{ projectId: job.id }}
                  className="mt-2 text-[11px] text-fg-muted hover:underline"
                >
                  Open {job.name}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[13px] font-medium">People</h2>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: members.length },
            { value: "active", label: "Active", count: stats.active },
            { value: "pto", label: "PTO", count: stats.pto },
            { value: "unassigned", label: "Unassigned", count: members.filter((m) => !m.projectId).length },
          ]}
        />
      </div>

      <div className="border border-border">
        {filteredMembers.map((m) => {
          const job = projects.find((p) => p.id === m.projectId);
          return (
            <div
              key={m.id}
              className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium">{m.name}</p>
                <p className="text-[12px] text-fg-muted">
                  {m.role} · {m.trade} · ${m.rate}/hr
                </p>
                {m.certifications.length ? (
                  <p className="mt-1 text-[10px] text-fg-subtle">{m.certifications.join(" · ")}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    m.status === "active" ? "success" : m.status === "pto" ? "warning" : "secondary"
                  }
                >
                  {m.status}
                </Badge>
                <Select
                  value={m.projectId ?? "none"}
                  onValueChange={(v) => onAssignMember(m.id, v)}
                  disabled={m.status === "pto"}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yard / unassigned</SelectItem>
                    {activeJobs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {job ? (
                  <span className="hidden text-[11px] text-fg-subtle lg:inline">{job.phase}</span>
                ) : null}
              </div>
            </div>
          );
        })}
        {!filteredMembers.length ? (
          <p className="px-4 py-8 text-center text-[13px] text-fg-muted">No people in this filter.</p>
        ) : null}
      </div>
    </div>
  );
}
