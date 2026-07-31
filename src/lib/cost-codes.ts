/**
 * Shared construction cost-code catalog for Split Rock.
 * Codes are stable IDs for job cost, estimates, and a future QuickBooks map
 * (Class / Product-Service). Not a full GL chart of accounts.
 */

import type { CostInputs } from "./pricing";

export type CostCodeGroup = "hard" | "soft" | "overhead" | "contingency";

export interface CostCode {
  id: string;
  /** Short code shown in UI / exports */
  code: string;
  name: string;
  group: CostCodeGroup;
  /** Suggested QuickBooks Class or Item name */
  qbClass: string;
  /** CSI-ish division hint (commercial) */
  csi?: string;
  /** Maps Bid & Price CostInputs key when seeding a budget from an estimate */
  estimateKey?: keyof CostInputs;
  /** Residential vs commercial emphasis */
  scope: "residential" | "commercial" | "both";
}

export const COST_CODES: CostCode[] = [
  {
    id: "00-LAND",
    code: "00-LAND",
    name: "Land",
    group: "soft",
    qbClass: "Land",
    estimateKey: "land",
    scope: "both",
  },
  {
    id: "02-SITE",
    code: "02-SITE",
    name: "Site work",
    group: "hard",
    qbClass: "Site Work",
    csi: "02",
    estimateKey: "siteWork",
    scope: "both",
  },
  {
    id: "03-FND",
    code: "03-FND",
    name: "Foundation / concrete",
    group: "hard",
    qbClass: "Foundation",
    csi: "03",
    estimateKey: "foundation",
    scope: "both",
  },
  {
    id: "05-STR",
    code: "05-STR",
    name: "Structure / framing",
    group: "hard",
    qbClass: "Structure",
    csi: "05/06",
    estimateKey: "structure",
    scope: "both",
  },
  {
    id: "15-MEP",
    code: "15-MEP",
    name: "MEP",
    group: "hard",
    qbClass: "MEP",
    csi: "15/22/23/26",
    estimateKey: "mep",
    scope: "both",
  },
  {
    id: "09-FIN",
    code: "09-FIN",
    name: "Finishes",
    group: "hard",
    qbClass: "Finishes",
    csi: "09",
    estimateKey: "finishes",
    scope: "both",
  },
  {
    id: "32-LAND",
    code: "32-LAND",
    name: "Landscaping",
    group: "hard",
    qbClass: "Landscaping",
    csi: "32",
    estimateKey: "landscaping",
    scope: "both",
  },
  {
    id: "01-PERM",
    code: "01-PERM",
    name: "Permits & fees",
    group: "soft",
    qbClass: "Permits Fees",
    estimateKey: "permitsFees",
    scope: "both",
  },
  {
    id: "01-OTH",
    code: "01-OTH",
    name: "Other hard costs",
    group: "hard",
    qbClass: "Other Hard",
    estimateKey: "other",
    scope: "both",
  },
  {
    id: "01-LAB",
    code: "01-LAB",
    name: "Self-perform labor",
    group: "hard",
    qbClass: "Labor",
    scope: "both",
  },
  {
    id: "01-MAT",
    code: "01-MAT",
    name: "Materials",
    group: "hard",
    qbClass: "Materials",
    scope: "both",
  },
  {
    id: "01-SUB",
    code: "01-SUB",
    name: "Subcontractors",
    group: "hard",
    qbClass: "Subcontractors",
    csi: "varies",
    scope: "both",
  },
  {
    id: "01-EQP",
    code: "01-EQP",
    name: "Equipment",
    group: "hard",
    qbClass: "Equipment",
    scope: "both",
  },
  {
    id: "01-GC",
    code: "01-GC",
    name: "General conditions",
    group: "soft",
    qbClass: "General Conditions",
    scope: "both",
  },
  {
    id: "01-SOFT",
    code: "01-SOFT",
    name: "Soft costs / design",
    group: "soft",
    qbClass: "Soft Costs",
    scope: "both",
  },
  {
    id: "01-CONT",
    code: "01-CONT",
    name: "Contingency",
    group: "contingency",
    qbClass: "Contingency",
    scope: "both",
  },
  {
    id: "01-OHP",
    code: "01-OHP",
    name: "Overhead & profit (fee)",
    group: "overhead",
    qbClass: "OHP Fee",
    scope: "both",
  },
  {
    id: "05-STL",
    code: "05-STL",
    name: "Structural steel",
    group: "hard",
    qbClass: "Structural Steel",
    csi: "05",
    scope: "commercial",
  },
  {
    id: "07-ENV",
    code: "07-ENV",
    name: "Envelope / shell",
    group: "hard",
    qbClass: "Envelope",
    csi: "07",
    scope: "commercial",
  },
  {
    id: "21-FIRE",
    code: "21-FIRE",
    name: "Fire protection",
    group: "hard",
    qbClass: "Fire Protection",
    csi: "21",
    scope: "commercial",
  },
];

