import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { createPermitPackage, packageStatus } from "@/lib/permits-idaho";
import type { PermitChecklistItem, PermitPackage, PermitStatus } from "@/data/types";
import { LEGAL_DRAFT_DISCLAIMER } from "@/lib/company";

export const Route = createFileRoute("/app/permits")({ component: PermitsPage });

function statusVariant(s: PermitStatus): "secondary" | "warning" | "success" | "outline" {
  if (s === "approved") return "success";
  if (s === "submitted" || s === "ready_review") return "warning";
  if (s === "drafting") return "secondary";
  return "outline";
}

function PermitsPage() {
  const { projects } = useAppStore();
  const residential = projects.filter((p) => p.type === "residential");
  const seed = useMemo(() => {
    const p = residential[0] ?? projects[0];
    return p ? [createPermitPackage(p.id, p.name)] : [];
  }, [projects, residential]);
  const [packages, setPackages] = useState<PermitPackage[]>(seed);
  const [activePkg, setActivePkg] = useState(packages[0]?.id ?? "");
  const [activeItem, setActiveItem] = useState<string | null>(packages[0]?.items[0]?.key ?? null);

  const pkg = packages.find((p) => p.id === activePkg);
  const item = pkg?.items.find((i) => i.key === activeItem);

  function setItemStatus(key: string, status: PermitStatus) {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== activePkg) return p;
        const items = p.items.map((i) => (i.key === key ? { ...i, status } : i));
        return { ...p, items, status: packageStatus(items), updatedAt: new Date().toISOString().slice(0, 10) };
      }),
    );
  }

  function generateDraft(key: string) {
    setPackages((prev) =>
      prev.map((p) => {
        if (p.id !== activePkg) return p;
        const items = p.items.map((i) =>
          i.key === key
            ? {
                ...i,
                status: i.status === "not_started" ? ("drafting" as const) : i.status,
                draftText:
                  i.draftText ??
                  `DRAFT — ${i.label}\nProject package ${p.title}\n\nComplete fields with job data, then mark Ready for review.\nAI DRAFT ONLY.`,
              }
            : i,
        );
        return { ...p, items, status: packageStatus(items) };
      }),
    );
    setActiveItem(key);
  }

  return (
    <div>
      <PageHeader
        title="Permits & health sign-off"
        description="Jefferson County Building Department and Eastern Idaho Public Health (District 7). AI generates drafts only — you complete, review, and file."
      />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          {packages.map((p) => {
            const job = projects.find((x) => x.id === p.projectId);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePkg(p.id);
                  setActiveItem(p.items[0]?.key ?? null);
                }}
                className={`w-full border border-border p-3 text-left ${
                  activePkg === p.id ? "bg-primary text-primary-fg" : "bg-bg-elevated hover:bg-bg-subtle"
                }`}
              >
                <p className="text-[13px] font-medium">{job?.name ?? p.title}</p>
                <p className={`mt-1 text-[11px] ${activePkg === p.id ? "text-primary-fg/70" : "text-fg-muted"}`}>
                  {p.items.filter((i) => i.status === "approved").length}/{p.items.length} cleared · {p.status}
                </p>
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          {pkg ? (
            <>
              <div className="border border-border">
                {pkg.items.map((i: PermitChecklistItem) => (
                  <div
                    key={i.key}
                    className={`flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-0 ${
                      activeItem === i.key ? "bg-bg-subtle" : ""
                    }`}
                  >
                    <button type="button" className="min-w-0 text-left" onClick={() => setActiveItem(i.key)}>
                      <p className="text-[13px] font-medium">{i.label}</p>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
                        {i.authority.replace(/_/g, " ")}
                        {i.formCode ? ` · ${i.formCode}` : ""}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(i.status)}>{i.status.replace(/_/g, " ")}</Badge>
                      <Button size="sm" variant="outline" onClick={() => generateDraft(i.key)}>
                        AI draft
                      </Button>
                      {i.status === "drafting" ? (
                        <Button size="sm" variant="outline" onClick={() => setItemStatus(i.key, "ready_review")}>
                          Ready
                        </Button>
                      ) : null}
                      {i.status === "ready_review" ? (
                        <Button size="sm" variant="outline" onClick={() => setItemStatus(i.key, "submitted")}>
                          Submitted
                        </Button>
                      ) : null}
                      {i.status === "submitted" ? (
                        <Button size="sm" variant="outline" onClick={() => setItemStatus(i.key, "approved")}>
                          Approved
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border border-border bg-bg-elevated p-4">
                <p className="label-caps mb-2">Draft preview</p>
                {item?.draftText ? (
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-fg-muted">
                    {item.draftText}
                  </pre>
                ) : (
                  <p className="text-[13px] text-fg-muted">Select an item and run AI draft to generate form text for review.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-fg-muted">No residential jobs to package yet. Add a residential project first.</p>
          )}
          <p className="text-[11px] leading-relaxed text-fg-subtle border border-border bg-bg-elevated p-3">
            {LEGAL_DRAFT_DISCLAIMER} Jefferson County and EIPH filings must use current official forms; these drafts are
            worksheets only.
          </p>
        </div>
      </div>
    </div>
  );
}
