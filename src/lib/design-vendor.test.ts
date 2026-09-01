import { describe, expect, it } from "vitest";
import { vendorFor, vendorHex } from "@/lib/design-vendor";

describe("design vendor overlay", () => {
  it("uses published SW 7008 hex for Alabaster", () => {
    expect(vendorFor("paint-alabaster")?.colorCode).toBe("SW 7008");
    expect(vendorHex("paint-alabaster")).toBe("#EDEAE0");
    expect(vendorFor("paint-alabaster")?.productUrl).toContain("sherwin-williams.com");
  });

  it("uses published BM OC-45 hex for Swiss Coffee", () => {
    expect(vendorFor("paint-swiss-coffee")?.colorCode).toBe("OC-45");
    expect(vendorHex("paint-swiss-coffee")).toBe("#EEECE1");
  });

  it("tags oak LVP as COREtec", () => {
    expect(vendorFor("fl-lvp-oak")?.sku).toMatch(/COREtec/i);
  });

  it("tags Calacatta as MSI quartz family", () => {
    expect(vendorFor("ct-quartz-calacatta")?.sku).toMatch(/Calacatta/i);
  });
});
