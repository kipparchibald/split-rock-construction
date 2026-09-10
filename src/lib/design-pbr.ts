/**
 * Scanned PBR maps for Design Center WebGL.
 * Sources: Poly Haven 1K JPG (CC0) — CORS-open CDN.
 * Procedural canvas maps remain the offline / paint-tint fallback.
 */
import type { DesignCategory, DesignOption } from "@/data/types";
import { resolveTextureKind, type TextureKind } from "@/lib/design-materials";

const PH = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k";

export interface ScannedPbr {
  id: string;
  diff: string;
  rough: string;
  normal: string;
  /** Multiply albedo by option hex (wood stain / painted siding). */
  tint: boolean;
}

function ph(id: string, tint = false): ScannedPbr {
  return {
    id,
    diff: `${PH}/${id}/${id}_diff_1k.jpg`,
    rough: `${PH}/${id}/${id}_rough_1k.jpg`,
    normal: `${PH}/${id}/${id}_nor_gl_1k.jpg`,
    tint,
  };
}

const BY_OPTION: Record<string, ScannedPbr> = {
  "fl-lvp-oak": ph("oak_wood_planks"),
  "fl-lvp-greige": ph("wood_floor_deck"),
  "fl-lvp-walnut": ph("plank_flooring_03"),
  "fl-hardwood-white-oak": ph("oak_wood_planks"),
  "fl-hardwood-smoked": ph("plank_flooring_03"),
  "fl-carpet-neutral": ph("dirty_carpet"),
  "fl-tile-large-format": ph("interior_tiles"),
  "cab-stained-oak": ph("white_oak_veneer"),
  "cab-flat-panel-walnut": ph("american_walnut_veneer"),
  "ct-quartz-calacatta": ph("marble_01"),
  "ct-quartz-concrete": ph("concrete_floor"),
  "ct-quartz-leathered-black": ph("marble_tiles", true),
  "ct-porcelain-slab": ph("marble_tiles"),
  "bs-subway-white": ph("long_white_tiles"),
  "bs-vertical-stack": ph("interior_tiles"),
  "bs-zellige": ph("interior_tiles"),
  "bs-full-height-slab": ph("marble_01"),
  "tile-std-ceramic": ph("interior_tiles"),
  "tile-porcelain-rectified": ph("interior_tiles"),
  "tile-herringbone": ph("herringbone_parquet"),
  "tile-slab-shower": ph("marble_tiles"),
  "fx-brushed-nickel": ph("metal_plate"),
  "ap-ss-mid": ph("metal_plate"),
  "ap-ss-upgrade": ph("metal_plate"),
  "ext-lap-siding-white": ph("weathered_plank_siding", true),
  "ext-board-batten-charcoal": ph("weathered_plank_siding", true),
  "ext-mixed-farmhouse": ph("weathered_plank_siding", true),
  "ext-stone-wainscot": ph("rock_wall_08"),
  "roof-arch-shingle": ph("grey_roof_01"),
  "roof-weathered-wood": ph("grey_roof_01", true),
  "door-entry-craftsman": ph("american_walnut_veneer"),
};

const BY_KIND: Partial<Record<TextureKind, ScannedPbr>> = {
  "wood-plank": ph("oak_wood_planks"),
  "wood-door": ph("american_walnut_veneer"),
  carpet: ph("dirty_carpet"),
  "tile-floor": ph("interior_tiles"),
  "cabinet-stained": ph("white_oak_veneer"),
  "cabinet-walnut": ph("american_walnut_veneer"),
  "quartz-veined": ph("marble_01"),
  "quartz-matte": ph("concrete_floor"),
  "quartz-leathered": ph("marble_tiles", true),
  slab: ph("marble_tiles"),
  "subway-tile": ph("long_white_tiles"),
  "zellige-tile": ph("interior_tiles"),
  "vertical-stack-tile": ph("interior_tiles"),
  "herringbone-tile": ph("herringbone_parquet"),
  "ceramic-tile": ph("interior_tiles"),
  "metal-brushed": ph("metal_plate"),
  "appliance-stainless": ph("metal_plate"),
  "lap-siding": ph("weathered_plank_siding", true),
  "board-batten": ph("weathered_plank_siding", true),
  stone: ph("rock_wall_08"),
  shingle: ph("grey_roof_01"),
};

/** Painted cabinets / paint / chrome stay procedural — hex accuracy beats a scan. */
export function resolveScannedPbr(
  option: DesignOption | undefined,
  category?: DesignCategory,
): ScannedPbr | null {
  if (option?.id && BY_OPTION[option.id]) return BY_OPTION[option.id];
  const kind = resolveTextureKind(option, category);
  return BY_KIND[kind] ?? null;
}

export function scannedPbrIds(): string[] {
  return Array.from(new Set([...Object.values(BY_OPTION), ...Object.values(BY_KIND)].map((s) => s.id)));
}
