import { describe, expect, it } from "vitest";
import { draftEstimateFromText, parseBrief } from "./estimate-draft";
import { calcPrice, hardCostTotal } from "./pricing";
import type { ClosedJobRecord } from "./estimate-history";

describe("parseBrief", () => {
  it("detects residential ranch with basement and sqft", () => {
    const p = parseBrief("1600 sf ranch + basement, 3-car, Teton Heights spec");
    expect(p.kind).toBe("residential");
    expect(p.sqft).toBe(1600);
    expect(p.basement).toBe(true);
    expect(p.garageBays).toBe(3);
    expect(p.ranch).toBe(true);
    expect(p.volume).toBe(true);
    expect(p.locationHints).toContain("teton heights");
  });

  it("detects commercial shell", () => {
    const p = parseBrief("18000 sf commercial shell, Rigby light industrial");
    expect(p.kind).toBe("commercial");
    expect(p.sqft).toBe(18000);
    expect(p.commercialSubtype).toBe("shell");
    expect(p.locationHints).toContain("rigby");
  });

  it("detects TI", () => {
    const p = parseBrief("4500 sf retail TI, Rigby strip center");
    expect(p.kind).toBe("commercial");
    expect(p.commercialSubtype).toBe("ti");
    expect(p.sqft).toBe(4500);
  });

  it("does not treat special as volume/spec", () => {
    const p = parseBrief("2000 sf home with special finishes upgraded");
    expect(p.volume).toBe(false);
    expect(p.kind).toBe("residential");
  });

  it("does not match star city on winter start", () => {
    const p = parseBrief("2200 sf custom hillside winter start");
    expect(p.locationHints).not.toContain("star");
    expect(p.highRisk).toBe(true);
  });

  it("matches star as a location with word boundary", () => {
    const p = parseBrief("1800 sf ranch in Star Idaho");
    expect(p.locationHints).toContain("star");
  });
});

describe("draftEstimateFromText", () => {
  it("produces a full draft with disclaimer and non-zero costs", () => {
    const d = draftEstimateFromText("2400 sf semi-custom, Rigby, upgraded finishes", {
      closedJobs: [],
    });
    expect(d.disclaimer.toLowerCase()).toContain("not a bid");
    expect(d.sqft).toBe(2400);
    expect(d.presetId).toBe("semi_custom");
    expect(hardCostTotal(d.costs)).toBeGreaterThan(100000);
    expect(d.previewContractPrice).toBe(
      calcPrice(d.costs, d.assumptions, d.sqft).contractPrice,
    );
    expect(d.confidence).toBeGreaterThan(0.3);
    expect(d.assumptionsList.length).toBeGreaterThan(3);
    expect(d.exclusions.some((e) => /not a bid/i.test(e))).toBe(true);
  });

  it("picks high_risk preset when signals present", () => {
    const d = draftEstimateFromText("2000 sf custom hillside winter start steep lot", {
      closedJobs: [],
    });
    expect(d.presetId).toBe("high_risk");
  });

  it("blends closed job history into rates", () => {
    const closed: ClosedJobRecord[] = [
      {
        id: "j1",
        name: "Demo ranch 1",
        kind: "residential",
        sqft: 1600,
        tags: ["residential", "ranch", "basement", "spec"],
        closedAt: "2026-01-01",
        costs: {
          land: 0,
          siteWork: 40000,
          foundation: 90000,
          structure: 150000,
          mep: 70000,
          finishes: 100000,
          landscaping: 15000,
          permitsFees: 10000,
          other: 8000,
        },
      },
    ];
    const base = draftEstimateFromText("1600 sf ranch + basement, Teton Heights spec", {
      closedJobs: [],
    });
    const blended = draftEstimateFromText("1600 sf ranch + basement, Teton Heights spec", {
      closedJobs: closed,
    });
    expect(blended.historyMatched).toBe(1);
    expect(blended.historySummary).toMatch(/closed job/i);
    const moved =
      blended.costs.structure !== base.costs.structure ||
      blended.costs.foundation !== base.costs.foundation ||
      blended.costs.finishes !== base.costs.finishes;
    expect(moved).toBe(true);
  });

  it("commercial TI draft stays offline and uses TI-ish finishes", () => {
    const d = draftEstimateFromText("4500 sf office TI downtown Rigby", { closedJobs: [] });
    expect(d.parsed.kind).toBe("commercial");
    expect(d.costs.finishes).toBeGreaterThan(d.costs.foundation);
    expect(d.previewContractPrice).toBeGreaterThan(0);
  });

  it("clamps absurd brief length", () => {
    const d = draftEstimateFromText("x".repeat(5000) + " 2400 sf ranch", { closedJobs: [] });
    expect(d.parsed.raw.length).toBeLessThanOrEqual(500);
  });
});
