/**
 * Design Center catalog — curated options for client selection meetings.
 * priceDelta is relative to the plan allowance baseline (0 = standard).
 * partnerCategory maps to Finish Partners for purchase links.
 */

import type { DesignCategory, DesignOption } from "@/data/types";
import type { FinishCategory } from "@/lib/finish-partners";

export type DesignRoom =
  | "great_room"
  | "kitchen"
  | "primary_bath"
  | "hall_bath"
  | "primary_suite"
  | "exterior";

export const ROOM_LABELS: Record<DesignRoom, string> = {
  great_room: "Great room",
  kitchen: "Kitchen",
  primary_bath: "Primary bath",
  hall_bath: "Hall bath",
  primary_suite: "Primary suite",
  exterior: "Exterior",
};

export const DESIGN_CATEGORY_LABELS: Record<DesignCategory, string> = {
  paint: "Paint",
  flooring: "Flooring",
  cabinets: "Cabinets",
  countertops: "Countertops",
  fixtures: "Plumbing fixtures",
  hardware: "Hardware",
  exterior: "Exterior",
  lighting: "Lighting",
};

/** Which catalog categories apply in each room (client UX). */
export const ROOM_CATEGORIES: Record<DesignRoom, DesignCategory[]> = {
  great_room: ["paint", "flooring", "lighting", "hardware"],
  kitchen: ["paint", "flooring", "cabinets", "countertops", "fixtures", "hardware", "lighting"],
  primary_bath: ["paint", "flooring", "cabinets", "countertops", "fixtures", "hardware", "lighting"],
  hall_bath: ["paint", "flooring", "fixtures", "hardware", "lighting"],
  primary_suite: ["paint", "flooring", "lighting", "hardware"],
  exterior: ["exterior", "paint"],
};

export function partnerCategoryForDesign(cat: DesignCategory): FinishCategory {
  switch (cat) {
    case "paint":
      return "general";
    case "flooring":
      return "flooring";
    case "cabinets":
    case "countertops":
      return "general";
    case "fixtures":
      return "plumbing";
    case "hardware":
      return "hardware";
    case "exterior":
      return "general";
    case "lighting":
      return "lighting";
    default:
      return "general";
  }
}

