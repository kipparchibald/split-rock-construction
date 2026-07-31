/**
 * Split Rock construction cost-code chart.
 *
 * Designed so accounting scaffolding syncs cleanly with QuickBooks Online:
 * - Stable `code` = SKU / Class name fragment
 * - `qbClass` = QBO Class (job cost dimension)
 * - `qbIncomeAccount` / `qbExpenseAccount` = chart-of-accounts suggestions
 * - `qbItemType` = Products & Services type
 *
 * This is NOT a full GL — books stay in QuickBooks; Split Rock owns job cost.
 */

import type { CostInputs } from "./pricing";

export type CostCodeGroup =
  | "hard"
  | "soft"
  | "overhead"
  | "contingency"
  | "income"
  | "resource";

/** QBO Products & Services type */
export type QbItemType = "Service" | "NonInventory" | "Category";

/** Suggested P&L placement in QBO */
export type QbAccountKind = "Income" | "Cost of Goods Sold" | "Expense" | "Other Current Asset";

export interface CostCode {
  id: string;
  /** Stable short code — use as SKU / export key */
  code: string;
  name: string;
  group: CostCodeGroup;
  /** QBO Class name (create under parent when parentCode set) */
  qbClass: string;
  /** Parent cost code id for hierarchy (Classes / Categories) */
  parentId?: string;
  /** CSI MasterFormat division (approx.) */
  csi?: string;
  /** Bid & Price CostInputs key when seeding budgets */
  estimateKey?: keyof CostInputs;
  scope: "residential" | "commercial" | "both";
  /** QBO Products & Services type */
  qbItemType: QbItemType;
  /** Suggested income account name in QBO */
  qbIncomeAccount: string;
  /** Suggested expense / COGS account name in QBO */
  qbExpenseAccount: string;
  qbAccountKind: QbAccountKind;
  /** Include in default job budget template */
  defaultOnJob: boolean;
  /** Sort order in UI / export */
  sort: number;
  description?: string;
  active: boolean;
}

function cc(
  partial: Omit<CostCode, "active" | "qbItemType" | "qbIncomeAccount" | "qbExpenseAccount" | "qbAccountKind" | "defaultOnJob" | "scope"> &
    Partial<Pick<CostCode, "active" | "qbItemType" | "qbIncomeAccount" | "qbExpenseAccount" | "qbAccountKind" | "defaultOnJob" | "description" | "scope">>,
): CostCode {
  const isIncome = partial.group === "income";
  return {
    scope: "both",
    active: true,
    qbItemType: partial.qbItemType ?? (partial.parentId ? "Service" : "Category"),
    qbIncomeAccount: partial.qbIncomeAccount ?? "Construction Income",
    qbExpenseAccount:
      partial.qbExpenseAccount ??
      (partial.group === "overhead" || partial.group === "soft"
        ? "Job Overhead"
        : "Job Costs - COGS"),
    qbAccountKind: partial.qbAccountKind ?? (isIncome ? "Income" : "Cost of Goods Sold"),
    defaultOnJob: partial.defaultOnJob ?? false,
    description: partial.description,
    ...partial,
  } as CostCode;
}

/**
 * Full catalog — parents first by sort, then children.
 * IDs for codes already used in seed data are preserved.
 */
