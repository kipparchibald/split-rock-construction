import { Badge } from "@/components/ui/badge";
import type { BidStatus, EquipmentStatus, ProjectStatus, SafetySeverity } from "@/data/types";

const projectMap: Record<ProjectStatus, { label: string; variant: "secondary" | "info" | "success" | "warning" | "danger" | "outline" }> = {
  planning: { label: "Planning", variant: "secondary" },
  permitting: { label: "Permitting", variant: "info" },
  in_progress: { label: "In progress", variant: "success" },
  punch_list: { label: "Punch list", variant: "warning" },
  complete: { label: "Complete", variant: "outline" },
  on_hold: { label: "On hold", variant: "danger" },
};

const bidMap: Record<BidStatus, { label: string; variant: "secondary" | "info" | "success" | "warning" | "danger" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "info" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "danger" },
  expired: { label: "Expired", variant: "outline" },
};

const equipMap: Record<EquipmentStatus, { label: string; variant: "secondary" | "info" | "success" | "warning" | "danger" | "outline" }> = {
  available: { label: "Available", variant: "success" },
  on_site: { label: "On site", variant: "info" },
  maintenance: { label: "Maintenance", variant: "warning" },
  retired: { label: "Retired", variant: "outline" },
};

const severityMap: Record<SafetySeverity, { label: string; variant: "secondary" | "info" | "success" | "warning" | "danger" | "outline" }> = {
  near_miss: { label: "Near miss", variant: "info" },
  minor: { label: "Minor", variant: "warning" },
  serious: { label: "Serious", variant: "danger" },
  critical: { label: "Critical", variant: "danger" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const m = projectMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
export function BidStatusBadge({ status }: { status: BidStatus }) {
  const m = bidMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const m = equipMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
export function SeverityBadge({ severity }: { severity: SafetySeverity }) {
  const m = severityMap[severity];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