const byId = new Map(COST_CODES.map((c) => [c.id, c]));
const byCode = new Map(COST_CODES.map((c) => [c.code, c]));

export function getCostCode(idOrCode: string): CostCode | undefined {
  return byId.get(idOrCode) ?? byCode.get(idOrCode);
}

export function costCodeLabel(idOrCode: string): string {
  const c = getCostCode(idOrCode);
  return c ? `${c.code} · ${c.name}` : idOrCode;
}

/** Map freeform / legacy category names onto catalog codes. */
export function resolveCostCodeId(category: string): string {
  const n = category.trim().toLowerCase();
  const table: [RegExp, string][] = [
    [/\bland\b(?!scap)/, "00-LAND"],
    [/site/, "02-SITE"],
    [/found|concrete/, "03-FND"],
    [/struct|fram|steel/, "05-STR"],
    [/\bmep\b|electr|plumb|hvac|mech/, "15-MEP"],
    [/finish|interior|cabin|floor|counter/, "09-FIN"],
    [/landscap|hardscape/, "32-LAND"],
    [/permit|fee/, "01-PERM"],
    [/labor|self.?perf/, "01-LAB"],
    [/material/, "01-MAT"],
    [/sub|buyout/, "01-SUB"],
    [/equip/, "01-EQP"],
    [/general condition|gen\.?\s*cond/, "01-GC"],
    [/soft|design|architect/, "01-SOFT"],
    [/contingen/, "01-CONT"],
    [/overhead|ohp|gc fee|fee \/|profit/, "01-OHP"],
    [/envelope|shell|curtain/, "07-ENV"],
    [/fire/, "21-FIRE"],
    [/other/, "01-OTH"],
  ];
  for (const [re, id] of table) {
    if (re.test(n)) return id;
  }
  return "01-OTH";
}

/** Map commercial sub trade / CSI → cost code. */
export function costCodeForTrade(trade: string, csiDivision?: string): string {
  const t = `${trade} ${csiDivision ?? ""}`.toLowerCase();
  if (/fire|21/.test(t)) return "21-FIRE";
  if (/steel|struct/.test(t)) return "05-STL";
  if (/concrete|found/.test(t)) return "03-FND";
  if (/envelope|roof|skin|metal panel|tilt/.test(t)) return "07-ENV";
  if (/electr|plumb|hvac|mech|mep/.test(t)) return "15-MEP";
  if (/site|earth|util/.test(t)) return "02-SITE";
  if (/paint|finish|drywall|floor/.test(t)) return "09-FIN";
  return "01-SUB";
}

/** Estimate CostInputs → budget seed rows (budgeted only). */
export function estimateBucketsToBudget(
  costs: CostInputs,
  extras?: { softCosts?: number; contingency?: number; overheadProfit?: number },
): { costCodeId: string; category: string; budgeted: number }[] {
  const rows: { costCodeId: string; category: string; budgeted: number }[] = [];
  for (const code of COST_CODES) {
    if (!code.estimateKey) continue;
    const amount = Math.round(costs[code.estimateKey] || 0);
    if (amount <= 0) continue;
    rows.push({ costCodeId: code.id, category: code.name, budgeted: amount });
  }
  if (extras?.softCosts && extras.softCosts > 0) {
    rows.push({ costCodeId: "01-SOFT", category: "Soft costs / design", budgeted: Math.round(extras.softCosts) });
  }
  if (extras?.contingency && extras.contingency > 0) {
    rows.push({ costCodeId: "01-CONT", category: "Contingency", budgeted: Math.round(extras.contingency) });
  }
  if (extras?.overheadProfit && extras.overheadProfit > 0) {
    rows.push({ costCodeId: "01-OHP", category: "Overhead & profit (fee)", budgeted: Math.round(extras.overheadProfit) });
  }
  return rows;
}
