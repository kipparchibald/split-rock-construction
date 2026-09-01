import { describe, expect, it } from "vitest";
import {
  DESIGN_OPTIONS,
  optionById,
  optionsForCategory,
} from "@/lib/design-catalog";
import {
  getMaterialProfile,
  resolveTextureKind,
  textureCacheKey,
  type TextureKind,
} from "@/lib/design-materials";
import type { DesignCategory } from "@/data/types";

const WALL_KINDS: TextureKind[] = ["paint-wall", "flat-color"];
const FLOOR_KINDS: TextureKind[] = ["wood-plank", "carpet", "tile-floor"];
const CABINET_KINDS: TextureKind[] = ["cabinet-painted", "cabinet-stained", "cabinet-walnut"];
const COUNTER_KINDS: TextureKind[] = [
  "quartz-veined",
  "quartz-matte",
  "quartz-leathered",
  "slab",
];
const TILE_KINDS: TextureKind[] = [
  "subway-tile",
  "zellige-tile",
  "vertical-stack-tile",
  "herringbone-tile",
  "ceramic-tile",
  "slab",
];
const METAL_KINDS: TextureKind[] = [
  "metal-chrome",
  "metal-brushed",
  "metal-black",
  "metal-brass",
];

function expectKindIn(category: DesignCategory, allowed: TextureKind[], optionId: string) {
  const opt = optionById(optionId);
  expect(opt, optionId).toBeDefined();
  const kind = resolveTextureKind(opt, category);
  expect(allowed, `${optionId} → ${kind}`).toContain(kind);
}

describe("resolveTextureKind", () => {
  it("maps LVP flooring to wood-plank, not paint-wall", () => {
    const oak = optionById("fl-lvp-oak")!;
    expect(resolveTextureKind(oak)).toBe("wood-plank");
    expect(resolveTextureKind(oak)).not.toBe("paint-wall");
  });

  it("maps carpet flooring to carpet", () => {
    expect(resolveTextureKind(optionById("fl-carpet-neutral")!)).toBe("carpet");
  });

  it("maps porcelain floor tile to tile-floor", () => {
    expect(resolveTextureKind(optionById("fl-tile-large-format")!)).toBe("tile-floor");
  });

  it("never maps flooring options to wall paint", () => {
    for (const opt of optionsForCategory("flooring")) {
      expect(resolveTextureKind(opt)).not.toBe("paint-wall");
      expect(FLOOR_KINDS).toContain(resolveTextureKind(opt));
    }
  });

  it("maps painted shaker cabinets to cabinet-painted", () => {
    expect(resolveTextureKind(optionById("cab-shaker-white")!)).toBe("cabinet-painted");
  });

  it("maps stained oak cabinets to cabinet-stained", () => {
    expect(resolveTextureKind(optionById("cab-stained-oak")!)).toBe("cabinet-stained");
  });

  it("maps walnut flat panel to cabinet-walnut", () => {
    expect(resolveTextureKind(optionById("cab-flat-panel-walnut")!)).toBe("cabinet-walnut");
  });

  it("never maps cabinets to flooring wood-plank", () => {
    for (const opt of optionsForCategory("cabinets")) {
      expect(resolveTextureKind(opt)).not.toBe("wood-plank");
      expect(CABINET_KINDS).toContain(resolveTextureKind(opt));
    }
  });

  it("maps quartz countertops to veined or matte variants", () => {
    expectKindIn("countertops", COUNTER_KINDS, "ct-quartz-calacatta");
    expectKindIn("countertops", COUNTER_KINDS, "ct-quartz-concrete");
    expectKindIn("countertops", COUNTER_KINDS, "ct-quartz-leathered-black");
  });

  it("maps backsplash patterns distinctly", () => {
    expect(resolveTextureKind(optionById("bs-subway-white")!)).toBe("subway-tile");
    expect(resolveTextureKind(optionById("bs-zellige")!)).toBe("zellige-tile");
    expect(resolveTextureKind(optionById("bs-vertical-stack")!)).toBe("vertical-stack-tile");
  });

  it("maps bath tile including herringbone", () => {
    expect(resolveTextureKind(optionById("tile-herringbone")!)).toBe("herringbone-tile");
    expect(resolveTextureKind(optionById("tile-std-ceramic")!)).toBe("ceramic-tile");
    for (const opt of optionsForCategory("tile")) {
      expect(TILE_KINDS).toContain(resolveTextureKind(opt));
    }
  });

  it("maps fixture finishes to metal kinds", () => {
    expect(resolveTextureKind(optionById("fx-chrome-standard")!)).toBe("metal-chrome");
    expect(resolveTextureKind(optionById("fx-brushed-nickel")!)).toBe("metal-brushed");
    expect(resolveTextureKind(optionById("fx-matte-black")!)).toBe("metal-black");
    for (const opt of optionsForCategory("fixtures")) {
      expect(METAL_KINDS).toContain(resolveTextureKind(opt));
    }
  });

  it("maps exterior siding and stone", () => {
    expect(resolveTextureKind(optionById("ext-lap-siding-white")!)).toBe("lap-siding");
    expect(resolveTextureKind(optionById("ext-board-batten-charcoal")!)).toBe("board-batten");
    expect(resolveTextureKind(optionById("ext-stone-wainscot")!)).toBe("stone");
  });

  it("maps roofing shingle vs metal", () => {
    expect(resolveTextureKind(optionById("roof-arch-shingle")!)).toBe("shingle");
    expect(resolveTextureKind(optionById("roof-metal")!)).toBe("metal-roof");
  });

  it("respects explicit category override", () => {
    const paint = optionById("paint-alabaster")!;
    expect(resolveTextureKind(paint, "flooring")).toBe("wood-plank");
    expect(resolveTextureKind(paint, "paint")).toBe("paint-wall");
  });
});

describe("getMaterialProfile", () => {
  it("assigns high metalness to chrome fixtures", () => {
    const profile = getMaterialProfile(optionById("fx-chrome-standard")!);
    expect(profile.metalness).toBeGreaterThan(0.8);
    expect(profile.kind).toBe("metal-chrome");
  });

  it("assigns low metalness to paint walls", () => {
    const profile = getMaterialProfile(optionById("paint-alabaster")!);
    expect(profile.metalness).toBe(0);
    expect(profile.kind).toBe("paint-wall");
  });

  it("assigns higher roughness to carpet than quartz", () => {
    const carpet = getMaterialProfile(optionById("fl-carpet-neutral")!);
    const quartz = getMaterialProfile(optionById("ct-quartz-calacatta")!);
    expect(carpet.roughness).toBeGreaterThan(quartz.roughness);
  });
});

describe("textureCacheKey", () => {
  it("is stable and case-insensitive on hex", () => {
    expect(textureCacheKey("wood-plank", "#C4A574")).toBe(
      textureCacheKey("wood-plank", "#c4a574"),
    );
  });
});

describe("catalog coverage", () => {
  it("every design option resolves to a known texture kind", () => {
    for (const opt of DESIGN_OPTIONS) {
      const kind = resolveTextureKind(opt);
      expect(kind).toBeTruthy();
      expect(typeof kind).toBe("string");
    }
  });
});
