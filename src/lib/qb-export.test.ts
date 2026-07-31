import { describe, expect, it } from "vitest";
import { COST_CODES, activeCostCodes, defaultJobCostCodes, getCostCode } from "./cost-codes";
import {
  exportCostCodeChartCsv,
  exportQbClassesCsv,
  exportQbProductsServicesCsv,
  exportQbSyncScaffold,
  exportQbJobCostLinesCsv,
} from "./qb-export";
import type { JobPnl } from "./job-cost";

describe("cost code chart for QuickBooks", () => {
  it("has unique codes and required QB fields", () => {
    const codes = activeCostCodes();
    expect(codes.length).toBeGreaterThan(30);
    const ids = new Set(codes.map((c) => c.id));
    const skus = new Set(codes.map((c) => c.code));
    expect(ids.size).toBe(codes.length);
    expect(skus.size).toBe(codes.length);
    for (const c of codes) {
      expect(c.qbClass.length).toBeGreaterThan(0);
      expect(c.qbIncomeAccount.length).toBeGreaterThan(0);
      expect(c.qbExpenseAccount.length).toBeGreaterThan(0);
      expect(["Service", "NonInventory", "Category"]).toContain(c.qbItemType);
    }
  });

  it("preserves seed-facing ids", () => {
    for (const id of ["01-LAB", "01-MAT", "01-SUB", "03-FND", "15-MEP", "09-FIN", "21-FIRE", "05-STL"]) {
      expect(getCostCode(id)?.id).toBe(id);
    }
  });

  it("default job template is non-empty for residential", () => {
    const d = defaultJobCostCodes("residential");
    expect(d.some((c) => c.id === "01-LAB")).toBe(true);
    expect(d.every((c) => c.group !== "income")).toBe(true);
  });

  it("exports QB classes CSV with parent column", () => {
    const csv = exportQbClassesCsv();
    expect(csv.split("\n")[0]).toContain("Class Name");
    expect(csv).toContain("01-LAB");
    expect(csv).toContain("Progress Draws");
  });

  it("exports products & services with SKU", () => {
    const csv = exportQbProductsServicesCsv();
    expect(csv).toContain("SKU");
    expect(csv).toContain("Income Account");
    expect(csv).toContain("Expense Account");
    expect(csv).toContain("Self-perform labor");
  });

  it("exports full chart and sync scaffold", () => {
    const chart = exportCostCodeChartCsv();
    expect(chart).toContain("qb_class");
    expect(chart).toContain("qb_expense_account");
    const scaffold = exportQbSyncScaffold();
    expect(scaffold.version).toBe(1);
    expect(scaffold.costCodes.length).toBe(COST_CODES.filter((c) => c.active).length);
    expect(scaffold.quickbooks.accountsSuggested.length).toBeGreaterThan(5);
    expect(scaffold.quickbooks.mappingStrategy.costCodes).toContain("Class");
  });

  it("exports job lines CSV", () => {
    const pnl: JobPnl = {
      projectId: "p1",
      projectName: "Demo Job",
      contractValue: 100,
      baseContract: 100,
      approvedCos: 0,
      drawsPaid: 0,
      drawsPending: 0,
      budgeted: 50,
      committed: 40,
      actual: 20,
      remaining: 30,
      grossMargin: 80,
      grossMarginPct: 0.8,
      costVariance: 30,
      costPctUsed: 0.4,
      fieldProgress: 40,
      health: "healthy",
      lines: [
        {
          id: "1",
          projectId: "p1",
          costCodeId: "01-LAB",
          code: "01-LAB",
          name: "Labor",
          category: "Labor",
          budgeted: 50,
          committed: 40,
          actual: 20,
          remaining: 30,
          variance: 30,
          pctUsed: 0.4,
          overBudget: false,
          qbClass: "Resources:Labor",
        },
      ],
    };
    const csv = exportQbJobCostLinesCsv([pnl]);
    expect(csv).toContain("Demo Job");
    expect(csv).toContain("01-LAB");
    expect(csv).toContain("Class");
  });
});
