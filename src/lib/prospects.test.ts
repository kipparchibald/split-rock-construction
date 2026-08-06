import { describe, expect, it } from "vitest";
import { isHot, needsFollowUp, scoreProspect } from "./prospects";
import type { Prospect } from "@/data/types";

describe("scoreProspect", () => {
  it("scores hot lot+build with short timeline high", () => {
    const s = scoreProspect({
      leadType: "lot_and_build",
      budgetBand: "500_650k",
      timeline: "0_3mo",
      lotId: "th1",
      packageId: "bp2",
      dualRoleAcknowledged: true,
      source: "teton_estimator",
    });
    expect(s).toBeGreaterThanOrEqual(75);
  });

  it("scores browsing lower", () => {
    const s = scoreProspect({
      leadType: "lot_only",
      budgetBand: "unknown",
      timeline: "browsing",
    });
    expect(s).toBeLessThan(60);
  });
});

describe("needsFollowUp", () => {
  const base: Prospect = {
    id: "x", name: "A", email: "a@b.c", phone: "1", leadType: "lot_only", stage: "new",
    source: "website", budgetBand: "unknown", timeline: "browsing", interest: "", notes: "",
    dualRoleFlag: false, dualRoleAcknowledged: false, score: 40, assignedTo: "X", createdAt: "2026-07-01",
  };
  it("flags new", () => {
    expect(needsFollowUp(base)).toBe(true);
  });
  it("does not flag lost", () => {
    expect(needsFollowUp({ ...base, stage: "lost" })).toBe(false);
  });
});

describe("isHot", () => {
  it("requires score and open stage", () => {
    expect(isHot({ score: 80, stage: "new" } as Prospect)).toBe(true);
    expect(isHot({ score: 80, stage: "won" } as Prospect)).toBe(false);
  });
});
