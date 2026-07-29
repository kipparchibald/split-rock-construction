import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import type { DocType } from "@/data/types";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/app/documents")({ component: DocumentsPage });

type Filter = "all" | "open" | DocType;

function DocumentsPage() {
  const { documents, projects, updateDocStatus } = useAppStore();
  const [filter, setFilter] = useState<Filter>("open");

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: documents.length,
      open: documents.filter((d) => d.status === "open" || d.status === "pending").length,
    };
    for (const d of documents) c[d.type] = (c[d.type] ?? 0) + 1;
    return c;
  }, [documents]);

  const filtered = useMemo(() => {
    if (filter === "all") return documents;
    if (filter === "open") return documents.filter((d) => d.status === "open" || d.status === "pending");
    return documents.filter((d) => d.type === filter);
  }, [documents, filter]);

  return (
    <div>
      <PageHeader title="Documents" description="RFIs, submittals, drawings, permits, change orders — document control without the enterprise tax." />
      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: "Open", count: counts.open },
          { value: "all", label: "All", count: counts.all },
          { value: "rfi", label: "RFI", count: counts.rfi ?? 0 },
          { value: "submittal", label: "Submittal", count: counts.submittal ?? 0 },
          { value: "drawing", label: "Drawing", count: counts.drawing ?? 0 },
          { value: "permit", label: "Permit", count: counts.permit ?? 0 },
          { value: "change_order", label: "CO", count: counts.change_order ?? 0 },
          { value: "contract", label: "Contract", count: counts.contract ?? 0 },
        ]}
      />
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">
            No documents in this filter.
          </p>
        ) : filtered.map((d) => {
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
