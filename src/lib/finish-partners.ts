/**
 * Preferred finish suppliers with slots for Split Rock affiliate / referral IDs.
 *
 * Referral income is governed by contract-fee-policy.ts based on ContractModel:
 * - cost_plus → credit to Job Cost (no hidden fee)
 * - fixed_price → disclosed; may be builder income inside the lump sum
 * - spec_build_close → builder program income; buyer pays purchase + options only
 */

import type { ContractModel } from "@/lib/pricing";
import { shopDisclosureFor } from "@/lib/contract-fee-policy";

export type FinishCategory =
  | "lighting"
  | "appliances"
  | "plumbing"
  | "hardware"
  | "window_coverings"
  | "water_treatment"
  | "flooring"
  | "general";

export type PartnerKind = "affiliate" | "trade" | "local_referral";

export interface FinishPartner {
  id: string;
  name: string;
  categories: FinishCategory[];
  kind: PartnerKind;
  /** Public catalog home (no tracking). */
  baseUrl: string;
  /** Optional path or query for category landing when no custom affiliate URL. */
  categoryPaths?: Partial<Record<FinishCategory, string>>;
  notes: string;
  /** Rough published rates — verify in your publisher dashboard. */
  typicalCommission?: string;
  network?: string;
  applyUrl?: string;
  idahoNote?: string;
}

/** Paste your live tracking IDs or full affiliate URLs after approval. */
export const PARTNER_AFFILIATE_IDS: Record<string, string> = {
  // Examples after you join (replace):
  // wayfair: "https://www.anrdoezrs.net/click-XXXXX-YYYYY",
  // homedepot: "https://homedepot.sjv.io/c/XXXXX/YYYYY",
  // lampsplus: "https://www.dpbolvw.net/click-XXXXX",
  // ferguson: "",
};