export const COST_CODES: CostCode[] = [
  // ── Income (revenue classes for draws / contracts) ───────────────────────
  cc({
    id: "90-REV",
    code: "90-REV",
    name: "Construction revenue",
    group: "income",
    qbClass: "Revenue",
    sort: 10,
    qbItemType: "Category",
    qbAccountKind: "Income",
    description: "Parent class for contract draws and progress billings",
  }),
  cc({
    id: "90-DRAW",
    code: "90-DRAW",
    name: "Progress draws",
    group: "income",
    qbClass: "Revenue:Progress Draws",
    parentId: "90-REV",
    sort: 11,
    qbItemType: "Service",
    qbAccountKind: "Income",
    qbIncomeAccount: "Construction Income:Progress Draws",
    description: "Owner progress payments / AIA-style draws",
  }),
  cc({
    id: "90-CO",
    code: "90-CO",
    name: "Change order revenue",
    group: "income",
    qbClass: "Revenue:Change Orders",
    parentId: "90-REV",
    sort: 12,
    qbItemType: "Service",
    qbAccountKind: "Income",
    qbIncomeAccount: "Construction Income:Change Orders",
  }),
  cc({
    id: "90-PAYAPP",
    code: "90-PAYAPP",
    name: "Commercial pay applications",
    group: "income",
    qbClass: "Revenue:Pay Applications",
    parentId: "90-REV",
    sort: 13,
    qbItemType: "Service",
    qbAccountKind: "Income",
    qbIncomeAccount: "Construction Income:Pay Applications",
    scope: "commercial",
  }),

  // ── Soft / land ──────────────────────────────────────────────────────────
  cc({
    id: "00-LAND",
    code: "00-LAND",
    name: "Land",
    group: "soft",
    qbClass: "Land",
    estimateKey: "land",
    scope: "both",
    sort: 100,
    qbItemType: "Service",
    qbExpenseAccount: "Land Acquisition",
    qbAccountKind: "Other Current Asset",
    defaultOnJob: false,
    description: "Lot / land when carried in job cost",
  }),
  cc({
    id: "01-SOFT",
    code: "01-SOFT",
    name: "Soft costs / design",
    group: "soft",
    qbClass: "Soft Costs",
    scope: "both",
    sort: 110,
    qbItemType: "Service",
    qbExpenseAccount: "Soft Costs:Design & Engineering",
    defaultOnJob: true,
  }),
  cc({
    id: "01-PERM",
    code: "01-PERM",
    name: "Permits & fees",
    group: "soft",
    qbClass: "Soft Costs:Permits & Fees",
    parentId: "01-SOFT",
    estimateKey: "permitsFees",
    scope: "both",
    sort: 111,
    qbItemType: "Service",
    qbExpenseAccount: "Soft Costs:Permits & Fees",
    defaultOnJob: true,
  }),
  cc({
    id: "01-GC",
    code: "01-GC",
    name: "General conditions",
    group: "soft",
    qbClass: "General Conditions",
    scope: "both",
    sort: 120,
    qbItemType: "Service",
    qbExpenseAccount: "Job Costs:General Conditions",
    defaultOnJob: true,
    description: "Temp facilities, cleanup, site supervision burden",
  }),
  cc({
    id: "01-SUP",
    code: "01-SUP",
    name: "Supervision / PM",
    group: "soft",
    qbClass: "General Conditions:Supervision",
    parentId: "01-GC",
    scope: "both",
    sort: 121,
    qbItemType: "Service",
    qbExpenseAccount: "Job Costs:Supervision",
  }),

  // ── Resource codes (how money is spent) ──────────────────────────────────
  cc({
    id: "01-LAB",
    code: "01-LAB",
    name: "Self-perform labor",
    group: "resource",
    qbClass: "Resources:Labor",
    scope: "both",
    sort: 200,
    qbItemType: "Service",
    qbExpenseAccount: "Job Costs:Labor",
    defaultOnJob: true,
  }),
  cc({
    id: "01-MAT",
    code: "01-MAT",
    name: "Materials",
    group: "resource",
    qbClass: "Resources:Materials",
    scope: "both",
    sort: 201,
    qbItemType: "NonInventory",
    qbExpenseAccount: "Job Costs:Materials",
    defaultOnJob: true,
  }),
  cc({
    id: "01-SUB",
    code: "01-SUB",
    name: "Subcontractors",
    group: "resource",
    qbClass: "Resources:Subcontractors",
    scope: "both",
    sort: 202,
    qbItemType: "Service",
    qbExpenseAccount: "Job Costs:Subcontractors",
    defaultOnJob: true,
    csi: "varies",
  }),
  cc({
    id: "01-EQP",
    code: "01-EQP",
    name: "Equipment",
    group: "resource",
    qbClass: "Resources:Equipment",
    scope: "both",
    sort: 203,
    qbItemType: "Service",
    qbExpenseAccount: "Job Costs:Equipment",
    defaultOnJob: true,
  }),

  // ── Hard costs by CSI-ish division ───────────────────────────────────────
  cc({
    id: "02-SITE",
    code: "02-SITE",
    name: "Site work",
    group: "hard",
    qbClass: "02 Site Work",
    csi: "02",
    estimateKey: "siteWork",
    scope: "both",
    sort: 300,
    qbItemType: "Service",
    defaultOnJob: true,
  }),
  cc({
    id: "02-UTIL",
    code: "02-UTIL",
    name: "Site utilities",
    group: "hard",
    qbClass: "02 Site Work:Utilities",
    parentId: "02-SITE",
    csi: "02",
    scope: "both",
    sort: 301,
    qbItemType: "Service",
  }),
  cc({
    id: "02-GRAD",
    code: "02-GRAD",
    name: "Grading / excavation",
    group: "hard",
    qbClass: "02 Site Work:Grading",
    parentId: "02-SITE",
    csi: "02",
    scope: "both",
    sort: 302,
    qbItemType: "Service",
  }),

  cc({
    id: "03-FND",
    code: "03-FND",
    name: "Foundation / concrete",
    group: "hard",
    qbClass: "03 Concrete",
    csi: "03",
    estimateKey: "foundation",
    scope: "both",
    sort: 310,
    qbItemType: "Service",
    defaultOnJob: true,
  }),
  cc({
    id: "03-FLAT",
    code: "03-FLAT",
    name: "Flatwork / slabs",
    group: "hard",
    qbClass: "03 Concrete:Flatwork",
    parentId: "03-FND",
    csi: "03",
    scope: "both",
    sort: 311,
    qbItemType: "Service",
  }),

  cc({
    id: "04-MAS",
    code: "04-MAS",
    name: "Masonry",
    group: "hard",
    qbClass: "04 Masonry",
    csi: "04",
    scope: "both",
    sort: 320,
    qbItemType: "Service",
  }),

  cc({
    id: "05-STR",
    code: "05-STR",
    name: "Structure / framing",
    group: "hard",
    qbClass: "05/06 Structure",
    csi: "05/06",
    estimateKey: "structure",
    scope: "both",
    sort: 330,
    qbItemType: "Service",
    defaultOnJob: true,
  }),
  cc({
    id: "05-STL",
    code: "05-STL",
    name: "Structural steel",
    group: "hard",
    qbClass: "05 Structure:Steel",
    parentId: "05-STR",
    csi: "05",
    scope: "commercial",
    sort: 331,
    qbItemType: "Service",
    defaultOnJob: false,
  }),
  cc({
    id: "06-WOOD",
    code: "06-WOOD",
    name: "Wood framing / rough carpentry",
    group: "hard",
    qbClass: "06 Wood:Framing",
    parentId: "05-STR",
    csi: "06",
    scope: "residential",
    sort: 332,
    qbItemType: "Service",
  }),

  cc({
    id: "07-ENV",
    code: "07-ENV",
    name: "Envelope / shell",
    group: "hard",
    qbClass: "07 Thermal & Moisture",
    csi: "07",
    scope: "both",
    sort: 340,
    qbItemType: "Service",
    defaultOnJob: true,
  }),
  cc({
    id: "07-ROOF",
    code: "07-ROOF",
    name: "Roofing",
    group: "hard",
    qbClass: "07 Envelope:Roofing",
    parentId: "07-ENV",
    csi: "07",
    scope: "both",
    sort: 341,
    qbItemType: "Service",
  }),
  cc({
    id: "07-SID",
    code: "07-SID",
    name: "Siding / cladding",
    group: "hard",
    qbClass: "07 Envelope:Siding",
    parentId: "07-ENV",
    csi: "07",
    scope: "both",
    sort: 342,
    qbItemType: "Service",
  }),
  cc({
    id: "08-OPEN",
    code: "08-OPEN",
    name: "Openings (doors / windows)",
    group: "hard",
    qbClass: "08 Openings",
    csi: "08",
    scope: "both",
    sort: 350,
    qbItemType: "Service",
  }),

  cc({
    id: "09-FIN",
    code: "09-FIN",
    name: "Finishes",
    group: "hard",
    qbClass: "09 Finishes",
    csi: "09",
    estimateKey: "finishes",
    scope: "both",
    sort: 360,
    qbItemType: "Service",
    defaultOnJob: true,
  }),
  cc({
    id: "09-DRY",
    code: "09-DRY",
    name: "Drywall",
    group: "hard",
    qbClass: "09 Finishes:Drywall",
    parentId: "09-FIN",
    csi: "09",
    scope: "both",
    sort: 361,
    qbItemType: "Service",
  }),
  cc({
    id: "09-FLR",
    code: "09-FLR",
    name: "Flooring",
    group: "hard",
    qbClass: "09 Finishes:Flooring",
    parentId: "09-FIN",
    csi: "09",
    scope: "both",
    sort: 362,
    qbItemType: "Service",
  }),
  cc({
    id: "09-PNT",
    code: "09-PNT",
    name: "Paint",
    group: "hard",
    qbClass: "09 Finishes:Paint",
    parentId: "09-FIN",
    csi: "09",
    scope: "both",
    sort: 363,
    qbItemType: "Service",
  }),
  cc({
    id: "09-CAB",
    code: "09-CAB",
    name: "Cabinets & counters",
    group: "hard",
    qbClass: "09 Finishes:Cabinets",
    parentId: "09-FIN",
    csi: "06/09",
    scope: "residential",
    sort: 364,
    qbItemType: "Service",
  }),

  cc({
    id: "15-MEP",
    code: "15-MEP",
    name: "MEP",
    group: "hard",
    qbClass: "MEP",
    csi: "21-28",
    estimateKey: "mep",
    scope: "both",
    sort: 400,
    qbItemType: "Category",
    defaultOnJob: true,
  }),
  cc({
    id: "22-PLB",
    code: "22-PLB",
    name: "Plumbing",
    group: "hard",
    qbClass: "MEP:Plumbing",
    parentId: "15-MEP",
    csi: "22",
    scope: "both",
    sort: 401,
    qbItemType: "Service",
  }),
  cc({
    id: "23-HVAC",
    code: "23-HVAC",
    name: "HVAC",
    group: "hard",
    qbClass: "MEP:HVAC",
    parentId: "15-MEP",
    csi: "23",
    scope: "both",
    sort: 402,
    qbItemType: "Service",
  }),
  cc({
    id: "26-ELE",
    code: "26-ELE",
    name: "Electrical",
    group: "hard",
    qbClass: "MEP:Electrical",
    parentId: "15-MEP",
    csi: "26",
    scope: "both",
    sort: 403,
    qbItemType: "Service",
  }),
  cc({
    id: "21-FIRE",
    code: "21-FIRE",
    name: "Fire protection",
    group: "hard",
    qbClass: "MEP:Fire Protection",
    parentId: "15-MEP",
    csi: "21",
    scope: "commercial",
    sort: 404,
    qbItemType: "Service",
  }),

  cc({
    id: "32-LAND",
    code: "32-LAND",
    name: "Landscaping",
    group: "hard",
    qbClass: "32 Exterior Improvements",
    csi: "32",
    estimateKey: "landscaping",
    scope: "both",
    sort: 450,
    qbItemType: "Service",
    defaultOnJob: true,
  }),

  cc({
    id: "01-OTH",
    code: "01-OTH",
    name: "Other hard costs",
    group: "hard",
    qbClass: "Other Hard Costs",
    estimateKey: "other",
    scope: "both",
    sort: 490,
    qbItemType: "Service",
    defaultOnJob: true,
  }),

  // ── Contingency / fee ────────────────────────────────────────────────────
  cc({
    id: "01-CONT",
    code: "01-CONT",
    name: "Contingency",
    group: "contingency",
    qbClass: "Contingency",
    scope: "both",
    sort: 500,
    qbItemType: "Service",
    qbExpenseAccount: "Job Costs:Contingency",
    defaultOnJob: true,
  }),
  cc({
    id: "01-OHP",
    code: "01-OHP",
    name: "Overhead & profit (fee)",
    group: "overhead",
    qbClass: "Fee:OHP",
    scope: "both",
    sort: 510,
    qbItemType: "Service",
    qbIncomeAccount: "Construction Income:Builder Fee",
    qbExpenseAccount: "Job Overhead:OHP Allocation",
    qbAccountKind: "Income",
    defaultOnJob: true,
    description: "Builder fee / OH&P — often income, tracked for job margin",
  }),
];

