import { cn, formatCurrency } from "@/lib/utils";
import type { JobPnl } from "@/lib/job-cost";

const healthLabel = {
  healthy: "On track",
  watch: "Watch",
  over: "Over budget",
} as const;

export function JobPnlStrip({
  pnl,
  compact = false,
  className,
}: {
  pnl: JobPnl;
  compact?: boolean;
  className?: string;
}) {
  const marginPct =
    pnl.grossMarginPct == null ? "—" : `${(pnl.grossMarginPct * 100).toFixed(1)}%`;

  const cells = [
    { k: "Contract", v: formatCurrency(pnl.contractValue), sub: pnl.approvedCos ? `+ COs ${formatCurrency(pnl.approvedCos)}` : "base + COs" },
    { k: "Budgeted cost", v: formatCurrency(pnl.budgeted), sub: `committed ${formatCurrency(pnl.committed)}` },
    { k: "Actual cost", v: formatCurrency(pnl.actual), sub: `remaining ${formatCurrency(pnl.remaining)}` },
    {
      k: "Gross margin",
      v: formatCurrency(pnl.grossMargin),
      sub: marginPct,
      danger: pnl.grossMargin < 0 || (pnl.grossMarginPct != null && pnl.grossMarginPct < 0.08),
    },
  ];

  return (
    <div className={cn("border border-border bg-bg-elevated", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <p className="label-caps">Job P&L</p>
          {!compact ? (
            <p className="truncate text-[13px] font-medium">{pnl.projectName}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em]",
            pnl.health === "healthy" && "bg-success/15 text-success",
            pnl.health === "watch" && "bg-warning/15 text-warning",
            pnl.health === "over" && "bg-danger/15 text-danger",
          )}
        >
          {healthLabel[pnl.health]}
        </span>
      </div>
      <div className={cn("grid gap-px bg-border", compact ? "sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
        {cells.map((c) => (
          <div key={c.k} className="bg-bg-elevated px-3 py-2.5 sm:px-4">
            <p className="label-caps text-fg-subtle">{c.k}</p>
            <p className={cn("mt-0.5 text-[15px] font-medium tabular-nums", c.danger && "text-danger")}>{c.v}</p>
            <p className="mt-0.5 text-[11px] text-fg-subtle tabular-nums">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[11px] text-fg-muted sm:px-4">
        <span>
          Draws paid <span className="tabular-nums text-fg">{formatCurrency(pnl.drawsPaid)}</span>
        </span>
        <span>
          Draws pending <span className="tabular-nums text-fg">{formatCurrency(pnl.drawsPending)}</span>
        </span>
        <span>
          Field progress <span className="tabular-nums text-fg">{pnl.fieldProgress}%</span>
        </span>
        <span>
          Cost used <span className="tabular-nums text-fg">{(pnl.costPctUsed * 100).toFixed(0)}%</span>
        </span>
      </div>
    </div>
  );
}
