import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { useAppStore } from "@/data/store";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/app/budget")({ component: BudgetPage });

function BudgetPage() {
  const { budgetLines, projects } = useAppStore();
  const byProject = projects
    .map((p) => {
      const lines = budgetLines.filter((b) => b.projectId === p.id);
      if (!lines.length) return null;
      const budgeted = lines.reduce((s, l) => s + l.budgeted, 0);
      const actual = lines.reduce((s, l) => s + l.actual, 0);
      return { p, lines, budgeted, actual, variance: budgeted - actual };
    })
    .filter(Boolean) as { p: (typeof projects)[0]; lines: typeof budgetLines; budgeted: number; actual: number; variance: number }[];

  return (
    <div>
      <PageHeader title="Job cost" description="Budget vs committed vs actual — the Procore/Buildertrend money spine." />
      <div className="space-y-4">
        {byProject.map(({ p, lines, budgeted, actual, variance }) => (
          <div key={p.id} className="border border-border bg-bg-elevated">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <Link to="/app/projects/$projectId" params={{ projectId: p.id }} className="text-[13px] font-medium hover:underline">{p.name}</Link>
              <div className="flex gap-4 text-[12px] tabular-nums">
                <span className="text-fg-muted">Budget {formatCurrency(budgeted)}</span>
                <span className="text-fg-muted">Actual {formatCurrency(actual)}</span>
                <span className={variance < 0 ? "text-danger" : "text-success"}>Var {formatCurrency(variance)}</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {lines.map((l) => (
                <div key={l.id} className="grid grid-cols-2 gap-2 px-4 py-2 text-[12px] sm:grid-cols-4">
                  <span className="font-medium">{l.category}</span>
                  <span className="tabular-nums text-fg-muted">{formatCurrency(l.budgeted)}</span>
                  <span className="tabular-nums text-fg-muted">{formatCurrency(l.committed)}</span>
                  <span className={`tabular-nums ${l.actual > l.budgeted ? "text-danger" : ""}`}>{formatCurrency(l.actual)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
