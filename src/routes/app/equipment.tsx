import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Wrench } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { EquipmentStatusBadge } from "@/components/layout/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import type { EquipmentStatus } from "@/data/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/equipment")({ component: EquipmentPage });

type Filter = "all" | EquipmentStatus | "service_due";

function daysUntil(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 999;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function EquipmentPage() {
  const equipment = useAppStore((s) => s.equipment);
  const projects = useAppStore((s) => s.projects);
  const assignEquipment = useAppStore((s) => s.assignEquipment);
  const setEquipmentStatus = useAppStore((s) => s.setEquipmentStatus);
  const [filter, setFilter] = useState<Filter>("all");

  const activeJobs = projects.filter((p) => !["complete", "on_hold"].includes(p.status));

  const withService = useMemo(() => {
    return equipment.map((e) => ({ ...e, days: daysUntil(e.nextService) }));
  }, [equipment]);

  const serviceDue = withService.filter((e) => e.days <= 30 && e.status !== "retired");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: equipment.length, service_due: serviceDue.length };
    for (const e of equipment) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [equipment, serviceDue]);

  const filtered = useMemo(() => {
    if (filter === "service_due") return withService.filter((e) => e.days <= 30 && e.status !== "retired");
    if (filter === "all") return withService;
    return withService.filter((e) => e.status === filter);
  }, [withService, filter]);

  function onAssign(id: string, value: string) {
    assignEquipment(id, value === "none" ? undefined : value);
    toast.success(value === "none" ? "Returned to yard" : "Assigned to job");
  }

  return (
    <div>
      <PageHeader
        title="Equipment"
        description="Fleet and tools — where it is, when service is due, and which job is using it."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fleet size" value={String(equipment.length)} hint="Tracked assets" />
        <StatCard label="On site" value={String(counts.on_site ?? 0)} hint="Assigned to jobs" />
        <StatCard label="Available" value={String(counts.available ?? 0)} hint="Yard / ready" />
        <StatCard
          label="Service ≤ 30 days"
          value={String(serviceDue.length)}
          hint={serviceDue.length ? "Action needed" : "All clear"}
          icon={serviceDue.length ? <AlertTriangle className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
        />
      </div>

      {serviceDue.length > 0 ? (
        <div className="mb-4 border border-warning/40 bg-bg-elevated p-3">
          <p className="text-[12px] font-medium text-warning">Service window</p>
          <ul className="mt-1 space-y-0.5 text-[12px] text-fg-muted">
            {serviceDue
              .slice()
              .sort((a, b) => a.days - b.days)
              .map((e) => (
                <li key={e.id}>
                  {e.name} —{" "}
                  {e.days < 0
                    ? `${Math.abs(e.days)}d overdue`
                    : e.days === 0
                      ? "due today"
                      : `due in ${e.days}d`}{" "}
                  ({formatDate(e.nextService)})
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: counts.all },
          { value: "service_due", label: "Service due", count: counts.service_due },
          { value: "available", label: "Available", count: counts.available ?? 0 },
          { value: "on_site", label: "On site", count: counts.on_site ?? 0 },
          { value: "maintenance", label: "Shop", count: counts.maintenance ?? 0 },
        ]}
      />

      <div className="space-y-2">
        {filtered.map((e) => {
          const job = projects.find((p) => p.id === e.projectId);
          const overdue = e.days < 0;
          const soon = e.days >= 0 && e.days <= 30;
          return (
            <div
              key={e.id}
              className="flex flex-col gap-3 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-medium">{e.name}</p>
                  {(overdue || soon) && e.status !== "retired" ? (
                    <span className={`text-[10px] uppercase tracking-[0.06em] ${overdue ? "text-danger" : "text-warning"}`}>
                      {overdue ? "Service overdue" : "Service soon"}
                    </span>
                  ) : null}
                </div>
                <p className="text-[12px] text-fg-muted">
                  {e.category} · service {formatDate(e.nextService)} · {e.hours}h
                </p>
                {job ? (
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: job.id }}
                    className="mt-1 inline-block text-[11px] text-fg-subtle hover:underline"
                  >
                    On {job.name}
                  </Link>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EquipmentStatusBadge status={e.status} />
                {e.status === "maintenance" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEquipmentStatus(e.id, "available");
                      toast.success("Released from shop");
                    }}
                  >
                    Mark available
                  </Button>
                ) : e.status !== "retired" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEquipmentStatus(e.id, "maintenance");
                      toast.success("Sent to shop");
                    }}
                  >
                    To shop
                  </Button>
                ) : null}
                <Select
                  value={e.projectId ?? "none"}
                  onValueChange={(v) => onAssign(e.id, v)}
                  disabled={e.status === "maintenance" || e.status === "retired"}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Assign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Yard / available</SelectItem>
                    {activeJobs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
        {!filtered.length ? (
          <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">
            No equipment in this filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}
