import { describe, expect, it } from "vitest";
import {
  advancePermitStatus,
  buildDraftForKey,
  CORE_PERMIT_KEYS,
  corePermitProgress,
  createPermitPackage,
  nextPermitAction,
  packageStatus,
  permitProgress,
} from "./permits-idaho";

describe("permits-idaho", () => {
  it("creates a package with JC + EIPH items", () => {
    const pkg = createPermitPackage("p1", "Hart Residence");
    expect(pkg.items.length).toBeGreaterThanOrEqual(5);
    expect(pkg.items.some((i) => i.authority === "jefferson_county")).toBe(true);
    expect(pkg.items.some((i) => i.authority === "eiph")).toBe(true);
    expect(packageStatus(pkg.items)).toBe("drafting");
  });

  it("advances status and tracks progress", () => {
    expect(advancePermitStatus("not_started")).toBe("drafting");
    expect(advancePermitStatus("drafting")).toBe("ready_review");
    expect(advancePermitStatus("submitted")).toBe("approved");
    const pkg = createPermitPackage("p1", "Test");
    const next = nextPermitAction(pkg.items);
    expect(next?.status).toBe("drafting");
    const approved = pkg.items.map((i) => ({ ...i, status: "approved" as const }));
    expect(permitProgress(approved).pct).toBe(100);
    expect(packageStatus(approved)).toBe("approved");
  });

  it("fills mock drafts with job context for core three", () => {
    const ctx = {
      project: {
        name: "Hart Residence",
        address: "12 Teton Heights Dr, Rigby",
        superintendent: "Tyler Brooks",
        sqft: 2100,
        beds: 4,
        baths: 2.5,
        budget: 685000,
        description: "Custom ranch",
      },
      client: {
        name: "Elena Hart",
        email: "elena@example.com",
        phone: "(208) 555-0100",
        address: "PO Box 1, Rigby",
      },
      parcelNote: "Teton Heights Lot 12",
      today: "2026-08-06",
    };
    const bp = buildDraftForKey("jc_building_permit", "Hart", ctx);
    expect(bp).toMatch(/MOCK FILLED/);
    expect(bp).toMatch(/Elena Hart/);
    expect(bp).toMatch(/12 Teton Heights/);
    expect(bp).toMatch(/2100/);
    const site = buildDraftForKey("jc_site_plan", "Hart", ctx);
    expect(site).toMatch(/Site address: 12 Teton/);
    const septic = buildDraftForKey("eiph_septic", "Hart", ctx);
    expect(septic).toMatch(/EIPH/);
    expect(septic).toMatch(/Bedrooms \(design\): 4/);
  });

  it("tracks core permit progress separately", () => {
    const pkg = createPermitPackage("p1", "Test");
    const core = corePermitProgress(pkg.items);
    expect(core.total).toBe(CORE_PERMIT_KEYS.length);
    expect(core.done).toBe(0);
  });
});
