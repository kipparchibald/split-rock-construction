import { describe, expect, it } from "vitest";
import {
  BASELINE_LOT_ACRES,
  buildGisBrief,
  draftGisEstimate,
  TETON_SITE_ALLOWANCES,
} from "./gis-estimator";
import { TETON_BASE_LOT } from "./lot-pricing";

describe("buildGisBrief", () => {
  it("appends lot tag when missing", () => {
    const lot = {
      lotNumber: 7,
      label: "Lot 7",
      ring: [],
      centroid: [0, 0] as [number, number],
      acres: 0.6,
    };
    const out = buildGisBrief("1600 sf ranch + basement", lot);
    expect(out).toMatch(/Lot 7/);
    expect(out).toMatch(/0\.6 ac/);
  });

  it("does not duplicate lot tag", () => {
    const lot = {
      lotNumber: 7,
      label: "Lot 7",
      ring: [],
      centroid: [0, 0] as [number, number],
      acres: 0.6,
    };
    const out = buildGisBrief("1600 sf ranch on Lot 7 Teton Heights", lot);
    expect(out.match(/Lot 7/g)?.length).toBe(1);
  });
});

describe("draftGisEstimate", () => {
  it("scales site work for a larger lot and includes plat constraints", () => {
    const base = draftGisEstimate({
      brief: "1600 sf ranch + basement, 3-car spec",
      lotNumber: null,
      includeLand: false,
      includeSiteAllowances: false,
      closedJobs: [],
    });
    // Lot 11 is 0.75 ac (> 0.62 baseline). Lots 6–10 are 0.6 ac after Inst. 492361.
    const lot11 = draftGisEstimate({
      brief: "1600 sf ranch + basement, 3-car spec",
      lotNumber: 11,
      includeLand: false,
      includeSiteAllowances: false,
      closedJobs: [],
    });
    expect(lot11.lot?.lotNumber).toBe(11);
    expect(lot11.acres).toBeGreaterThan(BASELINE_LOT_ACRES);
    expect(lot11.costs.siteWork).toBeGreaterThan(base.costs.siteWork);
    expect(lot11.platConstraints.some((c) => c.id === "well")).toBe(true);
    expect(lot11.platConstraints.some((c) => c.id === "septic")).toBe(true);
    expect(lot11.narrative).toMatch(/LOT 11/i);
    expect(lot11.contractPrice).toBeGreaterThan(100000);
  });

  it("uses Inst. 492361 acreage for Lot 7 (at or under baseline)", () => {
    const lot7 = draftGisEstimate({
      brief: "1600 sf ranch + basement, 3-car spec",
      lotNumber: 7,
      includeLand: false,
      includeSiteAllowances: false,
      closedJobs: [],
    });
    expect(lot7.lot?.lotNumber).toBe(7);
    expect(lot7.acres).toBe(0.6);
    expect(lot7.acres!).toBeLessThanOrEqual(BASELINE_LOT_ACRES);
    expect(lot7.narrative).toMatch(/LOT 7/i);
  });

  it("rolls well/septic/driveway into other when requested", () => {
    const off = draftGisEstimate({
      brief: "1600 sf ranch Teton Heights",
      lotNumber: 7,
      includeLand: true,
      includeSiteAllowances: false,
      closedJobs: [],
    });
    const on = draftGisEstimate({
      brief: "1600 sf ranch Teton Heights",
      lotNumber: 7,
      includeLand: true,
      includeSiteAllowances: true,
      closedJobs: [],
    });
    const allowanceTotal =
      TETON_SITE_ALLOWANCES.well + TETON_SITE_ALLOWANCES.septic + TETON_SITE_ALLOWANCES.driveway;
    expect(off.siteAllowances.total).toBe(allowanceTotal);
    expect(off.siteAllowances.includedInContract).toBe(false);
    expect(on.siteAllowances.total).toBe(allowanceTotal);
    expect(on.siteAllowances.includedInContract).toBe(true);
    expect(off.allInWithSite).toBe(off.contractPrice + allowanceTotal);
    expect(on.allInWithSite).toBe(on.contractPrice);
    expect(on.costs.other).toBeGreaterThan(off.costs.other);
    expect(on.costs.land).toBe(TETON_BASE_LOT);
    expect(on.contractPrice).toBeGreaterThan(off.contractPrice);
  });

  it("ignores out-of-range lot numbers", () => {
    const d = draftGisEstimate({
      brief: "1600 sf ranch",
      lotNumber: 99,
      closedJobs: [],
    });
    expect(d.lot).toBeNull();
    expect(d.lotNumber).toBeNull();
  });

  it("accepts schematic Lot 16 (Holwege) and still ignores unknown lots", () => {
    const lot16 = draftGisEstimate({
      brief: "2602 sf ADA one-level, Holwege Lot 16 Block 8",
      lotNumber: 16,
      includeLand: false,
      includeSiteAllowances: false,
      closedJobs: [],
    });
    expect(lot16.lot?.lotNumber).toBe(16);
    expect(lot16.lot?.projectId).toBe("p-holwege");
    expect(lot16.narrative).toMatch(/LOT 16/i);
    expect(lot16.platConstraints.length).toBeGreaterThan(0);

    const bad = draftGisEstimate({
      brief: "1600 sf ranch",
      lotNumber: 99,
      closedJobs: [],
    });
    expect(bad.lot).toBeNull();
    expect(bad.lotNumber).toBeNull();
  });
});
