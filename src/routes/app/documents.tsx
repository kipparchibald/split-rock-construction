import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/documents")({ component: DocumentsPage });

function DocumentsPage() {
  const { documents, projects, updateDocStatus } = useAppStore();
  return (
    <div>
      <PageHeader title="Documents" description="RFIs, submittals, drawings, permits, change orders — document control without the enterprise tax." />
      <div className="space-y-2">
        {documents.map((d) => {
          const p = projects.find((x) => x.id === d.projectId);
          return (
            <div key={d.id} className="flex flex-col gap-2 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium">{d.title}</p>
                <p className="text-[12px] text-fg-muted">
                  <Link to="/app/projects/$projectId" params={{ projectId: d.projectId }} className="hover:underline">{p?.name}</Link>
                  {" · "}{d.type.replace("_", " ")} · {d.author} · {formatDate(d.updatedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.status === "approved" ? "success" : d.status === "open" || d.status === "pending" ? "warning" : "secondary"}>{d.status}</Badge>
                {(d.status === "open" || d.status === "pending") ? (
                  <Button size="sm" variant="outline" onClick={() => updateDocStatus(d.id, "approved")}>Approve</Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
