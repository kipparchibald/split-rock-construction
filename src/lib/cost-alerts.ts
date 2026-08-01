import type { BudgetLine, CostAlert, Project, ProgressDraw } from "@/data/types";
import { policiesNeedingAttention } from "./sub-insurance";
import type { InsurancePolicy } from "@/data/types";

export function buildCostAlerts(input: {
  projects: Project[];
  budgetLines: BudgetLine[];
  draws: ProgressDraw[];
  policies?: InsurancePolicy[];
}): CostAlert[] {
  const alerts: CostAlert[] = [];
  const now = new Date().toISOString();

  for (const p of input.projects) {
    if (p.status === "complete" || p.status === "on_hold") continue;
    const lines = input.budgetLines.filter((b) => b.projectId === p.id);
    const budgeted = lines.reduce((s, l) => s + l.budgeted, 0) || p.budget;
    const actual = lines.reduce((s, l) => s + l.actual, 0) || p.spent;
    const committed = lines.reduce((s, l) => s + l.committed, 0);
    const burn = budgeted > 0 ? actual / budgeted : 0;
    const progress = Math.max(0.01, p.progress / 100);

    if (actual > budgeted * 1.02) {
      alerts.push({
        id: `a-ob-${p.id}`,
        projectId: p.id,
        kind: "over_budget",
        severity: actual > budgeted * 1.08 ? "critical" : "warning",
        title: `${p.name}: job cost over budget`,
        detail: `Actual $${Math.round(actual).toLocaleString()} vs budget $${Math.round(budgeted).toLocaleString()} (${Math.round((actual / budgeted - 1) * 100)}% over).`,
        metric: `${Math.round((actual / budgeted) * 100)}%`,
        createdAt: now,
        acknowledged: false,
      });
    }

    if (burn > progress + 0.12 && p.progress < 95) {
      alerts.push({
        id: `a-br-${p.id}`,
        projectId: p.id,
        kind: "burn_rate",
        severity: burn > progress + 0.22 ? "warning" : "watch",
        title: `${p.name}: burn rate ahead of progress`,
        detail: `Spent ${Math.round(burn * 100)}% of budget at ${p.progress}% complete. Projected final cost ≈ $${Math.round(actual / progress).toLocaleString()} if pace holds.`,
        metric: `+${Math.round((burn - progress) * 100)} pts`,
        createdAt: now,
        acknowledged: false,
      });
    }

    if (committed > budgeted * 0.95 && actual < budgeted * 0.7) {
      alerts.push({
        id: `a-cm-${p.id}`,
        projectId: p.id,
        kind: "commitment_risk",
        severity: "watch",
        title: `${p.name}: commitments near full budget`,
        detail: `Committed $${Math.round(committed).toLocaleString()} of $${Math.round(budgeted).toLocaleString()} budget with room left only for contingency.`,
        createdAt: now,
        acknowledged: false,
      });
    }

    const draws = input.draws.filter((d) => d.projectId === p.id);
    const unpaidReady = draws.filter((d) => d.status === "ready" || d.status === "submitted");
    if (unpaidReady.length >= 2) {
      alerts.push({
        id: `a-dg-${p.id}`,
        projectId: p.id,
        kind: "draw_gap",
        severity: "info",
        title: `${p.name}: ${unpaidReady.length} draws awaiting payment`,
        detail: unpaidReady.map((d) => d.name).join(", "),
        createdAt: now,
        acknowledged: false,
      });
    }
  }

  if (input.policies) {
    for (const pol of policiesNeedingAttention(input.policies)) {
      alerts.push({
        id: `a-ins-${pol.id}`,
        kind: "insurance_expiry",
        severity: pol.status === "expired" ? "critical" : "warning",
        title: `COI ${pol.status.replace("_", " ")}: ${pol.type.replace("_", " ")}`,
        detail: `Policy ${pol.policyNumber} (${pol.carrier}) expires ${pol.expirationDate}. Additional insured: ${pol.additionalInsured ? pol.additionalInsuredNamed : "NOT listed"}.`,
        createdAt: now,
        acknowledged: false,
      });
    }
  }

  const rank = { critical: 0, warning: 1, watch: 2, info: 3 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
