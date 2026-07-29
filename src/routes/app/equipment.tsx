import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { EquipmentStatusBadge } from "@/components/layout/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/data/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/equipment")({ component: EquipmentPage });

function EquipmentPage() {
  const { equipment, projects, assignEquipment } = useAppStore();
  return (
    <div>
      <PageHeader title="Equipment" description="Fleet and tools — where it is and when it needs service." />
      <div className="space-y-2">
        {equipment.map((e) => (
          <div key={e.id} className="flex flex-col gap-3 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium">{e.name}</p>
              <p className="text-[12px] text-fg-muted">{e.category} · service {formatDate(e.nextService)} · {e.hours}h</p>
            </div>
            <div className="flex items-center gap-2">
              <EquipmentStatusBadge status={e.status} />
              <Select
                value={e.projectId ?? "none"}
                onValueChange={(v) => assignEquipment(e.id, v === "none" ? undefined : v)}
              >
                <SelectTrigger className="w-44"><SelectValue placeholder="Assign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yard / available</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
