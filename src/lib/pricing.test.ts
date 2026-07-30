import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_COSTS,
  STANDARD_DRAWS,
  buildDrawSchedule,
  calcBuilderFinance,
  calcPrice,
  hardCostTotal,
} from "./pricing";

describe("hardCostTotal", () => {
  it("sums all cost lines", () => {
    const total =
      DEFAULT_COSTS.land +
      DEFAULT_COSTS.siteWork +
      DEFAULT_COSTS.foundation +
      DEFAULT_COSTS.structure +
      DEFAULT_COSTS.mep +
      DEFAULT_COSTS.finishes +
      DEFAULT_COSTS.landscaping +
      DEFAULT_COSTS.permitsFees +
      DEFAULT_COSTS.other;
    expect(hardCostTotal(DEFAULT_COSTS)).toBe(total);
  });

  it("handles zeroed costs", () => {
    expect(
      hardCostTotal({
        land: 0,
        siteWork: 0,
        foundation: 0,
        structure: 0,
        mep: 0,
        finishes: 0,
        landscaping: 0,
        permitsFees: 0,
        other: 0,
      }),
    ).toBe(0);
  });
});

describe("calcPrice", () => {
  it("builds a contract price above hard costs for default assumptions", () => {
    const price = calcPrice(DEFAULT_COSTS, DEFAULT_ASSUMPTIONS, 2400);
    const hard = hardCostTotal(DEFAULT_COSTS);
    expect(price.hardCosts).toBe(hard);
    expect(price.contractPrice).toBeGreaterThan(hard);
    expect(price.contingency).toBe(Math.round(hard * 0.05));
    expect(price.overhead).toBeGreaterThan(0);
    expect(price.profit).toBeGreaterThan(0);
    expect(price.markup).toBe(price.overhead + price.profit);
    expect(price.totalOhpPct).toBe(DEFAULT_ASSUMPTIONS.overheadPct + DEFAULT_ASSUMPTIONS.profitPct);
    expect(price.costPerSqft).toBe(Math.round(price.contractPrice / 2400));
  });

  it("returns null costPerSqft when sqft missing", () => {
    const price = calcPrice(DEFAULT_COSTS, DEFAULT_ASSUMPTIONS);
    expect(price.costPerSqft).toBeNull();
  });

  it("flags prices below the safe floor when OH+P is too low", () => {
    const price = calcPrice(DEFAULT_COSTS, {
      overheadPct: 0,
      profitPct: 0,
      contingencyPct: 0,
      softCosts: 0,
      taxPct: 0,
    });
    // minSafe = hard + soft + 12% of hard; with zero OH/P/contingency/soft, contract = hard only
    expect(price.contractPrice).toBeLessThan(price.minSafePrice);
  });

  it("applies tax when taxPct is set", () => {
    const noTax = calcPrice(DEFAULT_COSTS, { ...DEFAULT_ASSUMPTIONS, taxPct: 0 });
    const withTax = calcPrice(DEFAULT_COSTS, { ...DEFAULT_ASSUMPTIONS, taxPct: 6 });
    expect(withTax.tax).toBeGreaterThan(0);
    expect(withTax.contractPrice).toBeGreaterThan(noTax.contractPrice);
  });

  it("lets overhead and profit be tuned independently while preserving total", () => {
    const a = calcPrice(DEFAULT_COSTS, { ...DEFAULT_ASSUMPTIONS, overheadPct: 12, profitPct: 6 });
    const b = calcPrice(DEFAULT_COSTS, { ...DEFAULT_ASSUMPTIONS, overheadPct: 6, profitPct: 12 });
    // Same total OH+P % → same contract price (both applied to the same base)
    expect(a.contractPrice).toBe(b.contractPrice);
    expect(a.overhead).toBeGreaterThan(b.overhead);
    expect(a.profit).toBeLessThan(b.profit);
  });
});

describe("buildDrawSchedule", () => {
  it("standard draw percentages sum to 100%", () => {
    const sum = STANDARD_DRAWS.reduce((s, d) => s + d.pct, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("draw amounts sum exactly to contract price", () => {
    const contract = 685_000;
    const schedule = buildDrawSchedule(contract);
    const total = schedule.reduce((s, row) => s + row.amount, 0);
    expect(total).toBe(contract);
    expect(schedule.at(-1)?.cumulative).toBe(contract);
  });

  it("final retainage is roughly 5% of contract", () => {
    const contract = 1_000_000;
    const schedule = buildDrawSchedule(contract);
    const final = schedule.at(-1)!;
    expect(final.milestone.pct).toBe(0.05);
    // last row absorbs rounding — should be within a dollar of 5%
    expect(Math.abs(final.amount - contract * 0.05)).toBeLessThanOrEqual(1);
  });

  it("cumulative is non-decreasing", () => {
    const schedule = buildDrawSchedule(500_000);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]!.cumulative).toBeGreaterThanOrEqual(schedule[i - 1]!.cumulative);
    }
  });
});

describe("calcBuilderFinance", () => {
  it("splits equity and financed amount by LTC", () => {
    const result = calcBuilderFinance(1_000_000, {
      months: 10,
      interestRatePct: 10,
      ltcPct: 80,
      holdingMonthly: 1000,
      salePrice: 1_200_000,
      sellingCostPct: 6,
    });
    expect(result.financedAmount).toBe(800_000);
    expect(result.equityCash).toBe(200_000);
    expect(result.holdingCost).toBe(10_000);
    expect(result.monthlyDrawHint).toBe(100_000);
  });

  it("produces positive net when sale covers costs", () => {
    const build = calcPrice(DEFAULT_COSTS, DEFAULT_ASSUMPTIONS).contractPrice;
    const result = calcBuilderFinance(build, {
      months: 10,
      interestRatePct: 9.5,
      ltcPct: 80,
      holdingMonthly: 1200,
      salePrice: Math.round(build * 1.25),
      sellingCostPct: 6,
    });
    expect(result.netAtClose).toBeGreaterThan(0);
    expect(result.peakCashNeed).toBeGreaterThan(0);
  });
});
