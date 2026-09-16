import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PlotPlanGisOverlay } from "@/components/permits/plot-plan-gis-overlay";
import { SitePlanAerialOverlay } from "@/components/permits/site-plan-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/data/store";
import {
  defaultImprovements,
  getLot,
  JEFFERSON_GIS,
  parseLot,
  resolveLotNumber,
  sitePlanNarrative,
  TETON_HEIGHTS_CENTER,
  TETON_HEIGHTS_LOTS,
} from "@/data/teton-heights-gis";
import { PARCEL_SERVICE } from "@/lib/county-parcels";
import {
  HOLWEGE_LEGAL,
  HOLWEGE_LOT_NUMBER,
  HOLWEGE_PLAN_SET_LABEL,
  HOLWEGE_PLOT_PLAN_IMAGE_URL,
  HOLWEGE_PLOT_PLAN_PDF_URL,
  HOLWEGE_PROJECT_ID,
  HOLWEGE_SEED_ADDRESS,
} from "@/lib/holwege-site";
import { formatCurrency } from "@/lib/utils";

type Search = { lot?: string; project?: string };

export const Route = createFileRoute("/app/site-plan")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    lot: typeof search.lot === "string" ? search.lot : undefined,
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  component: SitePlanPage,
});

function SitePlanPage() {
  const search = Route.useSearch();
  const projects = useAppStore((s) => s.projects);
  const tetonLots = useAppStore((s) => s.tetonLots);

  const projectKey = search.project ?? HOLWEGE_PROJECT_ID;
  const job =
    projects.find((p) => p.id === search.project) ??
    projects.find((p) => p.id === HOLWEGE_PROJECT_ID);

  const lotNumber =
    parseLot(search.lot) ??
    resolveLotNumber({
      projectId: job?.id ?? projectKey,
      address: job?.address ?? HOLWEGE_SEED_ADDRESS,
      name: job?.name ?? "Holwege",
    }) ??
    HOLWEGE_LOT_NUMBER;

  const lot =
    getLot(lotNumber) ??
    TETON_HEIGHTS_LOTS.find((l) => l.lotNumber === HOLWEGE_LOT_NUMBER)!;
  const imp = useMemo(() => defaultImprovements(lot), [lot]);

  const inventory = tetonLots.find((l) => Number(l.lot) === lotNumber);
  const lotLinkRe = new RegExp(`lot\\s*#?\\s*${lotNumber}\\b`, "i");
  const linkedJob = projects.find(
    (p) => p.id === lot.projectId || lotLinkRe.test(`${p.address} ${p.name}`),
  );

  const isHolwege =
    lotNumber === HOLWEGE_LOT_NUMBER ||
    projectKey === HOLWEGE_PROJECT_ID ||
    job?.id === HOLWEGE_PROJECT_ID;

  return (
    <div className="max-w-full overflow-x-clip">
      <PageHeader
        title="Site plan layout"
        description={
          isHolwege
            ? "Holwege Lot 16: River Bend plot plan (P-8) over Jefferson County GIS aerial. Not an invented schematic."
            : "Aerial imagery, Jefferson County parcel polygons, and Teton Heights plat overlay. Confirm recorded plat before filing."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link to="/app/estimator" search={{ lot: String(lotNumber) }}>
                <Calculator className="h-3.5 w-3.5" strokeWidth={1.75} />
                Price this lot
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link
                to="/app/design"
                search={{ project: isHolwege ? HOLWEGE_PROJECT_ID : projectKey }}
              >
                Design Center
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link
                to="/app/permits"
                search={job ? { project: job.id } : { project: HOLWEGE_PROJECT_ID }}
              >
                Permit package
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-fg-muted">
        <Badge variant="secondary">County GIS</Badge>
        {isHolwege ? (
          <Badge variant="outline">River Bend P-8</Badge>
        ) : (
          <Badge variant="outline">Plat overlay</Badge>
        )}
        <span>
          {isHolwege
            ? HOLWEGE_LEGAL
            : `${TETON_HEIGHTS_CENTER.streetRef} · Lot ${lot.lotNumber} · ${lot.acres} ac`}
        </span>
      </div>

      {isHolwege ? (
        <PlotPlanGisOverlay
          projectId={job?.id ?? HOLWEGE_PROJECT_ID}
          projectName={job?.name ?? linkedJob?.name ?? "Holwege Residence — Lot 16"}
          lotNumber={HOLWEGE_LOT_NUMBER}
          plotPlanImageUrl={HOLWEGE_PLOT_PLAN_IMAGE_URL}
          plotPlanPdfUrl={HOLWEGE_PLOT_PLAN_PDF_URL}
        />
      ) : (
        <SitePlanAerialOverlay
          projectId={job?.id ?? lot.projectId}
          projectName={job?.name ?? linkedJob?.name ?? `Teton Heights Lot ${lot.lotNumber}`}
          address={job?.address ?? inventory?.notes ?? TETON_HEIGHTS_CENTER.streetRef}
          lotNumber={lotNumber}
        />
      )}

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
            {isHolwege ? (
              <p className="text-[12px] text-fg-muted">
                {HOLWEGE_PLAN_SET_LABEL}. Legal: {HOLWEGE_LEGAL}. Land closed separately — not build
                budget. No county APN in SoR.
              </p>
            ) : inventory ? (
              <>
                <div className="flex justify-between gap-3">
                  <span className="text-fg-muted">List (ops demo)</span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(inventory.listPrice)}
                  </span>
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
            <CardTitle>{isHolwege ? "Plot plan source" : "Improvement plan"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[12px] text-fg-muted">
            {isHolwege ? (
              <>
                <p>
                  Authoritative sheet is River Bend{" "}
                  <span className="font-medium text-fg">PLOT PLAN / P-8</span> from the Holwege plan
                  set (9-14-2026). GIS aerial is underlaid for location context — use the opacity
                  slider on the map.
                </p>
                <p>
                  Do not use invented schematic footprints for permitting. Confirm bearings and pins
                  on the recorded plat with a PLS before staking.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href={HOLWEGE_PLOT_PLAN_PDF_URL} target="_blank" rel="noopener noreferrer">
                    Download P-8 PDF <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </>
            ) : (
              <>
                <p>
                  Building footprint, driveway, setbacks, well marker, septic tank, and drainfield
                  envelope are generated from the plat schematic for Lot {lot.lotNumber}.
                </p>
                <p>
                  Well plan-ft ({imp.well[0].toFixed(0)}, {imp.well[1].toFixed(0)}) · septic tank (
                  {imp.septicTank[0].toFixed(0)}, {imp.septicTank[1].toFixed(0)}).
                </p>
                <p>Spot grades illustrative only (~4790–4792). Confirm with engineer / recorded plat.</p>
              </>
            )}
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
              href={PARCEL_SERVICE.fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Bundled Teton Heights parcels <ExternalLink className="h-3 w-3" />
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
            {isHolwege
              ? [
                  "HOLWEGE — TETON HEIGHTS DIV. 6 · BLOCK 8 · LOT 16",
                  HOLWEGE_LEGAL,
                  HOLWEGE_PLAN_SET_LABEL,
                  "Site reference: River Bend sheet P-8 (PLOT PLAN) + Jefferson County GIS aerial.",
                  "No county APN/GIS PIN in system of record — do not invent.",
                  "Confirm recorded plat and hire PLS before staking well/septic/building.",
                ].join("\n")
              : sitePlanNarrative(lot, job?.name ?? linkedJob?.name)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
