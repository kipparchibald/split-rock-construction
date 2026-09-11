import { describe, expect, it } from "vitest";
import {
  getLot,
  isCatalogLotNumber,
  parseLot,
  resolveLotNumber,
  TETON_HEIGHTS_LOTS,
} from "./teton-heights-gis";

describe("Teton Heights GIS catalog — Lot 16 Holwege", () => {
  it("keeps lots 1–12 and adds schematic Lot 16 for Holwege", () => {
    const nums = TETON_HEIGHTS_LOTS.map((l) => l.lotNumber);
    for (let n = 1; n <= 12; n++) {
      expect(nums).toContain(n);
    }
    expect(nums).toContain(16);
    const lot16 = getLot(16);
    expect(lot16?.projectId).toBe("p-holwege");
    expect(lot16?.label).toMatch(/Lot 16/i);
    expect(lot16?.notes ?? "").toMatch(/schematic/i);
    expect(lot16?.notes ?? "").toMatch(/no recorded plan-ft/i);
    // Cole Spec stays on Lot 7
    expect(getLot(7)?.projectId).toBe("p4");
  });

  it("parseLot accepts 16 and rejects unknown lots", () => {
    expect(parseLot("16")).toBe(16);
    expect(parseLot(16)).toBe(16);
    expect(parseLot("7")).toBe(7);
    expect(parseLot("1")).toBe(1);
    expect(parseLot("12")).toBe(12);
    expect(parseLot("99")).toBeNull();
    expect(parseLot("0")).toBeNull();
    expect(parseLot(undefined)).toBeNull();
    expect(parseLot("")).toBeNull();
    expect(isCatalogLotNumber(16)).toBe(true);
    expect(isCatalogLotNumber(13)).toBe(false);
  });

  it("resolveLotNumber binds p-holwege to Lot 16 and never falls back to 7", () => {
    expect(resolveLotNumber({ projectId: "p-holwege" })).toBe(16);
    expect(
      resolveLotNumber({
        projectId: "p-holwege",
        address: "Lot 16 Block 8, Teton Heights Div 6, Rigby ID",
        name: "Holwege Residence — Lot 16",
      }),
    ).toBe(16);
    // Address/name alone (no projectId) — Lot 16 in text, Teton Heights present
    expect(
      resolveLotNumber({
        address: "Lot 16 Block 8, Teton Heights Div 6, Rigby ID",
        name: "Holwege Residence — Lot 16",
      }),
    ).toBe(16);
    // Holwege without explicit lot digits still must not become Cole Lot 7
    expect(
      resolveLotNumber({
        address: "Teton Heights Div 6, Rigby ID",
        name: "Holwege Residence",
      }),
    ).toBe(16);
    expect(resolveLotNumber({ planHint: 16 })).toBe(16);
  });

  it("resolveLotNumber still maps Cole / generic Teton Heights to Lot 7", () => {
    expect(resolveLotNumber({ projectId: "p4" })).toBe(7);
    expect(resolveLotNumber({ address: "Teton Heights Way, Rigby" })).toBe(7);
    expect(resolveLotNumber({ planHint: 7 })).toBe(7);
    expect(resolveLotNumber({ address: "Lot 11, Teton Heights" })).toBe(11);
  });
});
