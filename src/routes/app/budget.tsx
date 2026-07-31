import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { JobPnlStrip } from "@/components/layout/job-pnl-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/data/store";
import { COST_CODES } from "@/lib/cost-codes";
import { jobCostToCsv, portfolioPnl, type JobPnl } from "@/lib/job-cost";
import { cn, formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/app/budget")({ component: BudgetPage });

function BudgetPage() {
  const budgetLines = useAppStore((s) => s.budgetLines);
  const projects = useAppStore((s) => s.projects);
  const draws = useAppStore((s) => s.draws);
  const changeOrders = useAppStore((s) => s.changeOrders);
  const selections = useAppStore((s) => s.selections);
  const subcontracts = useAppStore((s) => s.subcontracts);
  const payApplications = useAppStore((s) => s.payApplications);
  const updateBudgetLine = useAppStore((s) => s.updateBudgetLine);

  const [filter, setFilter] = useState<"active" | "all" | "watch">("active");
  const [expanded, setExpanded] = useState<string | null>(null);

  const sources = useMemo(
    () => ({ budgetLines, draws, changeOrders, selections, subcontracts, payApplications }),
    [budgetLines, draws, changeOrders, selections, subcontracts, payApplications],
  );

  const allPnls = useMemo(() => portfolioPnl(projects, sources), [projects, sources]);

  const pnls = useMemo(() => {
    return allPnls.filter((p) => {
      const proj = projects.find((x) => x.id === p.projectId);
      if (filter === "watch") return p.health !== "healthy";
      if (filter === "active") return proj?.status !== "complete";
      return true;
    });
  }, [allPnls, filter, projects]);

  const portfolio = useMemo(() => {
    const contract = allPnls.reduce((s, p) => s + p.contractValue, 0);
    const budgeted = allPnls.reduce((s, p) => s + p.budgeted, 0);
    const actual = allPnls.reduce((s, p) => s + p.actual, 0);
    const margin = allPnls.reduce((s, p) => s + p.grossMargin, 0);
    const over = allPnls.filter((p) => p.health === "over").length;
    const watch = allPnls.filter((p) => p.health === "watch").length;
    return { contract, budgeted, actual, margin, over, watch };
  }, [allPnls]);

  function exportCsv() {
    const csv = jobCostToCsv(allPnls);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `split-rock-job-cost-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Job cost"
        description="Cost codes · budget · committed · actual · job P&L. Spine for a future QuickBooks push — not a full GL."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/app/cost-codes">Cost codes / QB export</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
              Job cost CSV
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          { k: "Portfolio contract", v: formatCurrency(portfolio.contract) },
          { k: "Budgeted cost", v: formatCurrency(portfolio.budgeted) },
          { k: "Actual cost", v: formatCurrency(portfolio.actual) },
          { k: "Gross margin", v: formatCurrency(portfolio.margin) },
        ].map((s) => (
          <div key={s.k} className="border border-border bg-bg-elevated p-3">
            <p className="label-caps text-fg-subtle">{s.k}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["active", "Active jobs"],
            ["watch", `Watch / over (${portfolio.watch + portfolio.over})`],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "border px-3 py-1.5 text-[12px] font-medium transition-colors",
              filter === id
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-bg-elevated text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
        <p className="ml-auto flex max-w-sm items-start gap-1.5 text-[11px] text-fg-subtle">
          <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.75} />
          {COST_CODES.length} cost codes · CSV columns map to QB Class. Books stay in QuickBooks.
        </p>
      </div>

      <div className="space-y-4">
        {pnls.length === 0 ? (
          <div className="border border-border bg-bg-elevated px-4 py-10 text-center text-[13px] text-fg-muted">
            No job cost lines for this filter.
          </div>
        ) : (
          pnls.map((pnl) => (
            <JobCostCard
              key={pnl.projectId}
              pnl={pnl}
              open={expanded === pnl.projectId}
              onToggle={() => setExpanded((e) => (e === pnl.projectId ? null : pnl.projectId))}
              onPatchActual={(lineId, actual) => updateBudgetLine(lineId, { actual })}
            />
          ))
        )}
      </div>
    </div>
  );
}

function JobCostCard({
  pnl,
  open,
  onToggle,
  onPatchActual,
}: {
  pnl: JobPnl;
  open: boolean;
  onToggle: () => void;
  onPatchActual: (lineId: string, actual: number) => void;
}) {
  return (
    <div className="border border-border bg-bg-elevated">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-left hover:bg-bg-subtle/60"
      >
        <div className="min-w-0">
          <Link
            to="/app/projects/$projectId"
            params={{ projectId: pnl.projectId }}
            className="text-[13px] font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {pnl.projectName}
          </Link>
          <p className="mt-0.5 text-[11px] text-fg-subtle">
            {pnl.lines.length} codes · cost used {(pnl.costPctUsed * 100).toFixed(0)}% · field {pnl.fieldProgress}%
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[12px] tabular-nums">
          <span className="text-fg-muted">Budget {formatCurrency(pnl.budgeted)}</span>
          <span className="text-fg-muted">Actual {formatCurrency(pnl.actual)}</span>
          <span className={pnl.grossMargin < 0 ? "text-danger" : "text-success"}>
            Margin {formatCurrency(pnl.grossMargin)}
          </span>
          <Badge variant={pnl.health === "healthy" ? "success" : pnl.health === "watch" ? "warning" : "danger"}>
            {pnl.health === "healthy" ? "On track" : pnl.health === "watch" ? "Watch" : "Over"}
          </Badge>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 p-3 sm:p-4">
          <JobPnlStrip pnl={pnl} compact />
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[640px] text-left text-[12px]">
              <thead className="border-b border-border bg-bg-subtle/50 text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium text-right">Budgeted</th>
                  <th className="px-3 py-2 font-medium text-right">Committed</th>
                  <th className="px-3 py-2 font-medium text-right">Actual</th>
                  <th className="px-3 py-2 font-medium text-right">Remaining</th>
                  <th className="w-28 px-3 py-2 font-medium">Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pnl.lines.map((l) => (
                  <tr key={l.id} className={l.overBudget ? "bg-danger/5" : undefined}>
                    <td className="px-3 py-2 font-mono text-[11px] text-fg-muted">{l.code}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium">{l.name}</span>
                      <span className="mt-0.5 block text-[10px] text-fg-subtle">QB: {l.qbClass}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.budgeted)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-fg-muted">{formatCurrency(l.committed)}</td>
                    <td className="px-3 py-2 text-right">
                      {l.id.startsWith("virtual-") ? (
                        <span className={cn("tabular-nums", l.overBudget && "text-danger")}>{formatCurrency(l.actual)}</span>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step={100}
                          defaultValue={l.actual}
                          key={`${l.id}-${l.actual}`}
                          onBlur={(e) => {
                            const v = Math.round(Number(e.target.value) || 0);
                            if (v !== l.actual) onPatchActual(l.id, v);
                          }}
                          className={cn(
                            "w-28 border border-border bg-bg px-2 py-1 text-right tabular-nums",
                            l.overBudget && "text-danger",
                          )}
                          aria-label={`Actual for ${l.code}`}
                        />
                      )}
                    </td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", l.remaining < 0 && "text-danger")}>
                      {formatCurrency(l.remaining)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(100, l.pctUsed * 100)} className="h-1.5 flex-1" />
                        <span className="w-8 text-right text-[10px] tabular-nums text-fg-subtle">
                          {Math.round(l.pctUsed * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
