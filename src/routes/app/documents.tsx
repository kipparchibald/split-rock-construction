import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import type { DocType, DocumentItem } from "@/data/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/app/documents")({ component: DocumentsPage });

type Filter = "all" | "open" | "inspections" | DocType;

function statusVariant(status: DocumentItem["status"]) {
  if (status === "approved" || status === "passed") return "success" as const;
  if (status === "open" || status === "pending" || status === "scheduled") return "warning" as const;
  if (status === "rejected" || status === "failed") return "danger" as const;
  return "secondary" as const;
}

function DocumentsPage() {
  const documents = useAppStore((s) => s.documents);
  const projects = useAppStore((s) => s.projects);
  const updateDocStatus = useAppStore((s) => s.updateDocStatus);
  const [filter, setFilter] = useState<Filter>("open");

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: documents.length,
      open: documents.filter((d) =>
        ["open", "pending", "scheduled", "failed"].includes(d.status),
      ).length,
      inspections: documents.filter((d) => d.type === "inspection" || d.type === "permit").length,
    };
    for (const d of documents) c[d.type] = (c[d.type] ?? 0) + 1;
    return c;
  }, [documents]);

  const filtered = useMemo(() => {
    if (filter === "all") return documents;
    if (filter === "open") {
      return documents.filter((d) => ["open", "pending", "scheduled", "failed"].includes(d.status));
    }
    if (filter === "inspections") {
      return documents.filter((d) => d.type === "inspection" || d.type === "permit");
    }
    return documents.filter((d) => d.type === filter);
  }, [documents, filter]);

  function actionButtons(d: DocumentItem) {
    if (d.type === "inspection") {
      if (d.status === "scheduled" || d.status === "failed") {
        return (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateDocStatus(d.id, "passed");
                toast.success("Inspection passed");
              }}
            >
              Pass
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateDocStatus(d.id, "failed");
                toast.message("Marked failed");
              }}
            >
              Fail
            </Button>
          </>
        );
      }
      return null;
    }
    if (d.status === "open" || d.status === "pending") {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            updateDocStatus(d.id, "approved");
            toast.success("Approved");
          }}
        >
          Approve
        </Button>
      );
    }
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        description="RFIs, submittals, drawings, permits, inspections, change orders — document control without the enterprise tax."
      />
      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: "Needs action", count: counts.open },
          { value: "inspections", label: "Permits & insp.", count: counts.inspections },
          { value: "all", label: "All", count: counts.all },
          { value: "rfi", label: "RFI", count: counts.rfi ?? 0 },
          { value: "submittal", label: "Submittal", count: counts.submittal ?? 0 },
          { value: "drawing", label: "Drawing", count: counts.drawing ?? 0 },
          { value: "permit", label: "Permit", count: counts.permit ?? 0 },
          { value: "inspection", label: "Inspection", count: counts.inspection ?? 0 },
          { value: "change_order", label: "CO", count: counts.change_order ?? 0 },
          { value: "contract", label: "Contract", count: counts.contract ?? 0 },
          { value: "lien_waiver", label: "Lien waiver", count: counts.lien_waiver ?? 0 },
        ]}
      />
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">
            No documents in this filter.
          </p>
        ) : (
          filtered.map((d) => {
            const p = projects.find((x) => x.id === d.projectId);
            return (
              <div
                key={d.id}
                className="flex flex-col gap-2 border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-[13px] font-medium">{d.title}</p>
                  <p className="text-[12px] text-fg-muted">
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: d.projectId }}
                      className="hover:underline"
                    >
                      {p?.name}
                    </Link>
                    {" · "}
                    {d.type.replace("_", " ")} · {d.author} · {formatDate(d.updatedAt)}
                  </p>
                  {(d.reference || d.dueDate) && (
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      {d.reference ? `Ref ${d.reference}` : null}
                      {d.reference && d.dueDate ? " · " : null}
                      {d.dueDate ? `Due ${formatDate(d.dueDate)}` : null}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(d.status)}>{d.status.replace("_", " ")}</Badge>
                  {actionButtons(d)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
