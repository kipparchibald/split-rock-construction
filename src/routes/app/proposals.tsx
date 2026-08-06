import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { useAppStore } from "@/data/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/app/proposals")({
  component: ProposalsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
});

function ProposalsPage() {
  const { id: focusId } = Route.useSearch();
  const { proposals, prospects, tetonLots, tetonPackages, setProposalStatus } = useAppStore();
  const ordered = useMemo(
    () => [...proposals].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [proposals],
  );
  const focus = ordered.find((p) => p.id === focusId) ?? ordered[0];

  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Lot + build one-pagers for prospects. Print or save as PDF from the browser."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/prospects">Back to prospects</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr]">
        <div className="space-y-2">
          {ordered.map((p) => {
            const pr = prospects.find((x) => x.id === p.prospectId);
            return (
              <Link
                key={p.id}
                to="/app/proposals"
                search={{ id: p.id }}
                className={`block border p-3 ${focus?.id === p.id ? "border-primary bg-bg-subtle" : "border-border bg-bg-elevated"}`}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-[13px] font-medium">{pr?.name ?? p.prospectId}</p>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
                <p className="mt-1 text-[12px] tabular-nums text-fg-muted">{formatCurrency(p.total)}</p>
              </Link>
            );
          })}
          {!ordered.length ? (
            <p className="text-[13px] text-fg-muted">No proposals yet — create one from a prospect.</p>
          ) : null}
        </div>

        {focus ? (
          <Card className="print:border-0 print:shadow-none">
            <CardHeader className="flex-row items-center justify-between print:hidden">
              <CardTitle>Preview</CardTitle>
              <div className="flex gap-2">
                {focus.status === "draft" ? (
                  <Button size="sm" onClick={() => setProposalStatus(focus.id, "sent")}>Mark sent</Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  Print / PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProposalDoc
                proposal={focus}
                prospectName={prospects.find((p) => p.id === focus.prospectId)?.name ?? "Prospect"}
                lotLabel={
                  focus.lotId
                    ? (() => {
                        const l = tetonLots.find((x) => x.id === focus.lotId);
                        return l ? `Block ${l.block} / Lot ${l.lot} (${l.acres} ac)` : focus.lotId;
                      })()
                    : "—"
                }
                packageName={
                  focus.packageId
                    ? tetonPackages.find((x) => x.id === focus.packageId)?.name ?? focus.packageId
                    : "Custom / commercial"
                }
                packageMeta={
                  focus.packageId
                    ? (() => {
                        const bp = tetonPackages.find((x) => x.id === focus.packageId);
                        return bp ? `${bp.sqft} sf · ${bp.beds} bed / ${bp.baths} bath · ${bp.finishesTier}` : "";
                      })()
                    : ""
                }
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function ProposalDoc({
  proposal,
  prospectName,
  lotLabel,
  packageName,
  packageMeta,
}: {
  proposal: {
    id: string;
    lotPrice: number;
    buildPrice: number;
    softCosts: number;
    extras: number;
    total: number;
    createdAt: string;
    validUntil: string;
    notes: string;
  };
  prospectName: string;
  lotLabel: string;
  packageName: string;
  packageMeta: string;
}) {
  return (
    <div className="space-y-6 text-[13px]">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <Logo />
        <div className="text-right text-[11px] text-fg-muted">
          <p>{COMPANY.name}</p>
          <p>{COMPANY.location}</p>
          <p>{COMPANY.phone}</p>
        </div>
      </div>
      <div>
        <p className="label-caps">Proposal</p>
        <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">Lot + build package estimate</h2>
        <p className="mt-1 text-fg-muted">
          Prepared for {prospectName} · {formatDate(proposal.createdAt)} · Valid through{" "}
          {formatDate(proposal.validUntil)}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-border p-3">
          <p className="label-caps">Lot</p>
          <p className="mt-1 font-medium">{lotLabel}</p>
          <p className="mt-2 tabular-nums text-[15px] font-medium">{formatCurrency(proposal.lotPrice)}</p>
        </div>
        <div className="border border-border p-3">
          <p className="label-caps">Build package</p>
          <p className="mt-1 font-medium">{packageName}</p>
          {packageMeta ? <p className="text-[11px] text-fg-muted">{packageMeta}</p> : null}
          <p className="mt-2 tabular-nums text-[15px] font-medium">{formatCurrency(proposal.buildPrice)}</p>
        </div>
      </div>
      <div className="space-y-1 border border-border p-3">
        <div className="flex justify-between"><span className="text-fg-muted">Lot</span><span className="tabular-nums">{formatCurrency(proposal.lotPrice)}</span></div>
        <div className="flex justify-between"><span className="text-fg-muted">Build</span><span className="tabular-nums">{formatCurrency(proposal.buildPrice)}</span></div>
        <div className="flex justify-between"><span className="text-fg-muted">Est. soft / closing</span><span className="tabular-nums">{formatCurrency(proposal.softCosts)}</span></div>
        {proposal.extras > 0 ? (
          <div className="flex justify-between"><span className="text-fg-muted">Extras / allowances</span><span className="tabular-nums">{formatCurrency(proposal.extras)}</span></div>
        ) : null}
        <div className="flex justify-between border-t border-border pt-2 text-[15px] font-medium">
          <span>Estimated total</span>
          <span className="tabular-nums">{formatCurrency(proposal.total)}</span>
        </div>
      </div>
      {proposal.notes ? <p className="text-fg-muted">{proposal.notes}</p> : null}
      <div className="space-y-1 text-[11px] leading-relaxed text-fg-subtle">
        <p>Excludes private well, septic, driveway, landscaping, and owner-selected upgrades unless listed as extras.</p>
        <p>Teton Heights lot pricing subject to Twin Forks Development availability and seller terms.</p>
        <p>This estimate is not a construction contract or purchase agreement. Dual-capacity disclosure provided separately when applicable.</p>
        <p>Proposal id: {proposal.id}</p>
      </div>
    </div>
  );
}
