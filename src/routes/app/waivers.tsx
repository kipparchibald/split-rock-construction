import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/data/store";
import { SAMPLE_VENDORS } from "@/lib/sub-insurance";
import { draftLienWaiverText, suggestWaiverForDraw, waiverTypeLabel } from "@/lib/lien-waivers";
import type { LienWaiver, LienWaiverType } from "@/data/types";
import { LEGAL_DRAFT_DISCLAIMER } from "@/lib/company";
import { loadJson, saveJson, PERSIST_KEYS } from "@/lib/local-persist";

export const Route = createFileRoute("/app/waivers")({ component: WaiversPage });

function WaiversPage() {
  const { projects, draws } = useAppStore();
  const [waivers, setWaivers] = useState<LienWaiver[]>(() => loadJson(PERSIST_KEYS.waivers, []));
  function persistWaivers(next: LienWaiver[]) {
    setWaivers(next);
    saveJson(PERSIST_KEYS.waivers, next);
  }
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const project = projects[0];
  const vendor = SAMPLE_VENDORS[0];

  const draftPreview = useMemo(() => {
    const w = waivers.find((x) => x.id === selectedId);
    if (!w || !project || !vendor) return "";
    return draftLienWaiverText({
      waiver: w,
      vendor,
      projectName: project.name,
      projectAddress: project.address,
    });
  }, [waivers, selectedId, project, vendor]);

  function generateFromDraw() {
    if (!project || !vendor) return;
    const draw = draws.find((d) => d.projectId === project.id) ?? draws[0];
    const type: LienWaiverType = suggestWaiverForDraw(draw?.pct ?? 50, false);
    const w: LienWaiver = {
      id: `lw-${Date.now()}`,
      projectId: project.id,
      vendorId: vendor.id,
      type,
      amount: draw?.amount ?? 25_000,
      throughDate: new Date().toISOString().slice(0, 10),
      status: "draft",
      drawId: draw?.id,
      createdAt: new Date().toISOString(),
    };
    persistWaivers([w, ...waivers]);
    setSelectedId(w.id);
  }

  function setStatus(id: string, status: LienWaiver["status"]) {
    persistWaivers(waivers.map((w) => (w.id === id ? { ...w, status } : w)));
  }

  return (
    <div>
      <PageHeader
        title="Lien waivers"
        description="Generate conditional / unconditional progress and final waivers tied to draws. Counsel review before use."
        actions={
          <Button size="sm" onClick={generateFromDraw}>
            Draft from latest draw
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border">
          {waivers.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-fg-muted">
              No waivers yet. Draft one from a progress draw to collect signatures before payment release.
            </p>
          ) : (
            waivers.map((w) => {
              const v = SAMPLE_VENDORS.find((x) => x.id === w.vendorId);
              const p = projects.find((x) => x.id === w.projectId);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedId(w.id)}
                  className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left last:border-0 ${
                    selectedId === w.id ? "bg-bg-subtle" : "hover:bg-bg-elevated"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium">{waiverTypeLabel(w.type)}</span>
                    <Badge variant={w.status === "signed" ? "success" : w.status === "sent" ? "warning" : "secondary"}>
                      {w.status}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-fg-muted">
                    {v?.company} · {p?.name} · ${w.amount.toLocaleString()} through {w.throughDate}
                  </p>
                </button>
              );
            })
          )}
        </div>
        <div className="border border-border bg-bg-elevated p-4">
          {selectedId && draftPreview ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus(selectedId, "sent")}>
                  Mark sent
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(selectedId, "signed")}>
                  Mark signed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard?.writeText(draftPreview);
                  }}
                >
                  Copy text
                </Button>
              </div>
              <p className="mb-2 text-[11px] leading-relaxed text-fg-subtle">{LEGAL_DRAFT_DISCLAIMER}</p>
              <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-fg-muted">
                {draftPreview}
              </pre>
            </>
          ) : (
            <p className="py-8 text-center text-[13px] text-fg-muted">Select a waiver to preview the draft text.</p>
          )}
        </div>
      </div>
    </div>
  );
}