// Rebuild maps after definition
const byId = new Map(COST_CODES.map((c) => [c.id, c]));
const byCode = new Map(COST_CODES.map((c) => [c.code, c]));

export function getCostCode(idOrCode: string): CostCode | undefined {
  return byId.get(idOrCode) ?? byCode.get(idOrCode);
}

export function costCodeLabel(idOrCode: string): string {
  const c = getCostCode(idOrCode);
  return c ? `${c.code} · ${c.name}` : idOrCode;
}

export function activeCostCodes(): CostCode[] {
  return COST_CODES.filter((c) => c.active).sort((a, b) => a.sort - b.sort);
}

export function defaultJobCostCodes(scope: "residential" | "commercial" | "both" = "both"): CostCode[] {
  return activeCostCodes().filter(
    (c) =>
      c.defaultOnJob &&
      c.group !== "income" &&
      (scope === "both" || c.scope === "both" || c.scope === scope),
  );
}

/** Map freeform / legacy category names onto catalog codes. */
export function resolveCostCodeId(category: string): string {
  const n = category.trim().toLowerCase();
  const table: [RegExp, string][] = [
    [/\bland\b(?!scap)/, "00-LAND"],
    [/site util|utilities/, "02-UTIL"],
    [/grad|excav/, "02-GRAD"],
    [/site/, "02-SITE"],
    [/flatwork|slab/, "03-FLAT"],
    [/found|concrete/, "03-FND"],
    [/mason/, "04-MAS"],
    [/steel/, "05-STL"],
    [/fram|wood|carpentry/, "06-WOOD"],
    [/struct/, "05-STR"],
    [/roof/, "07-ROOF"],
    [/sid(ing)?|clad/, "07-SID"],
    [/envelope|shell|moisture/, "07-ENV"],
    [/door|window|opening/, "08-OPEN"],
    [/drywall/, "09-DRY"],
    [/floor/, "09-FLR"],
    [/paint/, "09-PNT"],
    [/cabin|counter/, "09-CAB"],
    [/finish|interior/, "09-FIN"],
    [/plumb/, "22-PLB"],
    [/hvac|mech/, "23-HVAC"],
    [/electr/, "26-ELE"],
    [/fire/, "21-FIRE"],
    [/\bmep\b/, "15-MEP"],
    [/landscap|hardscape/, "32-LAND"],
    [/permit|fee/, "01-PERM"],
    [/supervis|pm\b|project manag/, "01-SUP"],
    [/labor|self.?perf/, "01-LAB"],
    [/material/, "01-MAT"],
    [/sub|buyout/, "01-SUB"],
    [/equip/, "01-EQP"],
    [/general condition|gen\.?\s*cond/, "01-GC"],
    [/soft|design|architect/, "01-SOFT"],
    [/contingen/, "01-CONT"],
    [/overhead|ohp|gc fee|fee \/|profit|builder fee/, "01-OHP"],
    [/draw|progress bill/, "90-DRAW"],
    [/change order|co revenue/, "90-CO"],
    [/pay.?app/, "90-PAYAPP"],
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
  if (/steel|05/.test(t) && /struct|steel/.test(t)) return "05-STL";
  if (/concrete|found|03/.test(t)) return "03-FND";
  if (/envelope|roof|skin|metal panel|tilt|07/.test(t)) return "07-ENV";
  if (/plumb|22/.test(t)) return "22-PLB";
  if (/hvac|mech|23/.test(t)) return "23-HVAC";
  if (/electr|26/.test(t)) return "26-ELE";
  if (/mep|15/.test(t)) return "15-MEP";
  if (/site|earth|util|02/.test(t)) return "02-SITE";
  if (/paint|finish|drywall|floor|09/.test(t)) return "09-FIN";
  if (/fram|06/.test(t)) return "06-WOOD";
  return "01-SUB";
}

/** Estimate CostInputs → budget seed rows (budgeted only). */
export function estimateBucketsToBudget(
  costs: CostInputs,
  extras?: { softCosts?: number; contingency?: number; overheadProfit?: number },
): { costCodeId: string; category: string; budgeted: number }[] {
  const rows: { costCodeId: string; category: string; budgeted: number }[] = [];
  for (const code of COST_CODES) {
    if (!code.estimateKey || !code.active) continue;
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
