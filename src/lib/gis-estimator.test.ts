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
      acres: 0.68,
    };
    const out = buildGisBrief("1600 sf ranch + basement", lot);
    expect(out).toMatch(/Lot 7/);
    expect(out).toMatch(/0\.68 ac/);
  });

  it("does not duplicate lot tag", () => {
    const lot = {
      lotNumber: 7,
      label: "Lot 7",
      ring: [],
      centroid: [0, 0] as [number, number],
      acres: 0.68,
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
    const lot7 = draftGisEstimate({
      brief: "1600 sf ranch + basement, 3-car spec",
      lotNumber: 7,
      includeLand: false,
      includeSiteAllowances: false,
      closedJobs: [],
    });
    expect(lot7.lot?.lotNumber).toBe(7);
    expect(lot7.acres).toBeGreaterThan(BASELINE_LOT_ACRES);
    expect(lot7.costs.siteWork).toBeGreaterThan(base.costs.siteWork);
    expect(lot7.platConstraints.some((c) => c.id === "well")).toBe(true);
    expect(lot7.platConstraints.some((c) => c.id === "septic")).toBe(true);
    expect(lot7.narrative).toMatch(/LOT 7/i);
    expect(lot7.contractPrice).toBeGreaterThan(100000);
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
    expect(off.siteAllowances.total).toBe(0);
    expect(on.siteAllowances.total).toBe(
      TETON_SITE_ALLOWANCES.well + TETON_SITE_ALLOWANCES.septic + TETON_SITE_ALLOWANCES.driveway,
    );
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
});
