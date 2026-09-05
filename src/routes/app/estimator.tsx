import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/data/store";
import { TETON_HEIGHTS_LOTS } from "@/data/teton-heights-gis";
import { draftGisEstimate, GIS_ESTIMATOR_EXAMPLES, type GisEstimate } from "@/lib/gis-estimator";
import { loadClosedJobs } from "@/lib/estimate-history";
import { calcPrice } from "@/lib/pricing";
import { LIMITS, clampText } from "@/lib/security";
import { estimateToBidLineItems } from "@/lib/start-from-bid";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type Search = { lot?: string; brief?: string };

export const Route = createFileRoute("/app/estimator")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    lot: typeof search.lot === "string" ? search.lot : undefined,
    brief: typeof search.brief === "string" ? search.brief : undefined,
  }),
  component: EstimatorPage,
});

function parseLotParam(raw?: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null;
}

function EstimatorPage() {
  const search = Route.useSearch();
  const clients = useAppStore((s) => s.clients);
  const addBid = useAppStore((s) => s.addBid);

  const [brief, setBrief] = useState(search.brief ?? "");
  const [lotNumber, setLotNumber] = useState<number | null>(parseLotParam(search.lot) ?? 7);
  const [includeLand, setIncludeLand] = useState(true);
  const [includeSite, setIncludeSite] = useState(false);
  const [result, setResult] = useState<GisEstimate | null>(null);
  const [bidClientId, setBidClientId] = useState(clients[0]?.id ?? "");

  const closedCount = useMemo(() => loadClosedJobs().length, []);

  function run() {
    const text = clampText(brief.trim() || GIS_ESTIMATOR_EXAMPLES[0], LIMITS.estimateBrief);
    if (!brief.trim()) setBrief(text);
    const next = draftGisEstimate({
      brief: text,
      lotNumber,
      includeLand,
      includeSiteAllowances: includeSite,
      closedJobs: loadClosedJobs(),
    });
    setResult(next);
  }

  function sendToBidBoard() {
    if (!result) return;
    const price = calcPrice(result.costs, result.draft.assumptions, result.draft.sqft);
    const lotLabel = result.lot ? `Lot ${result.lot.lotNumber}` : "unspecified lot";
    addBid({
      title: `AI draft — ${result.draft.sqft} sf ${result.draft.parsed.kind} · ${lotLabel}`,
      clientId: bidClientId || clients[0]?.id || "c2",
      type: result.draft.parsed.kind === "commercial" ? "commercial" : "residential",
      status: "draft",
      amount: result.contractPrice,
      notes: result.gisNotes.join(" | "),
      lineItems: estimateToBidLineItems(result.costs, price),
    });
    toast.success("Draft sent to Bid board — review before presenting.");
  }

  return (
    <div>
      <PageHeader
        title="AI estimator"
        description="Offline draft engine plus Teton Heights plat / GIS context. Seeds costs from the brief, scales site work to the lot, and lists well, septic, and easement constraints. Not a bid."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/app/site-plan"
              search={lotNumber ? { lot: String(lotNumber) } : undefined}
            >
              <MapPinned className="h-3.5 w-3.5" strokeWidth={1.75} />
              Open site plan
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              Job brief
            </CardTitle>
            <p className="text-[12px] leading-relaxed text-fg-muted">
              Runs locally — rules + closed-job history. Pick a plat lot to lock GIS constraints.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="ai-brief">Describe the build</Label>
              <Textarea
                id="ai-brief"
                className="mt-1"
                rows={4}
                maxLength={LIMITS.estimateBrief}
                placeholder="e.g. 1600 sf ranch + basement, 3-car, Teton Heights spec"
                value={brief}
                onChange={(e) => setBrief(e.target.value.slice(0, LIMITS.estimateBrief))}
              />
              <p className="mt-1 text-[11px] text-fg-subtle">
                {brief.length}/{LIMITS.estimateBrief}
              </p>
            </div>

            <div>
              <p className="label-caps mb-1.5">Teton Heights plat lot</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={`min-h-10 border px-2.5 text-[12px] ${
                    lotNumber == null ? "border-primary bg-primary text-primary-fg" : "border-border"
                  }`}
                  onClick={() => setLotNumber(null)}
                >
                  None
                </button>
                {TETON_HEIGHTS_LOTS.map((l) => (
                  <button
                    key={l.lotNumber}
                    type="button"
                    className={`min-h-10 min-w-10 border px-2 text-[12px] font-medium ${
                      lotNumber === l.lotNumber
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-bg text-fg-muted"
                    }`}
                    onClick={() => setLotNumber(l.lotNumber)}
                  >
                    {l.lotNumber}
                    {l.projectId ? "*" : ""}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-h-11 items-start gap-2 text-[13px] text-fg-muted">
              <input
                type="checkbox"
                className="mt-1"
                checked={includeLand}
                onChange={(e) => setIncludeLand(e.target.checked)}
              />
              <span>Include lot land at base list ({formatCurrency(99500)})</span>
            </label>
            <label className="flex min-h-11 items-start gap-2 text-[13px] text-fg-muted">
              <input
                type="checkbox"
                className="mt-1"
                checked={includeSite}
                onChange={(e) => setIncludeSite(e.target.checked)}
              />
              <span>Roll well / septic / driveway allowances into the draft</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {GIS_ESTIMATOR_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setBrief(ex)}
                  className="border border-border bg-bg px-2.5 py-1.5 text-left text-[11px] text-fg-muted hover:text-fg"
                >
                  {ex}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={run} data-testid="ai-estimator-run">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                Generate GIS draft
              </Button>
              <Badge variant="secondary" className="gap-1 font-normal">
                <History className="h-3 w-3" strokeWidth={1.75} />
                {closedCount} closed job{closedCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline" className="font-normal">
                Offline
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Draft result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-[13px] text-fg-muted">
                Generate a draft to see contract seed, plat constraints, and site allowances.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-border bg-bg p-3">
                    <p className="label-caps">Draft contract</p>
                    <p className="mt-1 text-lg font-medium tabular-nums">
                      {formatCurrency(result.contractPrice)}
                    </p>
                    {result.costPerSqft ? (
                      <p className="mt-0.5 text-[11px] text-fg-subtle">
                        {formatCurrency(result.costPerSqft)} / sf
                      </p>
                    ) : null}
                  </div>
                  <div className="border border-border bg-bg p-3">
                    <p className="label-caps">All-in w/ site allowances</p>
                    <p className="mt-1 text-lg font-medium tabular-nums">
                      {formatCurrency(result.allInWithSite)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-fg-subtle">
                      Well + septic + driveway
                      {result.siteAllowances.includedInContract ? " included" : " shown separately"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{result.draft.parsed.kind}</Badge>
                  <Badge variant="outline">{result.draft.sqft.toLocaleString()} sf</Badge>
                  {result.lot ? (
                    <Badge variant="outline">
                      Lot {result.lot.lotNumber} · {result.lot.acres} ac
                    </Badge>
                  ) : (
                    <Badge variant="outline">No plat lot</Badge>
                  )}
                  <Badge
                    variant={result.draft.confidence >= 0.55 ? "success" : "secondary"}
                    className="tabular-nums"
                  >
                    Confidence {Math.round(result.draft.confidence * 100)}%
                  </Badge>
                </div>

                <div className="border border-border bg-bg p-3">
                  <p className="label-caps flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" strokeWidth={1.75} />
                    Disclaimer
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
                    {result.draft.disclaimer}
                  </p>
                </div>

                <div>
                  <p className="label-caps mb-2">Cost buckets</p>
                  <ul className="space-y-1 text-[12px] text-fg-muted">
                    {(
                      [
                        ["Land", result.costs.land],
                        ["Site work", result.costs.siteWork],
                        ["Foundation", result.costs.foundation],
                        ["Structure", result.costs.structure],
                        ["MEP", result.costs.mep],
                        ["Finishes", result.costs.finishes],
                        ["Landscaping", result.costs.landscaping],
                        ["Permits", result.costs.permitsFees],
                        ["Other", result.costs.other],
                      ] as const
                    ).map(([label, amt]) => (
                      <li key={label} className="flex justify-between gap-3">
                        <span>{label}</span>
                        <span className="tabular-nums text-fg">{formatCurrency(amt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[10rem] flex-1">
                    <Label>Bid board client</Label>
                    <select
                      className="mt-1 h-10 w-full border border-border bg-bg px-2 text-[13px]"
                      value={bidClientId}
                      onChange={(e) => setBidClientId(e.target.value)}
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="button" variant="outline" onClick={sendToBidBoard}>
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Send to Bid board
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {result ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Plat / GIS constraints</CardTitle>
            </CardHeader>
            <CardContent>
              {result.platConstraints.length ? (
                <ul className="space-y-2 text-[12px] text-fg-muted">
                  {result.platConstraints.map((c) => (
                    <li key={c.id}>
                      <p className="font-medium text-fg">{c.label}</p>
                      <p className="mt-0.5">{c.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-fg-muted">Select a plat lot to load constraints.</p>
              )}
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link
                  to="/app/site-plan"
                  search={result.lotNumber ? { lot: String(result.lotNumber) } : undefined}
                >
                  View overlay
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assumptions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-[12px] text-fg-muted">
                {result.draft.assumptionsList.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>GIS notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-[12px] text-fg-muted">
                {result.gisNotes.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
              <a
                href={result.countyPortal}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-[12px] text-fg-muted underline-offset-2 hover:underline"
              >
                Jefferson County GIS portal
              </a>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
