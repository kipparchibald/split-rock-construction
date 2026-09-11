import { describe, expect, it } from "vitest";
import {
  tetonBuildPackages,
  tetonCommunityPricing,
  tetonHeightsLots,
} from "./seed";
import { packageTotal } from "@/lib/lot-pricing";

/**
 * Public /estimate catalog must remain available in live mode (demo=false).
 * Selectors source seed inventory — never internal P&O / contingency margins.
 */
describe("public Teton estimate catalog", () => {
  it("exposes available lots and build packages", () => {
    const available = tetonHeightsLots.filter(
      (l) => l.status === "available" || l.status === "model",
    );
    expect(available.length).toBeGreaterThan(0);
    expect(tetonBuildPackages.length).toBeGreaterThan(0);
    expect(tetonCommunityPricing.baseLotPrice).toBe(99_500);
  });

  it("packageTotal exposes list prices only (no internal margin fields)", () => {
    const lot = tetonHeightsLots.find((l) => l.status === "available")!;
    const pack = tetonBuildPackages[0]!;
    const calc = packageTotal(lot, pack);
    expect(calc.lotPrice).toBe(lot.listPrice);
    expect(calc.buildPrice).toBe(pack.baseBuild);
    expect(calc.total).toBe(calc.lotPrice + calc.buildPrice + calc.soft);
    // Public estimate must not surface P&O / contingency jargon via catalog objects
    const blob = JSON.stringify({ lot, pack, calc }).toLowerCase();
    expect(blob).not.toContain("contingency");
    expect(blob).not.toContain("profit");
    expect(blob).not.toContain("overhead");
    expect(blob).not.toContain("margin");
  });
});
