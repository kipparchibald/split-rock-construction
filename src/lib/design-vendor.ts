/**
 * Real vendor SKUs, published color codes, and product pages.
 * Overlay on DesignOption ids — catalog ids stay stable.
 * Screen hex is an approximation; always confirm a physical sample.
 */
export interface VendorProduct {
  sku?: string;
  colorCode?: string;
  /** Published sRGB approximation for walls / chips. */
  hex?: string;
  lrv?: number;
  productUrl?: string;
  line?: string;
}

export const VENDOR_BY_OPTION_ID: Record<string, VendorProduct> = {
  "paint-alabaster": {
    colorCode: "SW 7008",
    hex: "#EDEAE0",
    lrv: 82,
    line: "Emerald / Duration Eggshell",
    productUrl: "https://www.sherwin-williams.com/en-us/color/color-family/neutrals/SW7008-alabaster",
  },
  "paint-agreeable-gray": {
    colorCode: "SW 7029",
    hex: "#D1CBC1",
    lrv: 60,
    line: "Emerald / Duration Eggshell",
    productUrl: "https://www.sherwin-williams.com/en-us/color/color-family/neutrals/SW7029-agreeable-gray",
  },
  "paint-swiss-coffee": {
    colorCode: "OC-45",
    hex: "#EEECE1",
    lrv: 82,
    line: "Regal Select Eggshell",
    productUrl: "https://www.benjaminmoore.com/en-us/paint-colors/color/oc-45/swiss-coffee",
  },
  "paint-accessible-beige": {
    colorCode: "SW 7036",
    hex: "#D1C7B8",
    lrv: 58,
    line: "Emerald / Duration Eggshell",
    productUrl: "https://www.sherwin-williams.com/en-us/color/color-family/neutrals/SW7036-accessible-beige",
  },
  "paint-evergreen-fog": {
    colorCode: "SW 9130",
    hex: "#95978A",
    lrv: 30,
    line: "Emerald / Duration Eggshell",
    productUrl: "https://www.sherwin-williams.com/en-us/color/color-family/greens/SW9130-evergreen-fog",
  },
  "paint-naval": {
    colorCode: "SW 6244",
    hex: "#2F3D4C",
    lrv: 4,
    line: "Emerald / Duration Eggshell",
    productUrl: "https://www.sherwin-williams.com/en-us/color/color-family/blues/SW6244-naval",
  },
  "paint-black-magic": {
    colorCode: "SW 6991",
    hex: "#2A2A2A",
    lrv: 3,
    line: "Emerald / Duration Eggshell",
    productUrl: "https://www.sherwin-williams.com/en-us/color/color-family/neutrals/SW6991-black-magic",
  },
  "paint-roman-clay": {
    colorCode: "Roman Clay",
    line: "Portola limewash / clay plaster",
    productUrl: "https://portolapaints.com/products/roman-clay",
  },
  "fl-lvp-oak": {
    sku: "COREtec Pro Plus",
    line: "Rigid core LVP — natural / vista oak look",
    productUrl: "https://www.usfloorsllc.com/brands/coretec/",
  },
  "fl-lvp-greige": {
    sku: "COREtec Plus HD",
    line: "Rigid core LVP — warm greige oak",
    productUrl: "https://www.usfloorsllc.com/brands/coretec/",
  },
  "fl-lvp-walnut": {
    sku: "COREtec Pro Plus",
    line: "Rigid core LVP — walnut look",
    productUrl: "https://www.usfloorsllc.com/brands/coretec/",
  },
  "fl-carpet-neutral": {
    sku: "SmartStrand",
    line: "Soft twist bedroom carpet",
    productUrl: "https://www.mohawkflooring.com/carpet",
  },
  "fl-hardwood-white-oak": {
    sku: "Shaw Repel hardwood",
    line: "Engineered white oak, matte",
    productUrl: "https://shawfloors.com/flooring/hardwood",
  },
  "fl-hardwood-smoked": {
    sku: "Kahrs European oak",
    line: "Oil-matte smoked oak",
    productUrl: "https://www.kahrs.com/",
  },
  "fl-tile-large-format": {
    sku: "Daltile 24×48 porcelain",
    line: "Rectified large-format",
    productUrl: "https://www.daltile.com/",
  },
  "cab-shaker-white": {
    sku: "Mid Continent Shaker",
    colorCode: "Painted (match SW 7008)",
    hex: "#F4F2EC",
    productUrl: "https://www.midcontinentcabinetry.com/",
  },
  "cab-shaker-greige": {
    sku: "Mid Continent Shaker",
    colorCode: "Painted greige (near SW 7029)",
    hex: "#D1CBC1",
    productUrl: "https://www.midcontinentcabinetry.com/",
  },
  "cab-two-tone-navy": {
    sku: "Mid Continent Shaker",
    colorCode: "Island SW 6244 Naval",
    hex: "#2F3D4C",
    productUrl: "https://www.midcontinentcabinetry.com/",
  },
  "cab-stained-oak": {
    sku: "Mid Continent stained oak",
    productUrl: "https://www.midcontinentcabinetry.com/",
  },
  "cab-flat-panel-walnut": {
    sku: "Custom flat-panel walnut",
    line: "Veneer slab door",
  },
  "ct-quartz-calacatta": {
    sku: "MSI Calacatta Laza / similar",
    line: "Polished quartz, Calacatta look",
    productUrl: "https://www.msisurfaces.com/quartz/",
  },
  "ct-quartz-concrete": {
    sku: "Silestone industrial / concrete look",
    line: "Matte quartz",
    productUrl: "https://www.cosentino.com/silestone/",
  },
  "ct-quartz-leathered-black": {
    sku: "Caesarstone 3100 Jet Black leathered",
    productUrl: "https://www.caesarstoneus.com/",
  },
  "ct-porcelain-slab": {
    sku: "Neolith slab",
    line: "Sintered stone waterfall",
    productUrl: "https://www.neolith.com/",
  },
  "bs-subway-white": {
    sku: "Daltile Color Wheel 3×6",
    line: "Gloss subway",
    productUrl: "https://www.daltile.com/products/wall-tile",
  },
  "bs-vertical-stack": {
    sku: "Daltile stacked subway",
    productUrl: "https://www.daltile.com/",
  },
  "bs-zellige": {
    sku: "Cle zellige look",
    productUrl: "https://cletile.com/",
  },
  "tile-std-ceramic": {
    sku: "Daltile ceramic bath package",
    productUrl: "https://www.daltile.com/",
  },
  "tile-porcelain-rectified": {
    sku: "Daltile rectified porcelain",
    productUrl: "https://www.daltile.com/",
  },
  "tile-herringbone": {
    sku: "MSI marble-look herringbone",
    productUrl: "https://www.msisurfaces.com/",
  },
  "fx-chrome-standard": {
    sku: "Moen chrome builder package",
    productUrl: "https://www.moen.com/",
  },
  "fx-brushed-nickel": {
    sku: "Moen Spot Resist Brushed Nickel",
    productUrl: "https://www.moen.com/",
  },
  "fx-matte-black": {
    sku: "Delta matte black package",
    productUrl: "https://www.deltafaucet.com/",
  },
  "fx-champagne-bronze": {
    sku: "Kohler Champagne Bronze",
    productUrl: "https://www.kohler.com/",
  },
  "hw-satin-nickel": {
    sku: "Amerock satin nickel",
    productUrl: "https://www.amerock.com/",
  },
  "hw-matte-black": {
    sku: "Amerock matte black bar",
    productUrl: "https://www.amerock.com/",
  },
  "hw-brass": {
    sku: "Top Knobs aged brass",
    productUrl: "https://www.topknobs.com/",
  },
  "lt-flush-white": {
    sku: "Progress Lighting flush",
    productUrl: "https://www.progresslighting.com/",
  },
  "lt-vanity-bar": {
    sku: "Hinkley vanity bar",
    productUrl: "https://www.hinkleylighting.com/",
  },
  "lt-pendant-black": {
    sku: "Kichler matte black pendant",
    productUrl: "https://www.kichler.com/",
  },
  "ap-ss-mid": {
    sku: "GE / Whirlpool stainless package",
    productUrl: "https://www.geappliances.com/",
  },
  "ap-ss-upgrade": {
    sku: "GE Profile gas range package",
    productUrl: "https://www.geappliances.com/ge/profile/",
  },
  "ap-black-stainless": {
    sku: "Samsung black stainless",
    productUrl: "https://www.samsung.com/us/home-appliances/",
  },
  "ap-pro-range": {
    sku: "Café / Thermador entry pro range",
    productUrl: "https://www.cafeappliances.com/",
  },
  "ext-lap-siding-white": {
    sku: "LP SmartSide lap",
    productUrl: "https://lpcorp.com/products/siding",
  },
  "ext-board-batten-charcoal": {
    sku: "LP SmartSide panel + batten",
    hex: "#434341",
    productUrl: "https://lpcorp.com/products/siding",
  },
  "ext-stone-wainscot": {
    sku: "Cultured Stone Country Ledgestone",
    productUrl: "https://www.culturedstone.com/",
  },
  "roof-arch-shingle": {
    sku: "Owens Corning Duration",
    productUrl: "https://www.owenscorning.com/en-us/roofing",
  },
  "roof-weathered-wood": {
    sku: "Owens Corning Duration Driftwood / Teak",
    productUrl: "https://www.owenscorning.com/en-us/roofing",
  },
  "door-painted-6panel": {
    sku: "JELD-WEN 6-panel",
    productUrl: "https://www.jeld-wen.com/",
  },
  "door-entry-craftsman": {
    sku: "Therma-Tru Fiber-Classic Craftsman",
    productUrl: "https://www.thermatru.com/",
  },
  "door-garage-carriage": {
    sku: "Clopay Gallery / Canyon Ridge",
    productUrl: "https://www.clopaydoor.com/",
  },
};

export function vendorFor(optionId: string | undefined): VendorProduct | undefined {
  if (!optionId) return undefined;
  return VENDOR_BY_OPTION_ID[optionId];
}

export function vendorHex(optionId: string | undefined, fallback?: string): string | undefined {
  return vendorFor(optionId)?.hex ?? fallback;
}

export function vendorLabel(optionId: string | undefined): string | undefined {
  const v = vendorFor(optionId);
  if (!v) return undefined;
  return [v.colorCode ?? v.sku, v.line].filter(Boolean).join(" · ") || undefined;
}