export const FINISH_PARTNERS: FinishPartner[] = [
  {
    id: "wayfair",
    name: "Wayfair / Wayfair Professional",
    categories: ["lighting", "appliances", "plumbing", "hardware", "window_coverings", "flooring", "general"],
    kind: "affiliate",
    baseUrl: "https://www.wayfair.com",
    categoryPaths: {
      lighting: "/lighting/sb0/lighting.html",
      appliances: "/appliances/sb0/appliances.html",
      plumbing: "/bath/sb0/faucets-and-fixtures.html",
      window_coverings: "/rugs-and-decor/sb0/window-treatments.html",
    },
    notes:
      "Strong for lighting, fixtures, and décor. Join CJ Affiliate (Wayfair) for tracking links. Also open a Wayfair Professional trade account for pro pricing on job buys.",
    typicalCommission: "~5–7% (verify in CJ)",
    network: "CJ Affiliate",
    applyUrl: "https://www.cj.com",
    idahoNote: "Ship-to-site works for many SKUs; confirm lead times before selection deadlines.",
  },
  {
    id: "homedepot",
    name: "The Home Depot",
    categories: ["appliances", "hardware", "plumbing", "lighting", "general"],
    kind: "affiliate",
    baseUrl: "https://www.homedepot.com",
    categoryPaths: {
      appliances: "/b/Appliances/N-5yc1vZc3oo",
      lighting: "/b/Lighting-Ceiling-Fans/N-5yc1vZbqmd",
      plumbing: "/b/Bath/N-5yc1vZbqly",
      hardware: "/b/Hardware/N-5yc1vZc21m",
    },
    notes:
      "Broad finish + appliance catalog; BOPIS useful for Idaho Falls / Rigby runs. Affiliate via Impact. Appliance commissions are typically lower than décor.",
    typicalCommission: "Up to ~8% décor; ~1–3% appliances (Impact)",
    network: "Impact",
    applyUrl: "https://impact.com",
  },
  {
    id: "lowes",
    name: "Lowe's",
    categories: ["appliances", "plumbing", "hardware", "lighting", "general"],
    kind: "affiliate",
    baseUrl: "https://www.lowes.com",
    categoryPaths: {
      appliances: "/pl/Appliances/4294857975",
      lighting: "/pl/Lighting-Ceiling-Fans/4294726905",
    },
    notes: "CJ Affiliate program; solid appliance and seasonal promos. Pro account for trade pricing on job stock.",
    typicalCommission: "~2–4% typical; select categories higher",
    network: "CJ Affiliate",
    applyUrl: "https://www.cj.com",
  },
  {
    id: "ferguson",
    name: "Ferguson / Build.com",
    categories: ["plumbing", "lighting", "hardware", "appliances"],
    kind: "affiliate",
    baseUrl: "https://www.build.com",
    categoryPaths: {
      plumbing: "/bathroom",
      lighting: "/lighting",
      appliances: "/appliances",
    },
    notes:
      "Primary pro channel for toilets, faucets, valves, and many fixtures. Build.com / Ferguson affiliate rates vary by partner tier (often ~2–6%). Open a trade account for project pricing; affiliate is additive when owners buy retail links.",
    typicalCommission: "~2–6% (program-dependent)",
    network: "Merchant / partner portal",
    applyUrl: "https://www.build.com",
    idahoNote: "Ferguson has regional branches — pair affiliate links with local counter for large orders.",
  },
  {
    id: "lampsplus",
    name: "Lamps Plus",
    categories: ["lighting"],
    kind: "affiliate",
    baseUrl: "https://www.lampsplus.com",
    notes: "Lighting-focused; published affiliate rates around ~8% via FlexOffers / partner networks.",
    typicalCommission: "~8%",
    network: "FlexOffers / partner",
    applyUrl: "https://www.flexoffers.com",
  },
  {
    id: "rensup",
    name: "Renovator's Supply",
    categories: ["plumbing", "hardware", "lighting"],
    kind: "affiliate",
    baseUrl: "https://www.rensup.com",
    notes: "Period fixtures, hardware, specialty toilets — useful for custom / restoration-adjacent specs. Direct affiliate program.",
    typicalCommission: "~6–15% tiered",
    network: "Direct",
    applyUrl: "https://www.rensup.com/join-affiliate-program/benefits-summary",
  },
  {
    id: "amazon",
    name: "Amazon Associates",
    categories: ["hardware", "lighting", "water_treatment", "general"],
    kind: "affiliate",
    baseUrl: "https://www.amazon.com",
    notes:
      "Fallback for water softener kits, specialty hardware, and fast-ship accessories. Lower %, short cookie — use when speed matters more than margin.",
    typicalCommission: "~1–4.5% by category",
    network: "Amazon Associates",
    applyUrl: "https://affiliate-program.amazon.com",
  },
  {
    id: "local_water",
    name: "Local water treatment dealer",
    categories: ["water_treatment"],
    kind: "local_referral",
    baseUrl: "https://",
    notes:
      "Culligan / Kinetico / independent dealers in Eastern Idaho usually pay a flat referral fee or spiff — not a public affiliate link. Negotiate a written referral agreement; put the contact and your tracking notes here.",
    typicalCommission: "Flat referral / spiff (negotiate)",
    idahoNote: "Hard water is common in Jefferson County — lock a preferred dealer before plumbing rough.",
  },
  {
    id: "window_dealer",
    name: "Window covering dealer (Hunter Douglas / local)",
    categories: ["window_coverings"],
    kind: "local_referral",
    baseUrl: "https://",
    notes:
      "Most premium shade lines are dealer-only. Set a referral fee with a Rigby / Idaho Falls dealer rather than a public affiliate URL.",
    typicalCommission: "Dealer referral % (negotiate)",
  },
];

export const CATEGORY_LABELS: Record<FinishCategory, string> = {
  lighting: "Light fixtures",
  appliances: "Appliances",
  plumbing: "Toilets & plumbing fixtures",
  hardware: "Door & cabinet hardware",
  window_coverings: "Window coverings",
  water_treatment: "Water softeners & treatment",
  flooring: "Flooring",
  general: "General finishes",
};

export function partnersForCategory(cat: FinishCategory): FinishPartner[] {
  return FINISH_PARTNERS.filter((p) => p.categories.includes(cat));
}

/** Build a shop URL: affiliate override → category path → base. */
export function shopUrl(partner: FinishPartner, category?: FinishCategory): string {
  const custom = PARTNER_AFFILIATE_IDS[partner.id]?.trim();
  if (custom && custom.startsWith("http")) return custom;

  if (category && partner.categoryPaths?.[category]) {
    const path = partner.categoryPaths[category]!;
    if (path.startsWith("http")) return path;
    return partner.baseUrl.replace(/\/$/, "") + path;
  }
  return partner.baseUrl;
}

/** Generic disclosure when contract model is unknown */
export const AFFILIATE_DISCLOSURE =
  "Partner links may involve supplier referral programs. Treatment of any referral income follows the contract type selected for this job (cost-plus credits Job Cost; fixed-price / spec are disclosed and do not add hidden fees beyond the agreed price and written upgrades).";

export function affiliateDisclosureFor(model?: ContractModel): string {
  if (!model) return AFFILIATE_DISCLOSURE;
  return shopDisclosureFor(model);
}
