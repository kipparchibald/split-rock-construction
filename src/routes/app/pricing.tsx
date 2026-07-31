import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, AlertTriangle, CheckCircle2, History } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CONTRACT_GUIDANCE,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_COSTS,
  JOB_OVERHEAD_PRESETS,
  PAYMENT_PATH_GUIDANCE,
  applyJobPreset,
  buildDrawSchedule,
  calcBuilderFinance,
  calcPrice,
  matchJobPreset,
  type CostInputs,
  type JobPresetId,
  type PricingAssumptions,
} from "@/lib/pricing";
import {
  DRAFT_EXAMPLES,
  draftEstimateFromText,
  type EstimateDraft,
} from "@/lib/estimate-draft";
import { loadClosedJobs } from "@/lib/estimate-history";
import { LIMITS, clampText } from "@/lib/security";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/data/store";
import { toast } from "sonner";

export const Route = createFileRoute("/app/pricing")({ component: PricingPage });

const COST_FIELDS: { key: keyof CostInputs; label: string }[] = [
  { key: "siteWork", label: "Site work" },
  { key: "foundation", label: "Foundation" },
  { key: "structure", label: "Structure & envelope" },
  { key: "mep", label: "MEP" },
  { key: "finishes", label: "Finishes" },
  { key: "landscaping", label: "Landscaping" },
  { key: "permitsFees", label: "Permits & fees" },
  { key: "other", label: "Other" },
  { key: "land", label: "Land (if included)" },
];

