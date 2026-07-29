import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/data/store";

export const Route = createFileRoute("/app/crews")({ component: CrewsPage });

function CrewsPage() {
  const { crews, members, projects } = useAppStore();
  return (
    <div>
      <PageHeader title="Crews" description="Who is on which job — capacity at a glance." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {crews.map((c) => {
          const lead = members.find((m) => m.id === c.leadId);
          const job = projects.find((p) => p.id === c.projectId);
          return (
            <div key={c.id} className="border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">{c.name}</p>
              <p className="text-[12px] text-fg-muted">{c.trade} · lead {lead?.name}</p>
              <p className="mt-2 text-[11px] text-fg-subtle">{job ? job.name : "Unassigned"} · {c.memberIds.length} people</p>
            </div>
          );
        })}
      </div>
      <div className="border border-border">
        {members.map((m) => {
          const job = projects.find((p) => p.id === m.projectId);
          return (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-0">
              <div>
                <p className="text-[13px] font-medium">{m.name}</p>
                <p className="text-[12px] text-fg-muted">{m.role} · {m.trade} · ${m.rate}/hr</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-fg-subtle">{job?.name ?? "—"}</span>
                <Badge variant={m.status === "active" ? "success" : m.status === "pto" ? "warning" : "secondary"}>{m.status}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