export const DESIGN_OPTIONS: DesignOption[] = [
  // Paint — walls
  {
    id: "paint-swiss-coffee",
    category: "paint",
    name: "Swiss Coffee",
    brand: "Benjamin Moore",
    finish: "Eggshell",
    colorHex: "#F5F2E9",
    priceDelta: 0,
    allowanceBucket: "Paint",
    imageHint: "warm off-white walls",
  },
  {
    id: "paint-agreeable-gray",
    category: "paint",
    name: "Agreeable Gray",
    brand: "Sherwin-Williams",
    finish: "Eggshell",
    colorHex: "#D1CBC1",
    priceDelta: 0,
    allowanceBucket: "Paint",
    imageHint: "soft warm gray",
  },
  {
    id: "paint-alabaster",
    category: "paint",
    name: "Alabaster",
    brand: "Sherwin-Williams",
    finish: "Eggshell",
    colorHex: "#F0EDE4",
    priceDelta: 0,
    allowanceBucket: "Paint",
    imageHint: "clean warm white",
  },
  {
    id: "paint-accessible-beige",
    category: "paint",
    name: "Accessible Beige",
    brand: "Sherwin-Williams",
    finish: "Eggshell",
    colorHex: "#D2C8B6",
    priceDelta: 0,
    allowanceBucket: "Paint",
    imageHint: "taupe beige",
  },
  {
    id: "paint-naval",
    category: "paint",
    name: "Naval (accent)",
    brand: "Sherwin-Williams",
    finish: "Eggshell",
    colorHex: "#2C3E50",
    priceDelta: 150,
    allowanceBucket: "Paint",
    imageHint: "deep navy accent",
  },
  {
    id: "paint-evergreen-fog",
    category: "paint",
    name: "Evergreen Fog",
    brand: "Sherwin-Williams",
    finish: "Eggshell",
    colorHex: "#95978A",
    priceDelta: 0,
    allowanceBucket: "Paint",
    imageHint: "sage green-gray",
  },

  // Flooring
  {
    id: "fl-lvp-oak",
    category: "flooring",
    name: "LVP — Natural Oak",
    brand: "CoreTec",
    finish: "Rigid core",
    colorHex: "#C4A574",
    priceDelta: 0,
    allowanceBucket: "Flooring",
    imageHint: "light oak plank",
  },
  {
    id: "fl-lvp-walnut",
    category: "flooring",
    name: "LVP — Walnut",
    brand: "CoreTec",
    finish: "Rigid core",
    colorHex: "#6B4E31",
    priceDelta: 1.25,
    allowanceBucket: "Flooring",
    imageHint: "medium walnut plank",
  },
  {
    id: "fl-hardwood-white-oak",
    category: "flooring",
    name: "Engineered white oak",
    brand: "Shaw",
    finish: "Matte",
    woodSpecies: "White oak",
    colorHex: "#D4C4A8",
    priceDelta: 4.5,
    allowanceBucket: "Flooring",
    imageHint: "premium white oak",
  },
  {
    id: "fl-tile-porcelain-gray",
    category: "flooring",
    name: "Porcelain tile — Soft Gray",
    brand: "Daltile",
    finish: "Matte 12x24",
    colorHex: "#B8B5B0",
    priceDelta: 2,
    allowanceBucket: "Flooring",
    imageHint: "gray porcelain",
  },
  {
    id: "fl-carpet-neutral",
    category: "flooring",
    name: "Carpet — Neutral Twist",
    brand: "Mohawk",
    finish: "Soft",
    colorHex: "#C9C2B8",
    priceDelta: -1.5,
    allowanceBucket: "Flooring",
    imageHint: "beige carpet",
  },

  // Cabinets
  {
    id: "cab-shaker-white",
    category: "cabinets",
    name: "Shaker — Painted White",
    brand: "Mid Continent",
    finish: "Painted",
    colorHex: "#F7F7F5",
    priceDelta: 0,
    allowanceBucket: "Cabinets",
    imageHint: "white shaker",
  },
  {
    id: "cab-shaker-greige",
    category: "cabinets",
    name: "Shaker — Greige",
    brand: "Mid Continent",
    finish: "Painted",
    colorHex: "#B7A99A",
    priceDelta: 800,
    allowanceBucket: "Cabinets",
    imageHint: "greige shaker",
  },
  {
    id: "cab-shaker-navy",
    category: "cabinets",
    name: "Shaker — Navy island",
    brand: "Mid Continent",
    finish: "Painted",
    colorHex: "#2F3E4C",
    priceDelta: 1200,
    allowanceBucket: "Cabinets",
    imageHint: "navy island",
  },
  {
    id: "cab-stained-oak",
    category: "cabinets",
    name: "Stained white oak",
    brand: "Mid Continent",
    finish: "Clear stain",
    woodSpecies: "White oak",
    colorHex: "#C9B896",
    priceDelta: 2800,
    allowanceBucket: "Cabinets",
    imageHint: "natural oak cabinets",
  },

  // Countertops
  {
    id: "ct-quartz-calacatta",
    category: "countertops",
    name: "Quartz — Calacatta look",
    brand: "Cambria",
    finish: "Polished",
    colorHex: "#F2EFEA",
    priceDelta: 0,
    allowanceBucket: "Countertops",
    imageHint: "white quartz",
  },
  {
    id: "ct-quartz-concrete",
    category: "countertops",
    name: "Quartz — Soft concrete",
    brand: "Silestone",
    finish: "Matte",
    colorHex: "#A8A6A1",
    priceDelta: 400,
    allowanceBucket: "Countertops",
    imageHint: "gray quartz",
  },
  {
    id: "ct-granite-absolute",
    category: "countertops",
    name: "Granite — Absolute Black",
    brand: "Local slab",
    finish: "Honed",
    colorHex: "#1A1A1A",
    priceDelta: -200,
    allowanceBucket: "Countertops",
    imageHint: "black granite",
  },

  // Plumbing fixtures
  {
    id: "fx-chrome-standard",
    category: "fixtures",
    name: "Chrome — builder package",
    brand: "Moen",
    finish: "Chrome",
    colorHex: "#C0C0C0",
    priceDelta: 0,
    allowanceBucket: "Plumbing fixtures",
    imageHint: "chrome faucet",
  },
  {
    id: "fx-brushed-nickel",
    category: "fixtures",
    name: "Brushed nickel",
    brand: "Moen",
    finish: "Brushed nickel",
    colorHex: "#A8A9AD",
    priceDelta: 350,
    allowanceBucket: "Plumbing fixtures",
    imageHint: "brushed nickel",
  },
  {
    id: "fx-matte-black",
    category: "fixtures",
    name: "Matte black",
    brand: "Delta",
    finish: "Matte black",
    colorHex: "#2B2B2B",
    priceDelta: 650,
    allowanceBucket: "Plumbing fixtures",
    imageHint: "matte black faucet",
  },
  {
    id: "fx-champagne-bronze",
    category: "fixtures",
    name: "Champagne bronze",
    brand: "Kohler",
    finish: "Champagne bronze",
    colorHex: "#B08D57",
    priceDelta: 900,
    allowanceBucket: "Plumbing fixtures",
    imageHint: "warm bronze",
  },

  // Hardware
  {
    id: "hw-satin-nickel",
    category: "hardware",
    name: "Satin nickel pulls",
    brand: "Amerock",
    finish: "Satin nickel",
    colorHex: "#A8A9AD",
    priceDelta: 0,
    allowanceBucket: "Hardware",
    imageHint: "satin nickel",
  },
  {
    id: "hw-matte-black",
    category: "hardware",
    name: "Matte black pulls",
    brand: "Amerock",
    finish: "Matte black",
    colorHex: "#2B2B2B",
    priceDelta: 120,
    allowanceBucket: "Hardware",
    imageHint: "black hardware",
  },
  {
    id: "hw-brass",
    category: "hardware",
    name: "Aged brass",
    brand: "Top Knobs",
    finish: "Aged brass",
    colorHex: "#B5A642",
    priceDelta: 280,
    allowanceBucket: "Hardware",
    imageHint: "brass hardware",
  },

  // Lighting
  {
    id: "lt-flush-white",
    category: "lighting",
    name: "Flush mount — white",
    brand: "Progress",
    finish: "White",
    colorHex: "#F5F5F5",
    priceDelta: 0,
    allowanceBucket: "Lighting",
    imageHint: "simple flush",
  },
  {
    id: "lt-pendant-black",
    category: "lighting",
    name: "Pendant — matte black",
    brand: "Kichler",
    finish: "Matte black",
    colorHex: "#2B2B2B",
    priceDelta: 220,
    allowanceBucket: "Lighting",
    imageHint: "black pendant",
  },
  {
    id: "lt-chandelier-brass",
    category: "lighting",
    name: "Chandelier — brushed brass",
    brand: "Visual Comfort",
    finish: "Brushed brass",
    colorHex: "#C5A572",
    priceDelta: 850,
    allowanceBucket: "Lighting",
    imageHint: "brass chandelier",
  },
  {
    id: "lt-vanity-bar",
    category: "lighting",
    name: "Vanity bar — chrome",
    brand: "Hinkley",
    finish: "Chrome",
    colorHex: "#C0C0C0",
    priceDelta: 0,
    allowanceBucket: "Lighting",
    imageHint: "vanity bar",
  },

  // Exterior
  {
    id: "ext-lap-siding-white",
    category: "exterior",
    name: "Lap siding — white",
    brand: "LP SmartSide",
    finish: "Painted",
    colorHex: "#F4F1EA",
    priceDelta: 0,
    allowanceBucket: "Exterior",
    imageHint: "white siding",
  },
  {
    id: "ext-board-batten-charcoal",
    category: "exterior",
    name: "Board & batten — charcoal",
    brand: "LP SmartSide",
    finish: "Painted",
    colorHex: "#4A4A48",
    priceDelta: 1800,
    allowanceBucket: "Exterior",
    imageHint: "charcoal b&b",
  },
  {
    id: "ext-stone-wainscot",
    category: "exterior",
    name: "Cultured stone wainscot",
    brand: "Cultured Stone",
    finish: "Natural",
    colorHex: "#8B7D6B",
    priceDelta: 4200,
    allowanceBucket: "Exterior",
    imageHint: "stone base",
  },
];

export function optionsForCategory(cat: DesignCategory): DesignOption[] {
  return DESIGN_OPTIONS.filter((o) => o.category === cat);
}

export function optionById(id: string): DesignOption | undefined {
  return DESIGN_OPTIONS.find((o) => o.id === id);
}

/** Default starter package for a new design session */
export const DEFAULT_SELECTIONS: Partial<Record<DesignCategory, string>> = {
  paint: "paint-alabaster",
  flooring: "fl-lvp-oak",
  cabinets: "cab-shaker-white",
  countertops: "ct-quartz-calacatta",
  fixtures: "fx-chrome-standard",
  hardware: "hw-satin-nickel",
  lighting: "lt-flush-white",
  exterior: "ext-lap-siding-white",
};

export function formatDelta(n: number): string {
  if (n === 0) return "Included";
  const abs = Math.abs(n);
  const formatted =
    abs >= 100
      ? `$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : `$${abs.toFixed(abs % 1 ? 2 : 0)}`;
  return n > 0 ? `+${formatted}` : `−${formatted}`;
}
