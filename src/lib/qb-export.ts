/**
 * QuickBooks Online–oriented export formats.
 * Import path today: CSV → QBO (Classes, Products & Services) or bookkeeper mapping.
 * JSON scaffold is the contract for a future live API sync.
 */

import { activeCostCodes, type CostCode } from "./cost-codes";
import type { JobPnl } from "./job-cost";
import { COMPANY } from "@/data/seed";

function csvEscape(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(cells: (string | number | boolean | undefined | null)[]) {
  return cells.map((c) => (c == null ? "" : csvEscape(String(c)))).join(",");
}

/** QBO Classes import-style CSV (Name + Parent + fully-qualified). */
export function exportQbClassesCsv(codes: CostCode[] = activeCostCodes()): string {
  const header = row(["Class Name", "Parent Class", "Fully Qualified Name", "Cost Code", "Active", "Description"]);
  const lines = [header];
  // Parents before children for import order
  const sorted = [...codes].sort((a, b) => {
    const ap = a.parentId ? 1 : 0;
    const bp = b.parentId ? 1 : 0;
    if (ap !== bp) return ap - bp;
    return a.sort - b.sort;
  });
  for (const c of sorted) {
    const parent = c.parentId ? codes.find((x) => x.id === c.parentId) : undefined;
    // Leaf class name is last segment of qbClass
    const segments = c.qbClass.split(":");
    const leaf = segments[segments.length - 1] ?? c.name;
    const parentName = parent ? parent.qbClass.split(":").pop() : segments.length > 1 ? segments[segments.length - 2] : "";
    lines.push(
      row([leaf, parentName ?? "", c.qbClass, c.code, c.active ? "Yes" : "No", c.description ?? c.name]),
    );
  }
  return lines.join("\n") + "\n";
}

/**
 * QBO Products & Services bulk-style CSV.
 * Columns align with common QBO import templates (Name, Type, SKU, accounts).
 */
export function exportQbProductsServicesCsv(codes: CostCode[] = activeCostCodes()): string {
  const header = row([
    "Product/Service Name",
    "SKU",
    "Type",
    "Sales Description",
    "Sales Price / Rate",
    "Income Account",
    "Purchase Description",
    "Purchase Cost",
    "Expense Account",
    "Class",
    "CSI",
    "Group",
    "Scope",
    "Active",
  ]);
  const lines = [header];
  for (const c of codes.filter((x) => x.qbItemType !== "Category" || !x.parentId).sort((a, b) => a.sort - b.sort)) {
    lines.push(
      row([
        c.name,
        c.code,
        c.qbItemType,
        c.description ?? c.name,
        0,
        c.qbIncomeAccount,
        c.name,
        0,
        c.qbExpenseAccount,
        c.qbClass,
        c.csi ?? "",
        c.group,
        c.scope,
        c.active ? "Yes" : "No",
      ]),
    );
  }
  return lines.join("\n") + "\n";
}

/** Flat chart for bookkeepers: one row per cost code with full QB mapping. */
export function exportCostCodeChartCsv(codes: CostCode[] = activeCostCodes()): string {
  const header = row([
    "cost_code",
    "name",
    "parent_code",
    "group",
    "csi",
    "scope",
    "qb_class",
    "qb_item_type",
    "qb_income_account",
    "qb_expense_account",
    "qb_account_kind",
    "default_on_job",
    "active",
    "description",
  ]);
  const lines = [header];
  for (const c of [...codes].sort((a, b) => a.sort - b.sort)) {
    const parent = c.parentId ? codes.find((x) => x.id === c.parentId) : undefined;
    lines.push(
      row([
        c.code,
        c.name,
        parent?.code ?? "",
        c.group,
        c.csi ?? "",
        c.scope,
        c.qbClass,
        c.qbItemType,
        c.qbIncomeAccount,
        c.qbExpenseAccount,
        c.qbAccountKind,
        c.defaultOnJob ? "Y" : "N",
        c.active ? "Y" : "N",
        c.description ?? "",
      ]),
    );
  }
  return lines.join("\n") + "\n";
}

/**
 * Job cost actuals shaped for classed expense entry / journal import.
 * One row per project × cost code with non-zero actual or budgeted.
 */
export function exportQbJobCostLinesCsv(pnls: JobPnl[]): string {
  const header = row([
    "Txn Date",
    "Project / Customer",
    "Cost Code",
    "Product/Service",
    "Class",
    "Expense Account",
    "Description",
    "Budgeted",
    "Committed",
    "Actual",
    "Remaining",
    "Income Account",
  ]);
  const lines = [header];
  const today = new Date().toISOString().slice(0, 10);
  for (const p of pnls) {
    for (const l of p.lines) {
      if (!l.budgeted && !l.actual && !l.committed) continue;
      lines.push(
        row([
          today,
          p.projectName,
          l.code,
          l.name,
          l.qbClass,
          // expense account from catalog when available — fall back
          `Job Costs:${l.qbClass}`,
          `${p.projectName} · ${l.code} ${l.name}`,
          l.budgeted,
          l.committed,
          l.actual,
          l.remaining,
          "Construction Income",
        ]),
      );
    }
  }
  return lines.join("\n") + "\n";
}

/** Machine-readable sync scaffold for a future QBO API connector. */
export function exportQbSyncScaffold(pnls: JobPnl[] = []) {
  const codes = activeCostCodes();
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    company: {
      name: COMPANY.name,
      location: COMPANY.location,
      entity: COMPANY.builderEntity,
    },
    quickbooks: {
      mode: "scaffold", // not live-connected
      mappingStrategy: {
        projects: "Customer + sub-customer (job) OR Project (QBO Advanced)",
        costCodes: "Class + Product/Service SKU",
        draws: "Invoice using 90-DRAW service + Revenue class",
        changeOrders: "Invoice line using 90-CO",
        payApps: "Invoice using 90-PAYAPP",
        subPayApps: "Bill using trade cost code Product/Service + Class",
        actuals: "Expense / Bill line Item + Class = cost code",
      },
      accountsSuggested: [
        { name: "Construction Income", type: "Income" },
        { name: "Construction Income:Progress Draws", type: "Income" },
        { name: "Construction Income:Change Orders", type: "Income" },
        { name: "Construction Income:Pay Applications", type: "Income" },
        { name: "Construction Income:Builder Fee", type: "Income" },
        { name: "Job Costs - COGS", type: "Cost of Goods Sold" },
        { name: "Job Costs:Labor", type: "Cost of Goods Sold" },
        { name: "Job Costs:Materials", type: "Cost of Goods Sold" },
        { name: "Job Costs:Subcontractors", type: "Cost of Goods Sold" },
        { name: "Job Costs:Equipment", type: "Cost of Goods Sold" },
        { name: "Job Costs:General Conditions", type: "Cost of Goods Sold" },
        { name: "Job Costs:Contingency", type: "Cost of Goods Sold" },
        { name: "Soft Costs:Design & Engineering", type: "Expense" },
        { name: "Soft Costs:Permits & Fees", type: "Expense" },
        { name: "Job Overhead", type: "Expense" },
        { name: "Land Acquisition", type: "Other Current Asset" },
      ],
    },
    costCodes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      parentId: c.parentId ?? null,
      group: c.group,
      csi: c.csi ?? null,
      scope: c.scope,
      qb: {
        class: c.qbClass,
        itemType: c.qbItemType,
        incomeAccount: c.qbIncomeAccount,
        expenseAccount: c.qbExpenseAccount,
        accountKind: c.qbAccountKind,
        sku: c.code,
      },
      defaultOnJob: c.defaultOnJob,
      active: c.active,
    })),
    jobs: pnls.map((p) => ({
      projectId: p.projectId,
      name: p.projectName,
      contractValue: p.contractValue,
      lines: p.lines.map((l) => ({
        costCode: l.code,
        qbClass: l.qbClass,
        budgeted: l.budgeted,
        committed: l.committed,
        actual: l.actual,
      })),
    })),
  };
}

export function exportQbSyncScaffoldJson(pnls: JobPnl[] = []): string {
  return JSON.stringify(exportQbSyncScaffold(pnls), null, 2) + "\n";
}

export type QbExportKind =
  | "classes"
  | "products"
  | "chart"
  | "job-lines"
  | "scaffold-json";

export function downloadTextFile(filename: string, content: string, mime: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function filenameForExport(kind: QbExportKind): string {
  const d = new Date().toISOString().slice(0, 10);
  const base = "split-rock";
  switch (kind) {
    case "classes":
      return `${base}-qb-classes-${d}.csv`;
    case "products":
      return `${base}-qb-products-services-${d}.csv`;
    case "chart":
      return `${base}-cost-code-chart-${d}.csv`;
    case "job-lines":
      return `${base}-qb-job-cost-lines-${d}.csv`;
    case "scaffold-json":
      return `${base}-qb-sync-scaffold-${d}.json`;
  }
}