function PricingPage() {
  const [costs, setCosts] = useState<CostInputs>(DEFAULT_COSTS);
  const [assumptions, setAssumptions] = useState<PricingAssumptions>(DEFAULT_ASSUMPTIONS);
  const [sqft, setSqft] = useState(2400);
  const [months, setMonths] = useState(10);
  const [rate, setRate] = useState(9.5);
  const [ltc, setLtc] = useState(80);
  const [holding, setHolding] = useState(1200);
  const [salePrice, setSalePrice] = useState(0);
  const [sellingPct, setSellingPct] = useState(6);

  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [draftApplied, setDraftApplied] = useState(false);
  const [closedCount, setClosedCount] = useState(0);
  const [seedProjectId, setSeedProjectId] = useState("p6");
  const projects = useAppStore((s) => s.projects);
  const seedBudgetFromEstimate = useAppStore((s) => s.seedBudgetFromEstimate);

  useEffect(() => {
    setClosedCount(loadClosedJobs().length);
  }, []);

  const activePreset = useMemo(() => matchJobPreset(assumptions), [assumptions]);
  const activePresetMeta = activePreset
    ? JOB_OVERHEAD_PRESETS.find((p) => p.id === activePreset)
    : null;

  const price = useMemo(() => calcPrice(costs, assumptions, sqft), [costs, assumptions, sqft]);
  const draws = useMemo(() => buildDrawSchedule(price.contractPrice), [price.contractPrice]);
  const sale = salePrice || Math.round(price.contractPrice * 1.12);
  const finance = useMemo(
    () =>
      calcBuilderFinance(price.contractPrice, {
        months,
        interestRatePct: rate,
        ltcPct: ltc,
        holdingMonthly: holding,
        salePrice: sale,
        sellingCostPct: sellingPct,
      }),
    [price.contractPrice, months, rate, ltc, holding, sale, sellingPct],
  );

  function setCost(key: keyof CostInputs, v: string) {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    setCosts((c) => ({ ...c, [key]: Number.isFinite(n) && n >= 0 ? n : 0 }));
  }

  function selectPreset(id: JobPresetId) {
    setAssumptions((current) => applyJobPreset(id, current));
  }

  function runDraft() {
    const text = clampText(brief.trim() || DRAFT_EXAMPLES[0], LIMITS.estimateBrief);
    if (!brief.trim()) setBrief(text);
    const result = draftEstimateFromText(text);
    setDraft(result);
    setDraftApplied(false);
  }

  function applyDraft() {
    if (!draft) return;
    setCosts(draft.costs);
    setAssumptions(draft.assumptions);
    setSqft(draft.sqft);
    setDraftApplied(true);
  }

  return (
    <div>
      <PageHeader
        title="Bid & price"
        description="Transparent pricing that protects both parties — draft from a short brief, apply a job preset, then fine-tune every line."
      />

      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        {(Object.keys(CONTRACT_GUIDANCE) as Array<keyof typeof CONTRACT_GUIDANCE>).map((k) => {
          const g = CONTRACT_GUIDANCE[k];
          return (
            <div key={k} className="border border-border bg-bg-elevated p-4">
              <p className="text-[13px] font-medium">{g.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-fg-muted">{g.summary}</p>
              <p className="mt-3 text-[11px] text-fg-subtle">
                <span className="font-medium text-fg-muted">You:</span> {g.protectsYou}
              </p>
              <p className="mt-1 text-[11px] text-fg-subtle">
                <span className="font-medium text-fg-muted">Owner:</span> {g.protectsOwner}
              </p>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Bid builder</TabsTrigger>
          <TabsTrigger value="draws">Progress draws</TabsTrigger>
          <TabsTrigger value="finance">Build & close</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-fg" strokeWidth={1.75} />
                    Draft estimate
                  </CardTitle>
                  <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-fg-muted">
                    Short text only. Runs fully offline — local rules + your closed-job history.
                    Seeds costs and OH preset; never a binding bid. For supers and estimators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <History className="h-3 w-3" strokeWidth={1.75} />
                    {closedCount} closed job{closedCount === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    Offline
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="estimate-brief">Job brief</Label>
                <Textarea
                  id="estimate-brief"
                  className="mt-1"
                  rows={3}
                  maxLength={LIMITS.estimateBrief}
                  placeholder="e.g. 1600 sf ranch + basement, 3-car, Teton Heights spec"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value.slice(0, LIMITS.estimateBrief))}
                />
                <p className="mt-1 text-[11px] text-fg-subtle">
                  {brief.length}/{LIMITS.estimateBrief}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {DRAFT_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setBrief(ex)}
                    className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-left text-[11px] text-fg-muted transition-colors hover:border-fg-subtle hover:text-fg"
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={runDraft}>
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Generate draft
                </Button>
                {draft ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyDraft}
                    disabled={draftApplied}
                  >
                    {draftApplied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Applied to builder
                      </>
                    ) : (
                      "Apply to builder"
                    )}
                  </Button>
                ) : null}
              </div>

              {draft ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {draft.parsed.kind}
                      {draft.parsed.commercialSubtype ? ` · ${draft.parsed.commercialSubtype}` : ""}
                    </Badge>
                    <Badge variant="outline">{draft.sqft.toLocaleString()} sf</Badge>
                    <Badge variant="outline">
                      Preset · {draft.presetId.replace(/_/g, " ")}
                    </Badge>
                    <Badge
                      variant={draft.confidence >= 0.55 ? "success" : "secondary"}
                      className="tabular-nums"
                    >
                      Confidence {Math.round(draft.confidence * 100)}%
                    </Badge>
                    {draftApplied ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
                        In builder — edit freely
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border border-border bg-bg p-3">
                      <p className="label-caps">Draft contract</p>
                      <p className="mt-1 text-lg font-medium tabular-nums">
                        {formatCurrency(draft.previewContractPrice)}
                      </p>
                      {draft.previewCostPerSqft ? (
                        <p className="mt-0.5 text-[11px] text-fg-subtle">
                          {formatCurrency(draft.previewCostPerSqft)} / sf
                        </p>
                      ) : null}
                    </div>
                    <div className="border border-border bg-bg p-3 sm:col-span-2">
                      <p className="label-caps flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" strokeWidth={1.75} />
                        Disclaimer
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
                        {draft.disclaimer}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <div>
                      <p className="label-caps mb-2">Assumptions</p>
                      <ul className="space-y-1.5 text-[12px] text-fg-muted">
                        {draft.assumptionsList.map((a) => (
                          <li key={a} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="label-caps mb-2">Exclusions</p>
                      <ul className="space-y-1.5 text-[12px] text-fg-muted">
                        {draft.exclusions.map((a) => (
                          <li key={a} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="label-caps mb-2">Risks / watch</p>
                      {draft.risks.length ? (
                        <ul className="space-y-1.5 text-[12px] text-fg-muted">
                          {draft.risks.map((a) => (
                            <li key={a} className="flex gap-2">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-subtle" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[12px] text-fg-subtle">No extra risk flags from brief.</p>
                      )}
                      <p className="mt-3 text-[11px] text-fg-subtle">{draft.historySummary}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job type presets</CardTitle>
              <p className="text-[12px] text-fg-muted">
                One click sets overhead, profit, contingency, and soft costs. Then tweak any field.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {JOB_OVERHEAD_PRESETS.map((p) => {
                  const isActive = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPreset(p.id)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-[13px] transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-fg"
                          : "border-border bg-bg-elevated text-fg-muted hover:border-fg-subtle hover:text-fg",
                      )}
                    >
                      <span className="font-medium">{p.shortLabel}</span>
                      <span className="mt-0.5 block text-[11px] tabular-nums opacity-80">
                        OH {p.overheadPct}% · Profit {p.profitPct}% · Cont {p.contingencyPct}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {activePresetMeta ? (
                <div className="mt-4 rounded-md border border-border bg-bg p-3">
                  <p className="text-[13px] font-medium">{activePresetMeta.label}</p>
                  <p className="mt-1 text-[12px] text-fg-muted">{activePresetMeta.description}</p>
                  <p className="mt-2 text-[11px] text-fg-subtle">
                    <span className="font-medium">Best for:</span> {activePresetMeta.bestFor}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed border-border bg-bg p-3">
                  <p className="text-[13px] font-medium">Custom</p>
                  <p className="mt-1 text-[12px] text-fg-muted">
                    Values no longer match a preset. Your overrides are preserved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Hard costs</CardTitle>
                {draftApplied ? (
                  <p className="text-[12px] text-fg-muted">
                    Seeded from draft — every line is editable.
                  </p>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {COST_FIELDS.map((f) => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Input
                      className="mt-1"
                      inputMode="numeric"
                      value={costs[f.key]}
                      onChange={(e) => setCost(f.key, e.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <Label>Sqft (optional)</Label>
                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    value={sqft}
                    onChange={(e) => setSqft(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Overhead %</Label>
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={assumptions.overheadPct}
                    onChange={(e) =>
                      setAssumptions((a) => ({ ...a, overheadPct: Number(e.target.value) || 0 }))
                    }
                  />
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Job + company OH (supervision, insurance, office, vehicles…)
                  </p>
                </div>
                <div>
                  <Label>Profit %</Label>
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={assumptions.profitPct}
                    onChange={(e) =>
                      setAssumptions((a) => ({ ...a, profitPct: Number(e.target.value) || 0 }))
                    }
                  />
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    Owner return + risk buffer. Raise on custom / higher-risk work.
                  </p>
                </div>
                <div>
                  <Label>Contingency %</Label>
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={assumptions.contingencyPct}
                    onChange={(e) =>
                      setAssumptions((a) => ({
                        ...a,
                        contingencyPct: Number(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Soft costs ($)</Label>
                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    value={assumptions.softCosts}
                    onChange={(e) =>
                      setAssumptions((a) => ({ ...a, softCosts: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract price</CardTitle>
                <p className="text-[12px] text-fg-muted">Total OH&P = {price.totalOhpPct}%</p>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px]">
                {[
                  ["Hard costs", price.hardCosts],
                  ["Contingency", price.contingency],
                  ["Soft costs", price.softCosts],
                  ["Overhead", price.overhead],
                  ["Profit", price.profit],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between border-b border-border py-2">
                    <span className="text-fg-muted">{k}</span>
                    <span className="tabular-nums">{formatCurrency(Number(v))}</span>
                  </div>
                ))}
                <div className="flex justify-between border-b border-border py-2">
                  <span className="text-fg-muted">Combined OH&P</span>
                  <span className="tabular-nums">{formatCurrency(price.markup)}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="font-medium">Contract price</span>
                  <span className="text-xl font-medium tabular-nums">
                    {formatCurrency(price.contractPrice)}
                  </span>
                </div>
                {price.costPerSqft ? (
                  <p className="text-[12px] text-fg-subtle">
                    {formatCurrency(price.costPerSqft)} / sqft
                  </p>
                ) : null}
                <div className="border border-border bg-bg p-3">
                  <p className="label-caps">Safe floor</p>
                  <p className="mt-1 text-[13px] font-medium tabular-nums">
                    {formatCurrency(price.minSafePrice)}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-muted">
                    Below this you are eating risk — hard costs + soft + ~12% minimum coverage.
                  </p>
                </div>
                {price.contractPrice < price.minSafePrice ? (
                  <Badge variant="danger">Below safe floor</Badge>
                ) : (
                  <Badge variant="success">Above safe floor</Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="draws" className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {(Object.keys(PAYMENT_PATH_GUIDANCE) as Array<keyof typeof PAYMENT_PATH_GUIDANCE>).map(
              (k) => {
                const g = PAYMENT_PATH_GUIDANCE[k];
                return (
                  <div key={k} className="border border-border bg-bg-elevated p-4">
                    <p className="text-[13px] font-medium">{g.title}</p>
                    <p className="mt-2 text-[12px] text-fg-muted">
                      <span className="font-medium">When:</span> {g.when}
                    </p>
                    <p className="mt-1 text-[12px] text-fg-muted">
                      <span className="font-medium">Cash:</span> {g.cashFlow}
                    </p>
                    <p className="mt-1 text-[12px] text-fg-muted">
                      <span className="font-medium">Risk:</span> {g.risks}
                    </p>
                  </div>
                );
              },
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Standard draw schedule · {formatCurrency(price.contractPrice)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {draws.map(({ milestone, amount, cumulative }) => (
                <div
                  key={milestone.id}
                  className="grid gap-1 border border-border p-3 sm:grid-cols-[1.2fr_0.6fr_0.6fr]"
                >
                  <div>
                    <p className="text-[13px] font-medium">
                      {milestone.name}{" "}
                      <span className="text-fg-subtle">({Math.round(milestone.pct * 100)}%)</span>
                    </p>
                    <p className="text-[11px] text-fg-muted">{milestone.trigger}</p>
                    <p className="text-[11px] text-fg-subtle">{milestone.protects}</p>
                  </div>
                  <p className="text-[13px] tabular-nums sm:text-right">{formatCurrency(amount)}</p>
                  <p className="text-[12px] tabular-nums text-fg-subtle sm:text-right">
                    cum {formatCurrency(cumulative)}
                  </p>
                </div>
              ))}
              <p className="text-[11px] text-fg-subtle">
                5% final retainage keeps leverage until punch list and lien waivers clear.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spec / build-to-close inputs</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                ["Build months", months, setMonths],
                ["Interest %", rate, setRate],
                ["LTC %", ltc, setLtc],
                ["Holding $/mo", holding, setHolding],
                ["Sale price", sale, setSalePrice],
                ["Selling cost %", sellingPct, setSellingPct],
              ].map(([label, val, set]) => (
                <div key={String(label)}>
                  <Label>{label as string}</Label>
                  <Input
                    className="mt-1"
                    value={val as number}
                    onChange={(e) => (set as (n: number) => void)(Number(e.target.value) || 0)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cash at close</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[13px]">
              {[
                ["Total build cost", finance.totalBuildCost],
                ["Financed (loan)", finance.financedAmount],
                ["Your equity cash", finance.equityCash],
                ["Interest carry", finance.interestCarry],
                ["Holding costs", finance.holdingCost],
                ["Peak cash need", finance.peakCashNeed],
                ["Monthly burn hint", finance.monthlyDrawHint],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between border-b border-border py-2">
                  <span className="text-fg-muted">{k}</span>
                  <span className="tabular-nums">{formatCurrency(Number(v))}</span>
                </div>
              ))}
              <div className="flex justify-between py-3">
                <span className="font-medium">Net at close</span>
                <span
                  className={`text-xl font-medium tabular-nums ${
                    finance.netAtClose < 0 ? "text-danger" : ""
                  }`}
                >
                  {formatCurrency(finance.netAtClose)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Push estimate → job cost</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label>Target job</Label>
            <select
              className="mt-1 w-full border border-border bg-bg px-3 py-2 text-[13px]"
              value={seedProjectId}
              onChange={(e) => setSeedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-fg-subtle">
              Replaces that job's cost codes with this estimate's buckets + soft costs, contingency, and OH&P.
              Existing actuals are cleared — use early, before field spend is recorded.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              seedBudgetFromEstimate(seedProjectId, costs, assumptions);
              toast.success("Job cost seeded from estimate");
            }}
          >
            Seed job cost codes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
