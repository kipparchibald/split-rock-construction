/**
 * Job-cost spine — pure rollups for budget / committed / actual + job P&L.
 * Does not replace QuickBooks; prepares clean numbers for a future push.
 */

import { costCodeForTrade, getCostCode, resolveCostCodeId } from "./cost-codes";
import type {
  BudgetLine,
  ChangeOrder,
  PayApplication,
  ProgressDraw,
  Project,
  SelectionItem,
  Subcontract,
} from "@/data/types";
import { payAppTotals } from "./pay-app";

export interface JobCostLineView {
  id: string;
  projectId: string;
  costCodeId: string;
  code: string;
  name: string;
  category: string;
  budgeted: number;
  committed: number;
  actual: number;
  remaining: number;
  variance: number;
  pctUsed: number;
  overBudget: boolean;
  qbClass: string;
}

export interface JobPnl {
  projectId: string;
  projectName: string;
  /** Base contract + approved/invoiced COs */
  contractValue: number;
  baseContract: number;
  approvedCos: number;
  /** Owner draws paid (cash in) */
  drawsPaid: number;
  drawsPending: number;
  /** Cost rollup */
  budgeted: number;
  committed: number;
  actual: number;
  remaining: number;
  /** contract − actual cost */
  grossMargin: number;
  grossMarginPct: number | null;
  /** budgeted − actual */
  costVariance: number;
  /** actual / budgeted */
  costPctUsed: number;
  /** project.progress 0–100 */
  fieldProgress: number;
  /** Risk flag when actual > budgeted or margin thin */
  health: "healthy" | "watch" | "over";
  lines: JobCostLineView[];
}

export interface JobCostSources {
  budgetLines: BudgetLine[];
  draws: ProgressDraw[];
  changeOrders: ChangeOrder[];
  selections: SelectionItem[];
  subcontracts: Subcontract[];
  payApplications: PayApplication[];
}

function money(n: number) {
  return Math.round(Number.isFinite(n) ? n : 0);
}

/** Normalize a budget line with catalog metadata. */
export function viewBudgetLine(line: BudgetLine): JobCostLineView {
  const costCodeId = line.costCodeId || resolveCostCodeId(line.category);
  const meta = getCostCode(costCodeId);
  const budgeted = money(line.budgeted);
  const committed = money(line.committed);
  const actual = money(line.actual);
  const remaining = budgeted - actual;
  const variance = budgeted - actual;
  const pctUsed = budgeted > 0 ? actual / budgeted : 0;
  return {
    id: line.id,
    projectId: line.projectId,
    costCodeId,
    code: meta?.code ?? costCodeId,
    name: meta?.name ?? line.category,
    category: line.category,
    budgeted,
    committed,
    actual,
    remaining,
    variance,
    pctUsed,
    overBudget: actual > budgeted && budgeted > 0,
    qbClass: meta?.qbClass ?? line.category,
  };
}

/**
 * Enrich committed/actual from live ops:
 * - awarded/mobilized subs → committed on sub cost code
 * - paid/certified pay apps → actual on 01-SUB (commercial billings)
 * - selection overruns (actual > allowance, approved+) → actual on finishes
 */
