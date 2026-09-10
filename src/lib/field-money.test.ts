import { describe, expect, it } from "vitest";
import type { ChangeOrder, ProgressDraw } from "@/data/types";
import {
  applyApprovedCoToDraws,
  applyLaborBurnToBudgetLines,
  drawIdForChangeOrder,
  laborBurnCsv,
  laborBurnForProject,
  parseLaborBurnCsv,
} from "./field-money";

const baseDraws: ProgressDraw[] = [
  {
    id: "pd-holwege-1",
    projectId: "p-holwege",
    name: "Agreement + permit + mobilization",
    pct: 0.1,
    amount: 65_933.01,
    status: "ready",
    trigger: "Signed agreement",
  },
  {
    id: "pd-holwege-2",
    projectId: "p-holwege",
    name: "Foundation complete",
    pct: 0.1,
    amount: 65_933.01,
    status: "upcoming",
    trigger: "Foundation complete",
  },
];

const co: ChangeOrder = {
  id: "co-test-1",
  projectId: "p-holwege",
  number: "CO-001",
  title: "Add egress window well",
  amount: 4200,
  daysImpact: 2,
  status: "approved",
  requestedBy: "Kyle Christensen",
  date: "2026-09-10",
  description: "Owner-requested egress well",
};

describe("applyApprovedCoToDraws", () => {
  it("adds a CO draw without rewriting Holwege base amounts", () => {
    const next = applyApprovedCoToDraws(baseDraws, co, { approve: true });
    expect(next.find((d) => d.id === "pd-holwege-1")?.amount).toBe(65_933.01);
    expect(next.find((d) => d.id === "pd-holwege-2")?.amount).toBe(65_933.01);
    const coDraw = next.find((d) => d.id === drawIdForChangeOrder(co.id));
    expect(coDraw?.amount).toBe(4200);
    expect(coDraw?.status).toBe("ready");
    expect(coDraw?.projectId).toBe("p-holwege");
  });

  it("removes unpaid CO draw on reverse", () => {
    const approved = applyApprovedCoToDraws(baseDraws, co, { approve: true });
    const reversed = applyApprovedCoToDraws(approved, co, { approve: false });
    expect(reversed.some((d) => d.id === drawIdForChangeOrder(co.id))).toBe(false);
    expect(reversed).toHaveLength(2);
  });

  it("keeps paid CO draw on reverse", () => {
    let draws = applyApprovedCoToDraws(baseDraws, co, { approve: true });
    draws = draws.map((d) =>
      d.id === drawIdForChangeOrder(co.id) ? { ...d, status: "paid" as const, paidDate: "2026-09-11" } : d,
    );
    const reversed = applyApprovedCoToDraws(draws, co, { approve: false });
    expect(reversed.find((d) => d.id === drawIdForChangeOrder(co.id))?.status).toBe("paid");
  });
});

describe("laborBurnForProject", () => {
  it("rolls Holwege log hours × assigned rate", () => {
    const burn = laborBurnForProject(
      "p-holwege",
      [
        {
          id: "dl1",
          projectId: "p-holwege",
          date: "2026-09-10",
          weather: "clear",
          crewCount: 2,
          hours: 16,
          workDone: "Layout",
          author: "Kyle Christensen",
        },
      ],
      [
        {
          id: "m1",
          name: "Kyle Christensen",
          role: "Field Supervisor",
          trade: "General",
          phone: "",
          status: "active",
          rate: 55,
          certifications: [],
          projectId: "p-holwege",
        },
      ],
    );
    expect(burn.hours).toBe(16);
    expect(burn.laborCost).toBe(880);
    expect(burn.costCodeId).toBe("01-LAB");
  });
});

describe("labor burn CSV", () => {
  it("round-trips export → parse → budget actual", () => {
    const csv = laborBurnCsv(
      [{ projectId: "p-holwege", costCodeId: "01-LAB", hours: 16, laborCost: 880, crewCountDays: 2, logCount: 1 }],
      [{ id: "p-holwege", name: "Holwege Residence — Lot 16" }],
    );
    const { rows, errors } = parseLaborBurnCsv(csv);
    expect(errors).toEqual([]);
    expect(rows[0]?.laborCost).toBe(880);
    const lines = applyLaborBurnToBudgetLines(
      [
        {
          id: "bl-holwege-cow",
          projectId: "p-holwege",
          costCodeId: "01-SUB",
          category: "Cost of work",
          budgeted: 1,
          committed: 0,
          actual: 0,
        },
      ],
      rows,
    );
    expect(lines.some((b) => b.costCodeId === "01-LAB" && b.actual === 880)).toBe(true);
  });
});
