import { describe, expect, it } from "vitest";
import { multiLotTotal, ownerFinancePayment, packageTotal, TETON_BASE_LOT } from "./lot-pricing";
import type { BuildPackage, LotFinanceOption, SubdivisionLot } from "@/data/types";

const lot = (price: number, id = "a"): SubdivisionLot => ({
  id, projectId: "p4", block: "8", lot: "1", acres: 0.6, status: "available", premium: "standard",
  basePrice: TETON_BASE_LOT, premiumAmount: price - TETON_BASE_LOT, listPrice: price,
  multiLotDiscountPct: 3, notes: "", wellReady: true, septicReady: true, utilities: "",
});

describe("Teton Heights lot pricing", () => {
  it("base market lot is $99,500", () => {
    expect(TETON_BASE_LOT).toBe(99_500);
  });

  it("multi-lot discounts lots after the first", () => {
    const r = multiLotTotal([lot(99500), lot(99500, "b"), lot(104500, "c")], 3);
    expect(r.count).toBe(3);
    expect(r.subtotal).toBe(99500 + 99500 + 104500);
    expect(r.discount).toBeGreaterThan(0);
    expect(r.total).toBe(r.subtotal - r.discount);
  });

  it("package stacks lot + build + soft", () => {
    const build: BuildPackage = {
      id: "bp", name: "Forks 2280", beds: 4, baths: 2.5, sqft: 2280,
      baseBuild: 425000, finishesTier: "preferred", notes: "",
    };
    const p = packageTotal(lot(99500), build);
    expect(p.lotPrice).toBe(99500);
    expect(p.buildPrice).toBe(425000);
    expect(p.total).toBe(p.lotPrice + p.buildPrice + p.soft);
  });

  it("owner finance computes down and payment", () => {
    const opt: LotFinanceOption = {
      id: "of", label: "20/60", downPct: 20, termMonths: 60, interestRatePct: 7.9, notes: "",
    };
    const r = ownerFinancePayment(99_500, opt);
    expect(r.down).toBe(19_900);
    expect(r.financed).toBe(79_600);
    expect(r.payment).toBeGreaterThan(1000);
  });
});