export function enrichLines(
  projectId: string,
  lines: BudgetLine[],
  sources: Pick<JobCostSources, "subcontracts" | "payApplications" | "selections">,
): JobCostLineView[] {
  const views = lines.filter((l) => l.projectId === projectId).map(viewBudgetLine);
  const byCode = new Map(views.map((v) => [v.costCodeId, { ...v }]));

  const ensure = (costCodeId: string, category: string) => {
    let row = byCode.get(costCodeId);
    if (!row) {
      const meta = getCostCode(costCodeId);
      row = {
        id: `virtual-${projectId}-${costCodeId}`,
        projectId,
        costCodeId,
        code: meta?.code ?? costCodeId,
        name: meta?.name ?? category,
        category,
        budgeted: 0,
        committed: 0,
        actual: 0,
        remaining: 0,
        variance: 0,
        pctUsed: 0,
        overBudget: false,
        qbClass: meta?.qbClass ?? category,
      };
      byCode.set(costCodeId, row);
    }
    return row;
  };

  for (const sub of sources.subcontracts.filter((s) => s.projectId === projectId)) {
    if (sub.status === "bidding") continue;
    const codeId = costCodeForTrade(sub.trade, sub.csiDivision);
    const row = ensure(codeId, sub.trade);
    // Committed = contract; don't double-count if budget line already holds buyout
    row.committed = Math.max(row.committed, money(sub.contractAmount));
    row.actual = Math.max(row.actual, money(sub.paidToDate));
  }

  for (const pa of sources.payApplications.filter((a) => a.projectId === projectId)) {
    if (pa.status !== "certified" && pa.status !== "paid") continue;
    const totals = payAppTotals(pa);
    const row = ensure("01-SUB", "Subcontractors");
    // thisPeriod is the newly certified amount — use billedToDate as actual signal
    row.actual = Math.max(row.actual, money(totals.completed));
  }

  for (const sel of sources.selections.filter((s) => s.projectId === projectId)) {
    if (sel.actual == null) continue;
    if (!["approved", "ordered", "installed"].includes(sel.status)) continue;
    const overrun = money(sel.actual) - money(sel.allowance);
    if (overrun <= 0) continue;
    const row = ensure("09-FIN", "Finishes");
    row.actual += overrun;
  }

  return [...byCode.values()]
    .map((row) => {
      const remaining = row.budgeted - row.actual;
      const variance = row.budgeted - row.actual;
      const pctUsed = row.budgeted > 0 ? row.actual / row.budgeted : 0;
      return {
        ...row,
        remaining,
        variance,
        pctUsed,
        overBudget: row.budgeted > 0 && row.actual > row.budgeted,
        committed: money(row.committed),
        actual: money(row.actual),
        budgeted: money(row.budgeted),
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function buildJobPnl(project: Project, sources: JobCostSources): JobPnl {
  const lines = enrichLines(project.id, sources.budgetLines, sources);
  const budgeted = lines.reduce((s, l) => s + l.budgeted, 0);
  const committed = lines.reduce((s, l) => s + l.committed, 0);
  const actual = lines.reduce((s, l) => s + l.actual, 0);

  const pCos = sources.changeOrders.filter((c) => c.projectId === project.id);
  const approvedCos = pCos
    .filter((c) => c.status === "approved" || c.status === "invoiced")
    .reduce((s, c) => s + money(c.amount), 0);

  const pDraws = sources.draws.filter((d) => d.projectId === project.id);
  const drawsPaid = pDraws.filter((d) => d.status === "paid").reduce((s, d) => s + money(d.amount), 0);
  const drawsPending = pDraws
    .filter((d) => d.status === "ready" || d.status === "submitted")
    .reduce((s, d) => s + money(d.amount), 0);

  const baseContract = money(project.budget);
  const contractValue = baseContract + approvedCos;
  const remaining = budgeted - actual;
  const costVariance = budgeted - actual;
  const grossMargin = contractValue - actual;
  const grossMarginPct = contractValue > 0 ? grossMargin / contractValue : null;
  const costPctUsed = budgeted > 0 ? actual / budgeted : 0;

  let health: JobPnl["health"] = "healthy";
  if (actual > budgeted && budgeted > 0) health = "over";
  else if (
    (grossMarginPct != null && grossMarginPct < 0.08) ||
    costPctUsed > 0.92 ||
    lines.some((l) => l.overBudget)
  ) {
    health = "watch";
  }

  return {
    projectId: project.id,
    projectName: project.name,
    contractValue,
    baseContract,
    approvedCos,
    drawsPaid,
    drawsPending,
    budgeted,
    committed,
    actual,
    remaining,
    grossMargin,
    grossMarginPct,
    costVariance,
    costPctUsed,
    fieldProgress: project.progress,
    health,
    lines,
  };
}

export function portfolioPnl(projects: Project[], sources: JobCostSources): JobPnl[] {
  return projects
    .filter((p) => p.status !== "complete" || sources.budgetLines.some((b) => b.projectId === p.id))
    .map((p) => buildJobPnl(p, sources))
    .filter((p) => p.lines.length > 0 || p.contractValue > 0);
}

/** CSV for bookkeeper / future QuickBooks import mapping. */
export function jobCostToCsv(pnls: JobPnl[]): string {
  const header = [
    "project",
    "cost_code",
    "name",
    "qb_class",
    "budgeted",
    "committed",
    "actual",
    "remaining",
    "contract_value",
    "gross_margin",
  ].join(",");
  const rows: string[] = [header];
  for (const p of pnls) {
    for (const l of p.lines) {
      rows.push(
        [
          csvEscape(p.projectName),
          l.code,
          csvEscape(l.name),
          csvEscape(l.qbClass),
          l.budgeted,
          l.committed,
          l.actual,
          l.remaining,
          p.contractValue,
          p.grossMargin,
        ].join(","),
      );
    }
  }
  return rows.join("\n");
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Approved CO dollars that should lift finishes/contingency budget (revenue side is contract). */
export function approvedCoCostImpact(cos: ChangeOrder[], projectId: string): number {
  return cos
    .filter((c) => c.projectId === projectId && (c.status === "approved" || c.status === "invoiced"))
    .reduce((s, c) => s + money(c.amount) * 0.85, 0); // ~15% fee retained; rest assumed cost lift
}
