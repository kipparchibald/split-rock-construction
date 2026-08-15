import { describe, expect, it } from "vitest";
import { resolvePlanIdForProspect } from "./prospect-plan";

describe("resolvePlanIdForProspect", () => {
  it("maps Teton build packages to Book of Plans", () => {
    expect(resolvePlanIdForProspect({ packageId: "bp2", leadType: "lot_and_build" })).toBe(
      "plan-teton-1580",
    );
    expect(resolvePlanIdForProspect({ packageId: "bp3", leadType: "lot_and_build" })).toBe(
      "plan-splitrock-1620",
    );
  });

  it("falls back to default plan when no package", () => {
    expect(resolvePlanIdForProspect({ leadType: "custom_build" })).toBe("plan-teton-1580");
  });
});
