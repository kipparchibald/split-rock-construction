import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SitePlanAerialOverlay } from "@/components/permits/site-plan-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/data/store";
import {
  defaultImprovements,
  getLot,
  JEFFERSON_GIS,
  sitePlanNarrative,
  TETON_HEIGHTS_CENTER,
  TETON_HEIGHTS_LOTS,
} from "@/data/teton-heights-gis";
import { PARCEL_SERVICE } from "@/lib/county-parcels";
import { formatCurrency } from "@/lib/utils";

type Search = { lot?: string; project?: string };

export const Route = createFileRoute("/app/site-plan")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    lot: typeof search.lot === "string" ? search.lot : undefined,
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  component: SitePlanPage,
});

function parseLot(raw?: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : 7;
}

function SitePlanPage() {
  const search = Route.useSearch();
  const projects = useAppStore((s) => s.projects);
  const tetonLots = useAppStore((s) => s.tetonLots);

  const job = projects.find((p) => p.id === search.project);
  const lotNumber = parseLot(search.lot);
  const lot = getLot(lotNumber) ?? TETON_HEIGHTS_LOTS[6]!;
  const imp = useMemo(() => defaultImprovements(lot), [lot]);

  const inventory = tetonLots.find((l) => Number(l.lot) === lotNumber);
  const linkedJob = projects.find(
    (p) => p.id === lot.projectId || /lot\s*#?\s*7/i.test(`${p.address} ${p.name}`),
  );

  return (
    <div className="max-w-full overflow-x-clip">
      <PageHeader
        title="Site plan layout"
        description="Aerial imagery, Jefferson County parcel polygons, and Teton Heights plat / improvement-plan overlay. Schematic for field and estimating — confirm recorded plat before filing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link to="/app/estimator" search={{ lot: String(lotNumber) }}>
                <Calculator className="h-3.5 w-3.5" strokeWidth={1.75} />
                Price this lot
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/permits" search={job ? { project: job.id } : undefined}>
                Permit package
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-fg-muted">
        <Badge variant="secondary">County GIS</Badge>
        <Badge variant="outline">Plat overlay</Badge>
        <span>
          {TETON_HEIGHTS_CENTER.streetRef} · Lot {lot.lotNumber} · {lot.acres} ac
        </span>
      </div>

      <SitePlanAerialOverlay
        projectId={job?.id ?? lot.projectId}
        projectName={job?.name ?? linkedJob?.name ?? `Teton Heights Lot ${lot.lotNumber}`}
        address={job?.address ?? inventory?.notes ?? TETON_HEIGHTS_CENTER.streetRef}
        lotNumber={lotNumber}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Lot snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-3">
              <span className="text-fg-muted">Plat lot</span>
              <span className="font-medium">{lot.label}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-fg-muted">Acres</span>
              <span className="tabular-nums font-medium">{lot.acres}</span>
            </div>
            {inventory ? (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-fg-muted">List (ops demo)</span>
                  <span className="tabular-nums font-medium">{formatCurrency(inventory.listPrice)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-fg-muted">Status</span>
                  <span className="capitalize">{inventory.status.replace(/_/g, " ")}</span>
                </div>
              </>
            ) : (
              <p className="text-[12px] text-fg-subtle">
                Schematic plat lot — match to Twin Forks inventory before quoting a list price.
              </p>
            )}
            {lot.notes ? <p className="text-[12px] text-fg-muted">{lot.notes}</p> : null}
            {linkedJob ? (
              <Button size="sm" variant="outline" className="mt-2" asChild>
                <Link to="/app/projects/$projectId" params={{ projectId: linkedJob.id }}>
                  Open {linkedJob.name}
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improvement plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-fg-muted">
            <p>
              Building footprint, driveway, setbacks, well marker, septic tank, and drainfield
              envelope are generated from the plat schematic for Lot {lot.lotNumber}.
            </p>
            <p>
              Well plan-ft ({imp.well[0].toFixed(0)}, {imp.well[1].toFixed(0)}) · septic tank (
              {imp.septicTank[0].toFixed(0)}, {imp.septicTank[1].toFixed(0)}).
            </p>
            <p>Spot grades illustrative only (~4790–4792). Confirm with engineer / recorded plat.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authoritative sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-fg-muted">
            <a
              className="flex items-center gap-1 underline-offset-2 hover:underline"
              href={JEFFERSON_GIS.portal}
              target="_blank"
              rel="noopener noreferrer"
            >
              Jefferson County GIS portal <ExternalLink className="h-3 w-3" />
            </a>
            <a
              className="flex items-center gap-1 underline-offset-2 hover:underline"
              href={JEFFERSON_GIS.countyPage}
              target="_blank"
              rel="noopener noreferrer"
            >
              County GIS program page <ExternalLink className="h-3 w-3" />
            </a>
            <a
              className="flex items-center gap-1 underline-offset-2 hover:underline"
              href={PARCEL_SERVICE.assessor}
              target="_blank"
              rel="noopener noreferrer"
            >
              Jefferson County Assessor <ExternalLink className="h-3 w-3" />
            </a>
            <p className="pt-1 text-[11px] text-fg-subtle">{PARCEL_SERVICE.attribution}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Permit narrative</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-fg-muted">
            {sitePlanNarrative(lot, job?.name ?? linkedJob?.name)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
