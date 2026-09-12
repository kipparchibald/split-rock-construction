import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_COSTS,
  calcPrice,
} from "@/lib/pricing";
import {
  HOLWEGE_PRICING_LOCK,
  assertHolwegeBid,
  assertHolwegePricing,
  repairHolwegeMoneySlice,
} from "@/lib/holwege-pricing";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_LAND_PAID,
  HOLWEGE_PROJECT_ID,
  holwegeBid,
  holwegeProject,
} from "@/data/holwege";

describe("Holwege pricing lock", () => {
  it("locks project budget to HOLWEGE_CONTRACT", () => {
    const drifted = { ...holwegeProject, budget: 727_057 };
    expect(assertHolwegePricing(drifted).budget).toBe(HOLWEGE_CONTRACT);
    expect(assertHolwegePricing(holwegeProject).budget).toBe(HOLWEGE_CONTRACT);
  });

  it("locks Holwege bid amount and rejects ~727k default estimator draft", () => {
    const draft = calcPrice(DEFAULT_COSTS, DEFAULT_ASSUMPTIONS).contractPrice;
    expect(draft).toBe(HOLWEGE_PRICING_LOCK.forbiddenDraftApprox);
    expect(draft).not.toBe(HOLWEGE_CONTRACT);
    const bad = { ...holwegeBid, amount: draft };
    expect(assertHolwegeBid(bad).amount).toBe(HOLWEGE_CONTRACT);
  });

  it("excludes land from contract lock", () => {
    expect(HOLWEGE_CONTRACT + HOLWEGE_LAND_PAID).toBe(787_299.65);
    expect(assertHolwegePricing({ ...holwegeProject, budget: HOLWEGE_CONTRACT + HOLWEGE_LAND_PAID }).budget).toBe(
      HOLWEGE_CONTRACT,
    );
  });

  it("repairHolwegeMoneySlice clamps projects and bids", () => {
    const repaired = repairHolwegeMoneySlice({
      projects: [{ ...holwegeProject, budget: 727_057 }],
      bids: [{ ...holwegeBid, amount: 727_057 }],
      draws: [],
      budgetLines: [],
    });
    expect(repaired.projects[0]!.budget).toBe(HOLWEGE_CONTRACT);
    expect(repaired.bids[0]!.amount).toBe(HOLWEGE_CONTRACT);
    expect(repaired.projects[0]!.id).toBe(HOLWEGE_PROJECT_ID);
  });
});
