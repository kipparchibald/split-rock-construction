import { describe, expect, it } from "vitest";
import {
  estimateBucketsToBudget,
  resolveCostCodeId,
  costCodeForTrade,
  COST_CODES,
} from "./cost-codes";
import { buildJobPnl, jobCostToCsv, viewBudgetLine } from "./job-cost";
import { DEFAULT_ASSUMPTIONS, DEFAULT_COSTS, calcPrice } from "./pricing";
import type { BudgetLine, ChangeOrder, ProgressDraw, Project } from "@/data/types";

const baseProject: Project = {
  id: "p1",
  name: "Test Job",
  address: "1 Main",
  clientId: "c1",
  type: "residential",
  status: "in_progress",
  phase: "Framing",
  progress: 40,
  budget: 700000,
  spent: 200000,
  startDate: "2026-01-01",
  endDate: "2026-12-01",
  superintendent: "Tyler",
  sqft: 2000,
  description: "",
  milestones: [],
  schedule: [],
};

describe("cost codes", () => {
  it("has stable estimate-mapped codes", () => {
    const keys = COST_CODES.filter((c) => c.estimateKey).map((c) => c.estimateKey);
    expect(keys).toContain("siteWork");
    expect(keys).toContain("mep");
  });

  it("resolves legacy categories", () => {
    expect(resolveCostCodeId("Labor")).toBe("01-LAB");
    expect(resolveCostCodeId("Structural steel")).toBe("05-STR");
    expect(resolveCostCodeId("Contingency")).toBe("01-CONT");
  });

  it("maps trades for commercial", () => {
    expect(costCodeForTrade("Fire protection", "21")).toBe("21-FIRE");
    expect(costCodeForTrade("Electrical", "26")).toBe("15-MEP");
  });

  it("seeds budget rows from estimate buckets", () => {
    const price = calcPrice(DEFAULT_COSTS, DEFAULT_ASSUMPTIONS);
    const rows = estimateBucketsToBudget(DEFAULT_COSTS, {
      softCosts: DEFAULT_ASSUMPTIONS.softCosts,
      contingency: price.contingency,
      overheadProfit: price.markup,
    });
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.every((r) => r.budgeted > 0 && r.costCodeId)).toBe(true);
    const total = rows.reduce((s, r) => s + r.budgeted, 0);
    // hard + soft + contingency + OHP ≈ contract-ish (tax 0)
    expect(total).toBeGreaterThan(price.hardCosts);
    expect(total).toBeLessThanOrEqual(price.contractPrice + 1);
  });
});

describe("job P&L", () => {
  const lines: BudgetLine[] = [
    {
      id: "bl1",
      projectId: "p1",
      costCodeId: "01-LAB",
      category: "Labor",
      budgeted: 100000,
      committed: 90000,
      actual: 40000,
    },
    {
      id: "bl2",
      projectId: "p1",
      costCodeId: "01-MAT",
      category: "Materials",
      budgeted: 200000,
      committed: 150000,
      actual: 80000,
    },
  ];

  const draws: ProgressDraw[] = [
    {
      id: "d1",
      projectId: "p1",
      name: "Deposit",
      pct: 0.1,
      amount: 70000,
      status: "paid",
      trigger: "signed",
    },
    {
      id: "d2",
      projectId: "p1",
      name: "Foundation",
      pct: 0.15,
      amount: 105000,
      status: "ready",
      trigger: "inspected",
    },
  ];

  const cos: ChangeOrder[] = [
    {
      id: "co1",
      projectId: "p1",
      number: "CO-1",
      title: "Upgrade",
      amount: 10000,
      daysImpact: 0,
      status: "approved",
      requestedBy: "Owner",
      date: "2026-01-01",
      description: "",
    },
  ];

  it("views line with remaining and variance", () => {
    const v = viewBudgetLine(lines[0]!);
    expect(v.remaining).toBe(60000);
    expect(v.code).toBe("01-LAB");
    expect(v.overBudget).toBe(false);
  });

  it("builds contract + margin from costs and COs", () => {
    const pnl = buildJobPnl(baseProject, {
      budgetLines: lines,
      draws,
      changeOrders: cos,
      selections: [],
      subcontracts: [],
      payApplications: [],
    });
    expect(pnl.contractValue).toBe(710000);
    expect(pnl.budgeted).toBe(300000);
    expect(pnl.actual).toBe(120000);
    expect(pnl.grossMargin).toBe(710000 - 120000);
    expect(pnl.drawsPaid).toBe(70000);
    expect(pnl.drawsPending).toBe(105000);
    expect(pnl.health).toBe("healthy");
  });

  it("flags over budget", () => {
    const overLines: BudgetLine[] = [
      {
        id: "bl1",
        projectId: "p1",
        costCodeId: "01-LAB",
        category: "Labor",
        budgeted: 10000,
        committed: 10000,
        actual: 15000,
      },
    ];
    const pnl = buildJobPnl(baseProject, {
      budgetLines: overLines,
      draws: [],
      changeOrders: [],
      selections: [],
      subcontracts: [],
      payApplications: [],
    });
    expect(pnl.health).toBe("over");
    expect(pnl.lines[0]!.overBudget).toBe(true);
  });

  it("exports CSV with header and qb class", () => {
    const pnl = buildJobPnl(baseProject, {
      budgetLines: lines,
      draws,
      changeOrders: cos,
      selections: [],
      subcontracts: [],
      payApplications: [],
    });
    const csv = jobCostToCsv([pnl]);
    expect(csv.split("\n")[0]).toContain("qb_class");
    expect(csv).toContain("01-LAB");
    expect(csv).toContain("Test Job");
  });
});
