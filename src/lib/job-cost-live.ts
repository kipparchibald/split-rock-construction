import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isCrmServerPersistenceEnabled } from "@/lib/crm/capabilities.server";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_OWNER_CONTINGENCY,
  holwegeBudgetLines,
} from "@/data/holwege";

export type JobCostLineSummary = {
  lineId: string;
  lineLabel: string;
  lineType: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number | null;
  sortOrder: number;
};

export type JobCostProjectSummary = {
  projectId: string;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  contractorSavingsShare: number;
  ownerSavingsCredit: number;
  variancePct: number | null;
  lines: JobCostLineSummary[];
  source: "live" | "demo";
};

const demoLines: JobCostLineSummary[] = holwegeBudgetLines
  .map((l) => ({
    lineId: l.id,
    lineLabel: l.category,
    lineType: "estimate",
    budgeted: l.budgeted,
    actual: l.actual,
    variance: l.budgeted - l.actual,
    variancePct: l.budgeted > 0 ? ((l.budgeted - l.actual) / l.budgeted) * 100 : null,
    sortOrder: 0,
  }))
  .sort((a, b) => a.lineLabel.localeCompare(b.lineLabel));

const demoSummary: JobCostProjectSummary = {
  projectId: "p-holwege",
  totalBudgeted: demoLines.reduce((s, l) => s + l.budgeted, 0),
  totalActual: demoLines.reduce((s, l) => s + l.actual, 0),
  totalVariance: demoLines.reduce((s, l) => s + l.variance, 0),
  contractorSavingsShare: 0,
  ownerSavingsCredit: 0,
  variancePct: null,
  lines: demoLines,
  source: "demo",
};

type ProjectSummaryRow = {
  total_budgeted: string | number;
  total_actual: string | number;
  total_variance: string | number;
  contractor_savings_share: string | number;
  owner_savings_credit: string | number;
  variance_pct: string | number | null;
};

type LineSummaryRow = {
  line_id: string;
  line_label: string;
  line_type: string;
  budgeted: string | number;
  actual: string | number;
  variance: string | number;
  variance_pct: string | number | null;
  sort_order: string | number;
};

/**
 * Live read of the job_cost_project_summary view, scoped to the signed-in
 * operator. Falls back to the Holwege demo numbers when server persistence
 * is off so the portal still renders in preview.
 */
export const getJobCostProjectSummary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ projectId: z.string().min(1) }))
  .handler(async ({ context, data }): Promise<JobCostProjectSummary> => {
    if (!isCrmServerPersistenceEnabled()) {
      return { ...demoSummary, projectId: data.projectId };
    }

    const sql = await getSql();

    // getSql() returns Promise<Row[]> when given Row — do NOT wrap as Row[].
    const projectRows = await sql<ProjectSummaryRow>`
      select
        total_budgeted,
        total_actual,
        total_variance,
        contractor_savings_share,
        owner_savings_credit,
        variance_pct
      from job_cost_project_summary
      where user_id = ${context.userId} and project_id = ${data.projectId}
      limit 1
    `;

    const lineRows = await sql<LineSummaryRow>`
      select
        line_id,
        line_label,
        line_type,
        budgeted,
        actual,
        variance,
        variance_pct,
        sort_order
      from job_cost_line_summary
      where user_id = ${context.userId} and project_id = ${data.projectId}
      order by sort_order, line_label
    `;

    const p = projectRows[0];
    if (!p) {
      return { ...demoSummary, projectId: data.projectId };
    }

    const toNum = (v: string | number | null | undefined) =>
      v == null ? 0 : Number(v);

    return {
      projectId: data.projectId,
      totalBudgeted: toNum(p.total_budgeted),
      totalActual: toNum(p.total_actual),
      totalVariance: toNum(p.total_variance),
      contractorSavingsShare: toNum(p.contractor_savings_share),
      ownerSavingsCredit: toNum(p.owner_savings_credit),
      variancePct: p.variance_pct == null ? null : toNum(p.variance_pct),
      lines: lineRows.map((l) => ({
        lineId: l.line_id,
        lineLabel: l.line_label,
        lineType: l.line_type,
        budgeted: toNum(l.budgeted),
        actual: toNum(l.actual),
        variance: toNum(l.variance),
        variancePct: l.variance_pct == null ? null : toNum(l.variance_pct),
        sortOrder: toNum(l.sort_order),
      })),
      source: "live",
    };
  });

/** Convenience: Holwege-specific wrapper so callers don't repeat the id. */
export const getHolwegeCostSummary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<JobCostProjectSummary> => {
    return getJobCostProjectSummary({ data: { projectId: "p-holwege" } });
  });

/** Static contract numbers the portal header still needs. */
export const HOLWEGE_CONTRACT_STATIC = HOLWEGE_CONTRACT;
export const HOLWEGE_DRAW_BASE_STATIC = HOLWEGE_DRAW_BASE;
export const HOLWEGE_OWNER_CONTINGENCY_STATIC = HOLWEGE_OWNER_CONTINGENCY;
