import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/data/store";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_OWNER_CONTINGENCY,
  holwegeBudgetLines,
} from "@/data/holwege";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/portal/cost-report")({
  component: PortalCostReport,
});

/**
 * Owner-facing cost report for the Holwege portal.
 *
 * Shows the open stack: budgeted vs actual, variance, and the 50/50
 * shared-savings math. No sub-bid detail is exposed — only the rollup so
 * the owners see exactly where the money goes without the contractor's
 * procurement work being second-guessed line by line.
 */
function PortalCostReport() {
  const budgetLines = useAppStore((s) => s.budgetLines);
  const lines = budgetLines.filter((l) => l.projectId === "p-holwege");
  const source = lines.length > 0 ? lines : holwegeBudgetLines;

  const totalBudgeted = source.reduce((s, l) => s + l.budgeted, 0);
  const totalActual = source.reduce((s, l) => s + l.actual, 0);
  const variance = totalBudgeted - totalActual;
  const savings = Math.max(variance, 0);
  const contractorShare = savings * 0.5;
  const ownerCredit = savings * 0.5;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Project cost report"
        description="Holwege Residence · Lot 16 · transparent cost-plus build"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { k: "Contract price", v: formatCurrency(HOLWEGE_CONTRACT) },
          { k: "Draw base (1–5)", v: formatCurrency(HOLWEGE_DRAW_BASE) },
          { k: "Owner contingency", v: formatCurrency(HOLWEGE_OWNER_CONTINGENCY) },
        ].map((s) => (
          <div key={s.k} className="border border-border bg-bg-elevated p-3">
            <p className="label-caps text-fg-subtle">{s.k}</p>
            <p className="mt-1 text-lg font-medium tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-medium">Budgeted vs actual</h2>
        <Badge variant={variance >= 0 ? "success" : "danger"}>
          {variance >= 0 ? "Under budget" : "Over budget"}
        </Badge>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[480px] text-left text-[12px]">
          <thead className="border-b border-border bg-bg-subtle/50 text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
            <tr>
              <th className="px-3 py-2 font-medium">Line</th>
              <th className="px-3 py-2 font-medium text-right">Budgeted</th>
              <th className="px-3 py-2 font-medium text-right">Actual</th>
              <th className="px-3 py-2 font-medium text-right">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {source.map((l) => {
              const v = l.budgeted - l.actual;
              return (
                <tr key={l.id} className={v < 0 ? "bg-danger/5" : undefined}>
                  <td className="px-3 py-2">{l.category}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.budgeted)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(l.actual)}</td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${v < 0 ? "text-danger" : "text-success"}`}
                  >
                    {v >= 0 ? "+" : ""}
                    {formatCurrency(v)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-border bg-bg-subtle/40 font-medium">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(totalBudgeted)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(totalActual)}</td>
              <td
                className={`px-3 py-2 text-right tabular-nums ${variance < 0 ? "text-danger" : "text-success"}`}
              >
                {variance >= 0 ? "+" : ""}
                {formatCurrency(variance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 border border-border bg-bg-elevated p-4">
        <h3 className="text-[13px] font-medium">Shared savings (50 / 50)</h3>
        <p className="mt-1 text-[12px] text-fg-muted">
          If actual cost of work lands below the estimate, the difference is split:
          you receive half as a credit against the next draw or final payment, and
          Split Rock retains half as compensation for procurement and value
          engineering. Kyle's supervision line and the contingency are excluded
          from the split.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Total underage", v: formatCurrency(savings) },
            { k: "Your credit (50%)", v: formatCurrency(ownerCredit) },
            { k: "Contractor share (50%)", v: formatCurrency(contractorShare) },
          ].map((s) => (
            <div key={s.k} className="border border-border bg-bg p-3">
              <p className="label-caps text-fg-subtle">{s.k}</p>
              <p className="mt-1 text-base font-medium tabular-nums">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-[11px] text-fg-subtle">
        Numbers update as invoices are entered. For the full bid backup and
        competing quotes, ask anytime — transparency is the default, not the
        exception.
      </p>
      <p className="mt-2 text-[11px] text-fg-subtle">
        <Link to="/portal" className="underline">
          ← Back to portal home
        </Link>
      </p>
    </div>
  );
}
