import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Scale, Shield } from "lucide-react";
import { FilterChips } from "@/components/layout/filter-chips";
import { PageHeader } from "@/components/layout/page-header";
import { NextActionBanner, type NextAction } from "@/components/layout/next-action-banner";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/data/store";
import {
  closeoutReady,
  dualCloseReady,
  itemProgress,
  nextCloseoutAction,
  nextDualRoleAction,
  nextRealtyAction,
  realtyReady,
} from "@/lib/closing";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RealtyItemStatus } from "@/data/types";

export const Route = createFileRoute("/app/closing")({
  validateSearch: (search: Record<string, unknown>): { project?: string } => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  component: ClosingPage,
});

const closeStatusVariant = (s: string) =>
  s === "complete" || s === "waived" || s === "n_a"
    ? "success"
    : s === "blocked"
      ? "danger"
      : s === "in_progress"
        ? "warning"
        : "secondary";

function ClosingPage() {
  const { project: searchProject } = Route.useSearch();
  const {
    projects,
    closeoutPackages,
    realtyDeals,
    dualRolePolicy,
    setCloseoutItemStatus,
    setRealtyItemStatus,
    setRealtyDealStatus,
    acknowledgeDualCapacity,
    adjustPunch,
  } = useAppStore();
  const [filter, setFilter] = useState<"all" | "dual" | "construction" | "realty">("all");

  const rows = useMemo(() => {
    const ids = new Set([
      ...closeoutPackages.map((c) => c.projectId),
      ...realtyDeals.map((r) => r.projectId),
    ]);
    return [...ids].map((projectId) => {
      const project = projects.find((p) => p.id === projectId);
      const pkg = closeoutPackages.find((c) => c.projectId === projectId);
      const deal = realtyDeals.find((r) => r.projectId === projectId);
      const dual = dualCloseReady(pkg, deal);
      const isDual =
        deal &&
        deal.status !== "n_a" &&
        (deal.dualCapacity === "disclosed" ||
          deal.dualCapacity === "pending_disclosure" ||
          deal.agencyRole === "owner_agent" ||
          deal.agencyRole === "seller_agent" ||
          deal.agencyRole === "dual_agency");
      return { projectId, project, pkg, deal, dual, isDual };
    });
  }, [projects, closeoutPackages, realtyDeals]);

  const filtered = rows.filter((r) => {
    if (filter === "dual") return r.isDual;
    if (filter === "construction") return !!r.pkg;
    if (filter === "realty") return !!r.deal && r.deal.status !== "n_a";
    return true;
  });

  // Deep-link focus
  useEffect(() => {
    if (!searchProject) return;
    const el = document.getElementById(`close-job-${searchProject}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchProject, filtered.length]);

  const dualPending = rows.filter((r) => r.isDual && !r.dual.ready).length;
  const closeReady = rows.filter((r) => r.dual.ready).length;

  const bannerAction = useMemo((): NextAction => {
    const n = nextDualRoleAction({ packages: closeoutPackages, deals: realtyDeals });
    if (n.severity === "clear") {
      return { severity: "clear", title: n.title, detail: n.detail };
    }
    return {
      severity: n.severity,
      title: n.title,
      detail: n.detail,
      to: n.projectId ? "/app/projects/$projectId" : "/app/closing",
      params: n.projectId ? { projectId: n.projectId } : undefined,
      search: n.lane ? { tab: n.lane } : n.projectId ? { project: n.projectId } : undefined,
      cta: n.lane === "realty" ? "Open realty lane" : "Open closeout",
    };
  }, [closeoutPackages, realtyDeals]);

  return (
    <div>
      <PageHeader
        title="Closing & dual-role"
        description="Two separate lanes: construction closeout (G704-style) and realty transaction checklists. Never substitute one for the other."
      />

      <NextActionBanner action={bannerAction} className="mb-4" />

      <div className="mb-4 border border-warning/40 bg-warning/5 p-3 text-[12px] leading-relaxed text-fg-muted">
        <p className="flex items-start gap-2 font-medium text-fg">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.75} />
          Operational best practices — not legal advice
        </p>
        <p className="mt-1">
          Checklists track status. Official AIA-style certificates, Idaho REALTORS® forms, and trust accounting
          stay in licensed systems. Confirm dual-capacity structure with your broker and Idaho counsel.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Packages" value={String(rows.length)} hint="Jobs with closeout and/or realty" />
        <StatCard label="Dual-role active" value={String(rows.filter((r) => r.isDual).length)} hint="Builder + licensee path" />
        <StatCard label="Gates blocked" value={String(dualPending)} hint="Need both lanes clear" />
        <StatCard label="Safe to close" value={String(closeReady)} hint="Ops readiness only" />
      </div>

      <FilterChips
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: rows.length },
          { value: "dual", label: "Dual-role", count: rows.filter((r) => r.isDual).length },
          { value: "construction", label: "Construction", count: closeoutPackages.length },
          { value: "realty", label: "Realty", count: realtyDeals.filter((d) => d.status !== "n_a").length },
        ]}
      />

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">By job</TabsTrigger>
          <TabsTrigger value="policy">Dual-role policy</TabsTrigger>
          <TabsTrigger value="money">Money paths</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          {filtered.map(({ projectId, project, pkg, deal, dual, isDual }) => {
            const cProg = pkg ? itemProgress(pkg.items) : null;
            const rProg = deal ? itemProgress(deal.items) : null;
            const cGate = pkg ? closeoutReady(pkg) : null;
            const rGate = deal ? realtyReady(deal) : null;
            const nextC = pkg ? nextCloseoutAction(pkg.items) : null;
            const nextR = deal ? nextRealtyAction(deal.items) : null;
            const highlight = searchProject === projectId;

            return (
              <Card
                key={projectId}
                id={`close-job-${projectId}`}
                className={highlight ? "ring-1 ring-fg" : undefined}
              >
                <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>
                      <Link to="/app/projects/$projectId" params={{ projectId }} className="hover:underline">
                        {project?.name ?? projectId}
                      </Link>
                    </CardTitle>
                    <p className="mt-1 text-[12px] text-fg-muted">
                      {project?.type} · {project?.address}
                      {isDual ? " · Dual-role sale path" : deal?.status === "n_a" ? " · Construction only" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={dual.ready ? "success" : "warning"}>
                      {dual.ready ? "Gates clear" : dual.reason}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        to="/app/projects/$projectId"
                        params={{ projectId }}
                        search={{ tab: isDual && deal?.dualCapacity === "pending_disclosure" ? "realty" : "closeout" }}
                      >
                        Job hub
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 lg:grid-cols-2">
                    {/* Construction lane */}
                    <div className="border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[12px] font-medium uppercase tracking-[0.06em]">Construction closeout</p>
                        {cGate?.constructionGate ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />
                        ) : (
                          <Shield className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                        )}
                      </div>
                      {!pkg ? (
                        <p className="text-[12px] text-fg-muted">No closeout package.</p>
                      ) : (
                        <>
                          <Progress value={cProg!.pct} className="mb-2" />
                          <p className="text-[11px] tabular-nums text-fg-subtle">
                            {cProg!.done}/{cProg!.total} · punch {pkg.punchClosed} closed / {pkg.punchOpen} open
                            {pkg.substantialDate ? ` · substantial ${formatDate(pkg.substantialDate)}` : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              disabled={pkg.punchOpen <= 0}
                              onClick={() => adjustPunch(pkg.id, -1)}
                            >
                              Close 1 punch
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => adjustPunch(pkg.id, 1)}
                            >
                              Add punch
                            </Button>
                          </div>
                          <p className="mt-2 text-[11px] text-fg-muted">
                            G704-style substantial completion is <span className="font-medium text-fg">not</span> a
                            realtor walkthrough.
                          </p>
                          <ul className="mt-3 space-y-1.5">
                            {pkg.items.map((it) => (
                              <li key={it.key} className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                                <span className="text-fg-muted">{it.label}</span>
                                <span className="flex items-center gap-1.5">
                                  <Badge variant={closeStatusVariant(it.status)}>{it.status.replace(/_/g, " ")}</Badge>
                                  {it.status === "not_started" || it.status === "in_progress" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() =>
                                        setCloseoutItemStatus(
                                          pkg.id,
                                          it.key,
                                          it.status === "not_started" ? "in_progress" : "complete",
                                        )
                                      }
                                    >
                                      {it.status === "not_started" ? "Start" : "Done"}
                                    </Button>
                                  ) : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {nextC ? (
                            <p className="mt-2 text-[11px] text-fg-subtle">Next: {nextC.label}</p>
                          ) : null}
                        </>
                      )}
                    </div>

                    {/* Realty lane */}
                    <div className="border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-[12px] font-medium uppercase tracking-[0.06em]">Realty transaction</p>
                        <Scale className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                      </div>
                      {!deal ? (
                        <p className="text-[12px] text-fg-muted">No realty deal.</p>
                      ) : deal.status === "n_a" ? (
                        <p className="text-[12px] text-fg-muted">
                          Realty N/A — {deal.notes || "Construction-only engagement."}
                        </p>
                      ) : (
                        <>
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <Badge variant="outline">{deal.status.replace(/_/g, " ")}</Badge>
                            <Badge variant="outline">{deal.agencyRole.replace(/_/g, " ")}</Badge>
                            <Badge
                              variant={
                                deal.dualCapacity === "disclosed"
                                  ? "success"
                                  : deal.dualCapacity === "pending_disclosure"
                                    ? "warning"
                                    : "secondary"
                              }
                            >
                              dual: {deal.dualCapacity.replace(/_/g, " ")}
                            </Badge>
                            {rGate?.dualOk ? (
                              <Badge variant="success">disclosure ok</Badge>
                            ) : (
                              <Badge variant="warning">disclosure open</Badge>
                            )}
                          </div>
                          <Progress value={rProg!.pct} className="mb-2" />
                          <p className="text-[11px] tabular-nums text-fg-subtle">
                            {rProg!.done}/{rProg!.total}
                            {deal.salePrice
                              ? ` · sale ${formatCurrency(deal.salePrice)}`
                              : deal.listPrice
                                ? ` · list ${formatCurrency(deal.listPrice)}`
                                : ""}
                            {deal.closingDate ? ` · close ${formatDate(deal.closingDate)}` : ""}
                          </p>
                          <p className="mt-2 text-[11px] text-fg-muted">
                            Earnest: {deal.earnestHeldBy}
                            {deal.earnestAmount ? ` · ${formatCurrency(deal.earnestAmount)}` : ""}
                          </p>
                          <p className="mt-1 text-[11px] text-fg-subtle">{deal.trustAccountNote}</p>
                          {deal.dualCapacity === "pending_disclosure" ? (
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() => acknowledgeDualCapacity(deal.id, "Client")}
                            >
                              Record dual-capacity acknowledgment
                            </Button>
                          ) : null}
                          {deal.dualCapacity === "disclosed" && deal.dualCapacityAcknowledgedAt ? (
                            <p className="mt-2 text-[11px] text-success">
                              Disclosed {formatDate(deal.dualCapacityAcknowledgedAt)}
                              {deal.dualCapacityAcknowledgedBy ? ` · ${deal.dualCapacityAcknowledgedBy}` : ""}
                            </p>
                          ) : null}
                          <ul className="mt-3 space-y-1.5">
                            {deal.items.map((it) => (
                              <li key={it.key} className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                                <span className="min-w-0">
                                  <span className="text-fg-muted">{it.label}</span>
                                  <span className="mt-0.5 block text-[10px] text-fg-subtle">{it.systemOfRecord}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Badge variant={closeStatusVariant(it.status)}>{it.status.replace(/_/g, " ")}</Badge>
                                  {it.status === "not_started" || it.status === "in_progress" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() =>
                                        setRealtyItemStatus(
                                          deal.id,
                                          it.key,
                                          (it.status === "not_started" ? "in_progress" : "complete") as RealtyItemStatus,
                                        )
                                      }
                                    >
                                      {it.status === "not_started" ? "Start" : "Done"}
                                    </Button>
                                  ) : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {deal.status === "listed" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => setRealtyDealStatus(deal.id, "under_contract")}
                            >
                              Mark under contract
                            </Button>
                          ) : null}
                          {deal.status === "under_contract" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => setRealtyDealStatus(deal.id, "pending_close")}
                            >
                              Mark pending close
                            </Button>
                          ) : null}
                          {deal.status === "pending_close" && dual.ready ? (
                            <Button size="sm" className="mt-2" onClick={() => setRealtyDealStatus(deal.id, "closed")}>
                              Mark closed
                            </Button>
                          ) : null}
                          {nextR ? (
                            <p className="mt-2 text-[11px] text-fg-subtle">Next: {nextR.label}</p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>

                  {pkg?.notes || deal?.notes ? (
                    <p className="text-[12px] text-fg-muted">
                      {pkg?.notes}
                      {pkg?.notes && deal?.notes ? " · " : ""}
                      {deal?.notes}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
          {!filtered.length ? (
            <p className="border border-border bg-bg-elevated px-4 py-8 text-center text-[13px] text-fg-muted">
              No packages in this filter.
            </p>
          ) : null}
        </TabsContent>

        <TabsContent value="policy">
          <Card>
            <CardHeader>
              <CardTitle>Dual-role policy (builder + licensee)</CardTitle>
              <p className="text-[12px] text-fg-muted">
                {dualRolePolicy.builderEntity} · {dualRolePolicy.brokerage}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[13px] text-fg-muted">{dualRolePolicy.licenseNote}</p>
              <ol className="list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-fg-muted">
                {dualRolePolicy.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="money" className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Construction money</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[13px] text-fg-muted">
              <p>Progress draws / pay applications → operating or construction loan accounts.</p>
              <p>Retainage held until punch + lien waivers (residential final draw or commercial pay-app hold).</p>
              <p>Change orders approved before billing.</p>
              <p className="text-[12px] text-fg-subtle">Tracked in Bid & price, Draws, Commercial pay apps.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Realty trust money</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[13px] text-fg-muted">
              <p>
                Earnest money and other trust funds →{" "}
                <span className="font-medium text-fg">brokerage trust account only</span>.
              </p>
              <p>Never deposit earnest into Split Rock Construction operating, payroll, or draw accounts.</p>
              <p>Commissions paid per brokerage agreement — separate from GC fee / markup.</p>
              <p className="text-[12px] text-fg-subtle">Each realty deal shows earnest holder explicitly.</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Both-gates close rule</CardTitle>
            </CardHeader>
            <CardContent className="text-[13px] leading-relaxed text-fg-muted">
              <p className="mb-2">For dual-role sales (you build and participate in the brokerage side):</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Construction gate: substantial completion, CO (or TCO), lien waivers, punch clear</li>
                <li>Realty gate: dual-capacity disclosed, P&S + new-construction addendum, trust handling correct</li>
                <li>Walkthrough ≠ substantial completion certificate</li>
                <li>Closing the deed does not waive unfinished construction obligations unless the contracts say so</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
