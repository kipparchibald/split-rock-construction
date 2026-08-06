import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { NextActionBanner, type NextAction } from "@/components/layout/next-action-banner";
import { SitePlanAerialOverlay } from "@/components/permits/site-plan-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import type { PermitChecklistItem } from "@/data/types";
import { LEGAL_DRAFT_DISCLAIMER } from "@/lib/company";
import {
  CORE_PERMIT_KEYS,
  corePermitProgress,
  isCorePermitKey,
  nextPermitAction,
  permitActionLabel,
  permitProgress,
  permitStatusVariant,
} from "@/lib/permits-idaho";
import { getLot, resolveLotNumber, sitePlanNarrative } from "@/data/teton-heights-gis";

export const Route = createFileRoute("/app/permits")({
  validateSearch: (search: Record<string, unknown>): { project?: string } => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  component: PermitsPage,
});

function PermitsPage() {
  const { project: searchProject } = Route.useSearch();
  const {
    projects,
    permitPackages,
    ensurePermitPackage,
    advancePermitItem,
    generatePermitDraft,
    setPermitItemStatus,
    mockFileCorePermits,
  } = useAppStore();

  const residential = projects.filter((p) => p.type === "residential");

  useEffect(() => {
    for (const p of residential) {
      ensurePermitPackage(p.id);
    }
  }, [residential, ensurePermitPackage]);

  const packages = permitPackages;

  const defaultPkgId = useMemo(() => {
    if (searchProject) {
      const hit = packages.find((p) => p.projectId === searchProject);
      if (hit) return hit.id;
    }
    const incomplete = packages.find((p) => p.status !== "approved");
    return incomplete?.id ?? packages[0]?.id ?? "";
  }, [packages, searchProject]);

  const [activePkg, setActivePkg] = useState(defaultPkgId);
  useEffect(() => {
    if (defaultPkgId && defaultPkgId !== activePkg) setActivePkg(defaultPkgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPkgId]);

  const pkg = packages.find((p) => p.id === activePkg) ?? packages[0];
  const job = pkg ? projects.find((x) => x.id === pkg.projectId) : undefined;
  const [activeItem, setActiveItem] = useState<string | null>(pkg?.items[0]?.key ?? null);

  useEffect(() => {
    if (pkg && !pkg.items.some((i) => i.key === activeItem)) {
      setActiveItem(pkg.items[0]?.key ?? null);
    }
  }, [pkg, activeItem]);

  const item = pkg?.items.find((i) => i.key === activeItem);
  const progress = pkg ? permitProgress(pkg.items) : { done: 0, total: 0, pct: 0 };
  const core = pkg ? corePermitProgress(pkg.items) : { done: 0, total: 3, pct: 0, items: [] };
  const next = pkg ? nextPermitAction(pkg.items) : undefined;
  const coreClear = core.done === core.total && core.total > 0;
  const showAerial = activeItem === "jc_site_plan" || activeItem === "eiph_septic";

  const lotNum = resolveLotNumber({
    projectId: job?.id,
    address: job?.address,
    name: job?.name,
  });
  const lot = lotNum ? getLot(lotNum) : undefined;

  const nextBanner: NextAction = useMemo(() => {
    for (const p of packages) {
      const n = nextPermitAction(p.items);
      if (!n) continue;
      const j = projects.find((x) => x.id === p.projectId);
      return {
        severity: n.status === "denied" || n.status === "ready_review" ? "high" : "med",
        title: `${permitActionLabel(n)} · ${n.label}`,
        detail: `${j?.name ?? p.title} · ${n.authority.replace(/_/g, " ")}`,
        to: "/app/permits",
        search: { project: p.projectId },
        cta: "Open package",
      };
    }
    return {
      severity: "clear",
      title: "Permit packages clear",
      detail: "All residential items approved — or no residential jobs yet.",
    };
  }, [packages, projects]);

  function selectPackage(id: string) {
    setActivePkg(id);
    const p = packages.find((x) => x.id === id);
    const n = p ? nextPermitAction(p.items) : undefined;
    setActiveItem(n?.key ?? p?.items[0]?.key ?? null);
  }

  function runMockCore() {
    if (!pkg) return;
    mockFileCorePermits(pkg.id);
    setActiveItem("jc_site_plan");
  }

  function fillSitePlanWithGis() {
    if (!pkg || !job) return;
    generatePermitDraft(pkg.id, "jc_site_plan");
    // After store update, patch draft with GIS narrative via generate then we also set via draftText in store on next - better: call generate and set status with narrative in generatePermitDraft already... 
    // Enhance by advancing with custom text: use setPermit via generate only - we'll enhance generate for site plan in store.
    // For now append via a second path: select item and generate already rebuilds draft.
    setActiveItem("jc_site_plan");
  }

  const draftPreview =
    item?.key === "jc_site_plan" && lot
      ? [item.draftText, "", sitePlanNarrative(lot, job?.name)].filter(Boolean).join("\n\n")
      : item?.draftText;

  return (
    <div className="max-w-full overflow-x-clip">
      <PageHeader
        title="Permits & health sign-off"
        description="Jefferson County Building + EIPH. Site plans: aerial GIS, parcels, and improvement overlay — full-screen friendly on phone."
      />

      <NextActionBanner action={nextBanner} className="mb-4" />

      <p className="mb-4 text-[11px] leading-relaxed text-fg-subtle">
        Workflow: draft → ready → submitted → approved. Open{" "}
        <strong className="text-fg-muted">site plan</strong> for aerial + county parcels. Confirm on
        Jefferson County GIS before real filing.
      </p>

      {/* Mobile: horizontal package chips; desktop: sidebar */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="min-w-0 lg:space-y-3">
          {packages.length === 0 ? (
            <p className="border border-border bg-bg-elevated p-4 text-[13px] text-fg-muted">
              No residential jobs yet. Start from Book of Plans or add a residential project.
            </p>
          ) : (
            <div
              className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
              data-testid="permit-package-list"
            >
              {packages.map((p) => {
                const j = projects.find((x) => x.id === p.projectId);
                const prog = permitProgress(p.items);
                const selected = (pkg?.id ?? activePkg) === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPackage(p.id)}
                    className={`min-h-14 min-w-[11rem] shrink-0 border border-border p-3 text-left lg:min-w-0 lg:w-full ${
                      selected ? "bg-primary text-primary-fg" : "bg-bg-elevated hover:bg-bg-subtle"
                    }`}
                  >
                    <p className="text-[13px] font-medium">{j?.name ?? p.title}</p>
                    <p
                      className={`mt-1 text-[11px] ${selected ? "text-primary-fg/70" : "text-fg-muted"}`}
                    >
                      {prog.done}/{prog.total} cleared · {p.status.replace(/_/g, " ")}
                    </p>
                    <Progress value={prog.pct} className={`mt-2 ${selected ? "opacity-90" : ""}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {pkg ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-bg-elevated px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium">{job?.name ?? pkg.title}</p>
                  <p className="text-[11px] text-fg-subtle">
                    {progress.done}/{progress.total} approved · package {pkg.status.replace(/_/g, " ")}
                    {lotNum ? ` · Teton Heights Lot ${lotNum}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="min-h-10" asChild>
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: pkg.projectId }}
                      search={{ tab: "docs" }}
                    >
                      Job docs
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10"
                    onClick={() => {
                      setActiveItem("jc_site_plan");
                      fillSitePlanWithGis();
                    }}
                  >
                    Open site plan GIS
                  </Button>
                  <Button size="sm" className="min-h-10" onClick={runMockCore} disabled={coreClear}>
                    {coreClear ? "Core three filed" : "Mock file core three"}
                  </Button>
                  {next ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-10"
                      onClick={() => {
                        setActiveItem(next.key);
                        if (next.status === "not_started") generatePermitDraft(pkg.id, next.key);
                        else advancePermitItem(pkg.id, next.key);
                      }}
                    >
                      {permitActionLabel(next)}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="border border-border p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="label-caps">Core mock path</p>
                    <p className="mt-1 text-[12px] text-fg-muted">
                      Building permit · Site plan · EIPH septic — {core.done}/{core.total} approved
                    </p>
                  </div>
                  <Badge variant={coreClear ? "success" : "warning"}>
                    {coreClear ? "Core clear" : "In progress"}
                  </Badge>
                </div>
                <Progress value={core.pct} className="mb-3" />
                <div className="grid gap-2 sm:grid-cols-3">
                  {CORE_PERMIT_KEYS.map((key) => {
                    const it = pkg.items.find((i) => i.key === key);
                    if (!it) return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveItem(key)}
                        className={`min-h-16 border border-border p-3 text-left ${
                          activeItem === key ? "bg-bg-subtle" : "bg-bg-elevated hover:bg-bg-subtle"
                        }`}
                      >
                        <p className="text-[12px] font-medium leading-snug">{it.label}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={permitStatusVariant(it.status)}>
                            {it.status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[10px] uppercase tracking-[0.06em] text-fg-subtle">
                            {it.formCode}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {showAerial && job ? (
                <SitePlanAerialOverlay
                  projectId={job.id}
                  projectName={job.name}
                  address={job.address}
                  lotNumber={lotNum}
                />
              ) : null}

              <div className="border border-border">
                {pkg.items.map((i: PermitChecklistItem) => (
                  <div
                    key={i.key}
                    className={`flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-0 ${
                      activeItem === i.key ? "bg-bg-subtle" : ""
                    }`}
                  >
                    <button type="button" className="min-w-0 text-left" onClick={() => setActiveItem(i.key)}>
                      <p className="text-[13px] font-medium">
                        {i.label}
                        {isCorePermitKey(i.key) ? (
                          <span className="ml-1.5 text-[10px] font-normal uppercase tracking-[0.08em] text-fg-subtle">
                            core
                          </span>
                        ) : null}
                        {i.key === "jc_site_plan" ? (
                          <span className="ml-1.5 text-[10px] font-normal uppercase tracking-[0.08em] text-fg-subtle">
                            + GIS
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
                        {i.authority.replace(/_/g, " ")}
                        {i.formCode ? ` · ${i.formCode}` : ""}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={permitStatusVariant(i.status)}>{i.status.replace(/_/g, " ")}</Badge>
                      {i.status !== "approved" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-10"
                            onClick={() => generatePermitDraft(pkg.id, i.key)}
                          >
                            Fill draft
                          </Button>
                          <Button
                            size="sm"
                            className="min-h-10"
                            onClick={() => {
                              setActiveItem(i.key);
                              if (i.status === "not_started") generatePermitDraft(pkg.id, i.key);
                              else advancePermitItem(pkg.id, i.key);
                            }}
                          >
                            {permitActionLabel(i)}
                          </Button>
                        </>
                      ) : null}
                      {i.status === "submitted" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-10"
                          onClick={() => setPermitItemStatus(pkg.id, i.key, "denied")}
                        >
                          Denied
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-border bg-bg-elevated p-4">
                <p className="label-caps mb-2">Draft preview</p>
                {draftPreview ? (
                  <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-fg-muted">
                    {draftPreview}
                  </pre>
                ) : (
                  <p className="text-[13px] text-fg-muted">
                    Select site plan and open GIS overlay, or Fill draft for form text.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-fg-muted">No residential jobs to package yet.</p>
          )}
          <p className="border border-border bg-bg-elevated p-3 text-[11px] leading-relaxed text-fg-subtle">
            {LEGAL_DRAFT_DISCLAIMER} Aerial basemap is Esri World Imagery. Improvement-plan geometry is
            schematic for Teton Heights operations — not a recorded survey. Authoritative parcels:{" "}
            <a
              href="https://gisportal.co.jefferson.id.us/portweb/home/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              Jefferson County GIS
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
