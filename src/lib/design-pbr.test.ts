import { describe, expect, it } from "vitest";
import { optionById } from "@/lib/design-catalog";
import { resolveScannedPbr, scannedPbrIds } from "@/lib/design-pbr";

describe("resolveScannedPbr", () => {
  it("maps Calacatta quartz to marble_01 scan", () => {
    const spec = resolveScannedPbr(optionById("ct-quartz-calacatta")!);
    expect(spec?.id).toBe("marble_01");
    expect(spec?.diff).toContain("marble_01_diff_1k.jpg");
    expect(spec?.normal).toContain("nor_gl");
    expect(spec?.tint).toBe(false);
  });

  it("maps oak LVP to oak plank scan", () => {
    expect(resolveScannedPbr(optionById("fl-lvp-oak")!)?.id).toBe("oak_wood_planks");
  });

  it("maps walnut cabinets to walnut veneer scan", () => {
    expect(resolveScannedPbr(optionById("cab-flat-panel-walnut")!)?.id).toBe(
      "american_walnut_veneer",
    );
  });

  it("leaves painted cabinets and wall paint on procedural fallback", () => {
    expect(resolveScannedPbr(optionById("cab-shaker-white")!)).toBeNull();
    expect(resolveScannedPbr(optionById("paint-alabaster")!)).toBeNull();
  });

  it("tints leathered black quartz and painted siding", () => {
    expect(resolveScannedPbr(optionById("ct-quartz-leathered-black")!)?.tint).toBe(true);
    expect(resolveScannedPbr(optionById("ext-lap-siding-white")!)?.tint).toBe(true);
  });

  it("exposes a compact unique scan set", () => {
    const ids = scannedPbrIds();
    expect(ids.length).toBeGreaterThan(6);
    expect(ids).toContain("marble_01");
    expect(ids).toContain("oak_wood_planks");
  });
});
