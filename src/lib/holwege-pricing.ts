/**
 * Lock Holwege operator/owner money surfaces to verified contract dollars.
 * Fence: do not invent Holwege amounts — only reuse HOLWEGE_* constants.
 */
import type { Bid, BudgetLine, Client, Project, ProgressDraw } from "@/data/types";
import {
  HOLWEGE_CLIENT_ID,
  HOLWEGE_CONTRACT,
  HOLWEGE_COST_OF_WORK,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_LAND_PAID,
  HOLWEGE_OWNER_CONTINGENCY,
  HOLWEGE_PO,
  HOLWEGE_PROJECT_ID,
  holwegeBid,
  holwegeBudgetLines,
  holwegeDraws,
} from "@/data/holwege";

/** True when a project row is the Holwege Lot 16 system of record. */
export function isHolwegeProject(project: Pick<Project, "id" | "name" | "clientId">): boolean {
  return (
    project.id === HOLWEGE_PROJECT_ID ||
    project.clientId === HOLWEGE_CLIENT_ID ||
    /holwege/i.test(project.name)
  );
}

/**
 * Clamp a Holwege project budget to HOLWEGE_CONTRACT.
 * Rejects inflated drafts (e.g. DEFAULT_COSTS estimator ~$727k) and land-included totals.
 */
export function assertHolwegePricing<T extends Project>(project: T): T {
  if (!isHolwegeProject(project)) return project;
  if (project.budget === HOLWEGE_CONTRACT) return project;
  return { ...project, budget: HOLWEGE_CONTRACT };
}

export function assertHolwegeBid<T extends Bid>(bid: T): T {
  const isHolwege =
    bid.id === holwegeBid.id ||
    bid.clientId === HOLWEGE_CLIENT_ID ||
    bid.projectId === HOLWEGE_PROJECT_ID ||
    /holwege/i.test(bid.title);
  if (!isHolwege) return bid;
  if (bid.amount === HOLWEGE_CONTRACT) return bid;
  return {
    ...bid,
    amount: HOLWEGE_CONTRACT,
    lineItems: holwegeBid.lineItems.map((li) => ({ ...li })),
  };
}

/** Repair stale localStorage / CRM snapshots that carried wrong Holwege money. */
export function repairHolwegeMoneySlice<T extends {
  projects: Project[];
  bids: Bid[];
  draws?: ProgressDraw[];
  budgetLines?: BudgetLine[];
  clients?: Client[];
}>(slice: T): T {
  const projects = slice.projects.map(assertHolwegePricing);
  const bids = slice.bids.map(assertHolwegeBid);

  let draws = slice.draws;
  if (draws) {
    const hasHolwege = draws.some((d) => d.projectId === HOLWEGE_PROJECT_ID);
    if (hasHolwege) {
      const others = draws.filter((d) => d.projectId !== HOLWEGE_PROJECT_ID);
      draws = [...holwegeDraws.map((d) => ({ ...d })), ...others];
    }
  }

  let budgetLines = slice.budgetLines;
  if (budgetLines) {
    const hasHolwege = budgetLines.some((b) => b.projectId === HOLWEGE_PROJECT_ID);
    if (hasHolwege) {
      const others = budgetLines.filter((b) => b.projectId !== HOLWEGE_PROJECT_ID);
      budgetLines = [...holwegeBudgetLines.map((b) => ({ ...b })), ...others];
    }
  }

  return {
    ...slice,
    projects,
    bids,
    ...(draws ? { draws } : {}),
    ...(budgetLines ? { budgetLines } : {}),
  };
}

/** Documented verified stack — for UI copy / tests (never invent). */
export const HOLWEGE_PRICING_LOCK = {
  contract: HOLWEGE_CONTRACT,
  costOfWork: HOLWEGE_COST_OF_WORK,
  ownerContingency: HOLWEGE_OWNER_CONTINGENCY,
  po: HOLWEGE_PO,
  drawBase: HOLWEGE_DRAW_BASE,
  landExcluded: HOLWEGE_LAND_PAID,
  /** Estimator DEFAULT_COSTS+DEFAULT_ASSUMPTIONS produce ~727057 — never Holwege. */
  forbiddenDraftApprox: 727_057,
} as const;
