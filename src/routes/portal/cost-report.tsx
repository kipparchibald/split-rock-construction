import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_OWNER_CONTINGENCY,
} from "@/data/holwege";
import { formatCurrency } from "@/lib/utils";
import {
  getHolwegeCostSummary,
  type JobCostProjectSummary,
} from "@/lib/job-cost-live";

export const Route = createFileRoute("/portal/cost-report")({
  component: PortalCostReport,
});

/**
 * Owner-facing cost report for the Holwege portal.
 *
 * Reads live from the job_cost_project_summary view (budgeted vs actual,
 * variance, 50/50 shared-savings). Falls back to demo numbers when the
 * database isn't connected so the page still renders in preview.
 * No sub-bid detail is exposed — only the rollup.
 */
function PortalCostReport() {
  const router = useRouter();
  const [summary, setSummary] = useState<JobCostProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getHolwegeCostSummary();
        if (!cancelled) setSummary(res);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalBudgeted = summary?.totalBudgeted ?? 0;
  const totalActual = summary?.totalActual ?? 0;
  const variance = summary?.totalVariance ?? totalBudgeted - totalActual;
  const savings = Math.max(variance, 0);
  const contractorShare = summary?.contractorSavingsShare ?? savings * 0.5;
  const ownerCredit = summary?.ownerSavingsCredit ?? savings * 0.5;
  const lines = summary?.lines ?? [];

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

      {loading ? (
        <p className="text-[12px] text-fg-muted">Loading live numbers…</p>
      ) : error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-medium">Budgeted vs actual</h2>
            <div className="flex items-center gap-2">
              <Badge variant={variance >= 0 ? "success" : "danger"}>
                {variance >= 0 ? "Under budget" : "Over budget"}
              </Badge>
              {summary?.source === "demo" ? (
                <Badge variant="secondary">demo</Badge>
              ) : null}
            </div>
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
                {lines.map((l) => {
                  const v = l.variance;
                  return (
                    <tr key={l.lineId} className={v < 0 ? "bg-danger/5" : undefined}>
                      <td className="px-3 py-2">{l.lineLabel}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(l.budgeted)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(l.actual)}
                      </td>
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
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(totalBudgeted)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatCurrency(totalActual)}
                  </td>
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
              If actual cost of work lands below the estimate, the difference is
              split: you receive half as a credit against the next draw or final
              payment, and Split Rock retains half as compensation for
              procurement and value engineering. Kyle's supervision line and the
              contingency are excluded from the split.
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
        </>
      )}

      <p className="mt-2 text-[11px] text-fg-subtle">
        <Link to="/portal" className="underline">
          ← Back to portal home
        </Link>
        {" "}
        ·{" "}
        <button
          type="button"
          className="underline"
          onClick={() => router.invalidate()}
        >
          Refresh
        </button>
      </p>
    </div>
  );
}
