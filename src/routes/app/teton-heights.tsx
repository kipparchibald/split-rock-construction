import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/data/store";
import { multiLotTotal, ownerFinancePayment, packageTotal } from "@/lib/lot-pricing";
import { formatCurrency } from "@/lib/utils";
import type { LotStatus } from "@/data/types";

export const Route = createFileRoute("/app/teton-heights")({ component: TetonHeightsPage });

type StatusFilter = "all" | "available" | "pipeline" | LotStatus;

function TetonHeightsPage() {
  const { tetonLots, tetonPackages, tetonFinance, tetonCommunity, setLotStatus } = useAppStore();
  const [filter, setFilter] = useState<StatusFilter>("available");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pkgId, setPkgId] = useState(tetonPackages[1]?.id ?? tetonPackages[0]?.id ?? "");
  const [financeId, setFinanceId] = useState(tetonFinance[1]?.id ?? "cash");
  const [focusLotId, setFocusLotId] = useState(tetonLots.find((l) => l.status === "available")?.id ?? tetonLots[0]?.id ?? "");

  const filtered = useMemo(() => {
    if (filter === "all") return tetonLots;
    if (filter === "available") return tetonLots.filter((l) => l.status === "available");
    if (filter === "pipeline") {
      return tetonLots.filter((l) => ["reserved", "under_contract", "model"].includes(l.status));
    }
    return tetonLots.filter((l) => l.status === filter);
  }, [tetonLots, filter]);

  const available = tetonLots.filter((l) => l.status === "available");
  const avgAvailable = available.length
    ? Math.round(available.reduce((s, l) => s + l.listPrice, 0) / available.length)
    : tetonCommunity.baseLotPrice;

  const selectedLots = tetonLots.filter((l) => selectedIds.includes(l.id));
  const multi = multiLotTotal(selectedLots, 3);
  const focusLot = tetonLots.find((l) => l.id === focusLotId) ?? tetonLots[0];
  const build = tetonPackages.find((p) => p.id === pkgId) ?? tetonPackages[0];
  const finance = tetonFinance.find((f) => f.id === financeId) ?? tetonFinance[0];
  const pkg = focusLot && build ? packageTotal(focusLot, build) : null;
  const of = focusLot && finance ? ownerFinancePayment(focusLot.listPrice, finance) : null;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div>
      <PageHeader
        title="Teton Heights Div #6 — lot pricing"
        description={`${tetonCommunity.developer} marketing · ${tetonCommunity.builder} build packages · ${tetonCommunity.location}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/projects/$projectId" params={{ projectId: "p4" }}>Open job hub</Link>
          </Button>
        }
      />

      <div className="mb-4 border border-border bg-bg-elevated p-3 text-[12px] leading-relaxed text-fg-muted">
        <p className="font-medium text-fg">Market base: {formatCurrency(tetonCommunity.baseLotPrice)} per 0.6+ acre lot</p>
        <p className="mt-1">
          Public marketing for Division #6 lists lots around this price with owner financing, private well/septic,
          and utilities at the lot line. Premiums and package stacks below are for Split Rock ops / buyer conversations — confirm live inventory and seller terms with Twin Forks.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Base lot price" value={formatCurrency(tetonCommunity.baseLotPrice)} hint="0.6+ acre standard" />
        <StatCard label="Available (demo)" value={String(available.length)} hint={`Avg ${formatCurrency(avgAvailable)}`} />
        <StatCard label="Model package" value={formatCurrency(99500 + 425000)} hint="Lot base + Forks 2280" />
        <StatCard label="Typical acres" value={tetonCommunity.typicalAcres} hint="Private well + septic" />
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="inventory">Lot inventory</TabsTrigger>
          <TabsTrigger value="package">Lot + build package</TabsTrigger>
          <TabsTrigger value="finance">Owner finance</TabsTrigger>
          <TabsTrigger value="facts">Community facts</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { value: "available", label: "Available", count: available.length },
              { value: "pipeline", label: "Pipeline", count: tetonLots.filter((l) => ["reserved", "under_contract", "model"].includes(l.status)).length },
              { value: "all", label: "All", count: tetonLots.length },
              { value: "sold", label: "Sold", count: tetonLots.filter((l) => l.status === "sold").length },
            ]}
          />

          {selectedIds.length >= 2 ? (
            <div className="border border-border bg-bg-elevated p-3 text-[13px]">
              <p className="font-medium">Multi-lot stack ({multi.count} lots)</p>
              <p className="mt-1 tabular-nums text-fg-muted">
                Subtotal {formatCurrency(multi.subtotal)} · Multi-lot discount {formatCurrency(multi.discount)} ·{" "}
                <span className="font-medium text-fg">Total {formatCurrency(multi.total)}</span>
              </p>
              <p className="mt-1 text-[11px] text-fg-subtle">Demo: 3% off each lot after the highest-priced selection. Confirm Twin Forks multi-lot incentive.</p>
            </div>
          ) : null}

          <div className="border border-border">
            <div className="hidden grid-cols-[0.4fr_0.6fr_0.7fr_0.7fr_0.8fr_0.7fr_1fr_0.7fr] gap-2 border-b border-border bg-bg-subtle px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-fg-subtle lg:grid">
              <span />
              <span>Block/Lot</span>
              <span>Acres</span>
              <span>Premium</span>
              <span>List</span>
              <span>Status</span>
              <span>Utilities</span>
              <span />
            </div>
            {filtered.map((lot) => (
              <div
                key={lot.id}
                className="grid gap-2 border-b border-border px-3 py-3 last:border-0 lg:grid-cols-[0.4fr_0.6fr_0.7fr_0.7fr_0.8fr_0.7fr_1fr_0.7fr] lg:items-center"
              >
                <div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lot.id)}
                    disabled={lot.status === "sold" || lot.status === "model"}
                    onChange={() => toggleSelect(lot.id)}
                    aria-label={`Select block ${lot.block} lot ${lot.lot}`}
                    className="h-3.5 w-3.5"
                  />
                </div>
                <div>
                  <p className="text-[13px] font-medium">B{lot.block} / L{lot.lot}</p>
                  <p className="text-[11px] text-fg-subtle lg:hidden">{lot.notes}</p>
                </div>
                <p className="text-[12px] tabular-nums text-fg-muted">{lot.acres} ac</p>
                <p className="text-[12px] capitalize text-fg-muted">
                  {lot.premium.replace(/_/g, " ")}
                  {lot.premiumAmount > 0 ? ` (+${formatCurrency(lot.premiumAmount)})` : ""}
                </p>
                <div>
                  <p className="text-[13px] font-medium tabular-nums">{formatCurrency(lot.listPrice)}</p>
                  {lot.listPrice !== lot.basePrice ? (
                    <p className="text-[10px] text-fg-subtle">base {formatCurrency(lot.basePrice)}</p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    lot.status === "available"
                      ? "success"
                      : lot.status === "sold"
                        ? "secondary"
                        : lot.status === "model"
                          ? "info"
                          : "warning"
                  }
                >
                  {lot.status.replace(/_/g, " ")}
                </Badge>
                <p className="text-[11px] text-fg-subtle">{lot.utilities}</p>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setFocusLotId(lot.id)}>
                    Package
                  </Button>
                  {lot.status === "available" ? (
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setLotStatus(lot.id, "reserved")}>
                      Reserve
                    </Button>
                  ) : null}
                  {lot.status === "reserved" ? (
                    <Button size="sm" className="h-7 text-[11px]" onClick={() => setLotStatus(lot.id, "under_contract")}>
                      Contract
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="package" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Select lot + plan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="label-caps mb-1">Lot</p>
                  <Select value={focusLotId} onValueChange={setFocusLotId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tetonLots.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          B{l.block}/L{l.lot} · {formatCurrency(l.listPrice)} · {l.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="label-caps mb-1">Split Rock build package</p>
                  <Select value={pkgId} onValueChange={setPkgId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tetonPackages.map((bp) => (
                        <SelectItem key={bp.id} value={bp.id}>
                          {bp.name} · {bp.sqft} sf · {formatCurrency(bp.baseBuild)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {build ? (
                  <p className="text-[12px] text-fg-muted">
                    {build.beds} bed / {build.baths} bath · {build.finishesTier} finishes · {build.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Buyer package total</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pkg && focusLot ? (
                  <>
                    {[
                      ["Lot list price", pkg.lotPrice],
                      ["Build package", pkg.buildPrice],
                      ["Est. soft / closing (2%)", pkg.soft],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="flex justify-between text-[13px]">
                        <span className="text-fg-muted">{k}</span>
                        <span className="tabular-nums font-medium">{formatCurrency(Number(v))}</span>
                      </div>
                    ))}
                    <div className="mt-2 flex justify-between border-t border-border pt-2 text-[15px] font-medium">
                      <span>All-in estimate</span>
                      <span className="tabular-nums">{formatCurrency(pkg.total)}</span>
                    </div>
                    {pkg.perSqft ? (
                      <p className="text-[11px] text-fg-subtle">{formatCurrency(pkg.perSqft)} / sf all-in (lot + build)</p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-fg-muted">
                      Does <span className="font-medium text-fg">not</span> include well, septic, driveway, or landscaping — see Community facts.
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Build packages</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-3">
              {tetonPackages.map((bp) => {
                const sample = packageTotal(
                  { listPrice: tetonCommunity.baseLotPrice } as never,
                  bp,
                );
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => setPkgId(bp.id)}
                    className={`border p-3 text-left transition-colors ${pkgId === bp.id ? "border-primary bg-bg-subtle" : "border-border hover:bg-bg-subtle"}`}
                  >
                    <p className="text-[13px] font-medium">{bp.name}</p>
                    <p className="mt-1 text-[12px] text-fg-muted">
                      {bp.sqft} sf · {bp.beds}/{bp.baths} · {bp.finishesTier}
                    </p>
                    <p className="mt-2 text-[13px] tabular-nums font-medium">{formatCurrency(bp.baseBuild)} build</p>
                    <p className="text-[11px] text-fg-subtle">
                      + base lot ≈ {formatCurrency(sample.total)} all-in est.
                    </p>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Owner-finance scenarios (lot only)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[12px] text-fg-muted">
                  Public marketing for Teton Heights Div #6 advertises owner financing. Figures below are demo calculators — use current Twin Forks term sheets.
                </p>
                <div>
                  <p className="label-caps mb-1">Lot</p>
                  <Select value={focusLotId} onValueChange={setFocusLotId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tetonLots.filter((l) => l.status !== "sold").map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          B{l.block}/L{l.lot} · {formatCurrency(l.listPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="label-caps mb-1">Terms</p>
                  <Select value={financeId} onValueChange={setFinanceId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tetonFinance.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Payment sketch</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {of && focusLot ? (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-fg-muted">Lot price</span>
                      <span className="tabular-nums font-medium">{formatCurrency(focusLot.listPrice)}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-fg-muted">Down ({finance?.downPct}%)</span>
                      <span className="tabular-nums font-medium">{formatCurrency(of.down)}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-fg-muted">Financed</span>
                      <span className="tabular-nums font-medium">{formatCurrency(of.financed)}</span>
                    </div>
                    {finance?.termMonths ? (
                      <div className="flex justify-between border-t border-border pt-2 text-[15px] font-medium">
                        <span>Est. monthly</span>
                        <span className="tabular-nums">{formatCurrency(of.payment)}</span>
                      </div>
                    ) : (
                      <p className="text-[13px] text-fg-muted">Cash / full payment at closing.</p>
                    )}
                    <p className="text-[11px] text-fg-subtle">{finance?.notes}</p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="facts" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>What the lot price typically includes</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-fg-muted">
                  {tetonCommunity.inclusions.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Buyer costs beyond the lot</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {tetonCommunity.buyerCostsBeyondLot.map((c) => (
                  <div key={c.item} className="flex justify-between gap-2 text-[13px]">
                    <span className="text-fg-muted">{c.item}</span>
                    <span className="tabular-nums font-medium">
                      {formatCurrency(c.estimateLow)}–{formatCurrency(c.estimateHigh)}
                    </span>
                  </div>
                ))}
                <p className="pt-2 text-[11px] text-fg-subtle">{tetonCommunity.taxNote}</p>
                <p className="text-[11px] text-fg-subtle">{tetonCommunity.schoolsNote}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>How Split Rock talks about price</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-[13px] leading-relaxed text-fg-muted">
              <p>
                <span className="font-medium text-fg">Lot</span> — Twin Forks / seller price (base {formatCurrency(tetonCommunity.baseLotPrice)}; premiums for corner/view/etc.).
              </p>
              <p>
                <span className="font-medium text-fg">Build</span> — Split Rock fixed-price or cost-plus package for the plan.
              </p>
              <p>
                <span className="font-medium text-fg">All-in home</span> — lot + build + soft costs; well/septic/driveway called out separately so buyers are not surprised.
              </p>
              <p className="text-[12px] text-fg-subtle">
                Inventory counts and owner-finance terms change — always verify against Twin Forks current marketing and listing docs before quoting.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
