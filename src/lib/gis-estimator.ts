/**
 * GIS / plat-aware estimator layer for Split Rock Construction.
 *
 * Wraps the offline draft engine with Teton Heights lot geometry, Jefferson
 * County parcel context, and typical Eastern Idaho site allowances
 * (well, septic, driveway) that public lot pricing excludes.
 *
 * Never a binding bid. Geometry is operational / schematic — not a survey.
 */

import {
  defaultImprovements,
  getLot,
  JEFFERSON_GIS,
  sitePlanNarrative,
  TETON_HEIGHTS_CENTER,
  type LotPlan,
} from "@/data/teton-heights-gis";
import { draftEstimateFromText, type EstimateDraft } from "@/lib/estimate-draft";
import { TETON_BASE_LOT } from "@/lib/lot-pricing";
import { calcPrice, type CostInputs } from "@/lib/pricing";
import type { ClosedJobRecord } from "@/lib/estimate-history";

export const TETON_SITE_ALLOWANCES = {
  well: 15_000,
  septic: 13_500,
  driveway: 11_000,
} as const;

/** Site work baseline assumes a typical 0.62 ac Teton Heights lot. */
export const BASELINE_LOT_ACRES = 0.62;

export type GisEstimateOptions = {
  brief: string;
  lotNumber?: number | null;
  includeLand?: boolean;
  includeSiteAllowances?: boolean;
  closedJobs?: ClosedJobRecord[];
};

export type PlatConstraint = {
  id: string;
  label: string;
  detail: string;
};

export type GisEstimate = {
  draft: EstimateDraft;
  lot: LotPlan | null;
  lotNumber: number | null;
  acres: number | null;
  landIncluded: number;
  siteAllowances: {
    well: number;
    septic: number;
    driveway: number;
    total: number;
    includedInContract: boolean;
  };
  costs: CostInputs;
  contractPrice: number;
  allInWithSite: number;
  costPerSqft: number | null;
  platConstraints: PlatConstraint[];
  gisNotes: string[];
  narrative: string;
  countyPortal: string;
};

function clampLot(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= 1 && i <= 12 ? i : null;
}

function siteWorkFactor(acres: number): number {
  if (acres <= 0) return 1;
  const raw = acres / BASELINE_LOT_ACRES;
  return Math.max(0.85, Math.min(1.45, raw));
}

export function platConstraintsFor(lot: LotPlan): PlatConstraint[] {
  const imp = defaultImprovements(lot);
  return [
    {
      id: "setbacks",
      label: "Building setbacks",
      detail: "Front / side / rear envelope from plat schematic — confirm recorded plat before staking.",
    },
    {
      id: "well",
      label: "Pre-approved well site",
      detail: `Plan-ft well marker (${imp.well[0].toFixed(0)}, ${imp.well[1].toFixed(0)}). Private well — not in lot price.`,
    },
    {
      id: "septic",
      label: "Septic + drainfield zone",
      detail: `Tank at (${imp.septicTank[0].toFixed(0)}, ${imp.septicTank[1].toFixed(0)}) plan-ft. EIPH placement envelope — not in lot price.`,
    },
    {
      id: "easements",
      label: "Utility / drainage easements",
      detail: "Improvement-plan easement corridors along street and mid-block. Do not place structure in easement.",
    },
    {
      id: "utilities",
      label: "Power / gas laterals",
      detail: "Service laterals from ROW to building. Confirm transformer / gas availability on the specific lot.",
    },
  ];
}

export function buildGisBrief(brief: string, lot: LotPlan | null): string {
  const base = brief.trim();
  if (!lot) return base || "1600 sf ranch + basement, Teton Heights spec";
  const tag = `Teton Heights Lot ${lot.lotNumber}, ${lot.acres} ac, Rigby`;
  if (base.toLowerCase().includes(`lot ${lot.lotNumber}`)) return base;
  if (!base) return `1600 sf ranch + basement, 3-car, ${tag} spec`;
  return `${base}; ${tag}`;
}

export function draftGisEstimate(options: GisEstimateOptions): GisEstimate {
  const lotNumber = clampLot(options.lotNumber);
  const lot = lotNumber ? (getLot(lotNumber) ?? null) : null;
  const brief = buildGisBrief(options.brief, lot);
  const includeLand = options.includeLand ?? Boolean(lot);
  const includeSite = options.includeSiteAllowances ?? false;

  const landHint = includeLand ? TETON_BASE_LOT : 0;
  const seededBrief = includeLand ? `${brief}; include land at ${landHint}` : brief;

  const draft = draftEstimateFromText(seededBrief, { closedJobs: options.closedJobs });
  const costs: CostInputs = { ...draft.costs };

  if (lot) {
    const factor = siteWorkFactor(lot.acres);
    costs.siteWork = Math.round(costs.siteWork * factor);
    if (includeLand && costs.land <= 0) costs.land = TETON_BASE_LOT;
  }

  const siteAllowances = {
    well: includeSite ? TETON_SITE_ALLOWANCES.well : 0,
    septic: includeSite ? TETON_SITE_ALLOWANCES.septic : 0,
    driveway: includeSite ? TETON_SITE_ALLOWANCES.driveway : 0,
    total: 0,
    includedInContract: includeSite,
  };
  siteAllowances.total = siteAllowances.well + siteAllowances.septic + siteAllowances.driveway;

  if (includeSite) {
    costs.other = Math.round(costs.other + siteAllowances.total);
  }

  const price = calcPrice(costs, draft.assumptions, draft.sqft);
  const contractPrice = price.contractPrice;
  const allInWithSite = includeSite ? contractPrice : contractPrice + siteAllowances.total;

  const platConstraints = lot ? platConstraintsFor(lot) : [];
  const gisNotes: string[] = [
    "Draft only — not a bid, contract price, or lender commitment.",
    `Basemap: Esri World Imagery · ${JEFFERSON_GIS.attribution}`,
    "Parcel lines are tax mapping (IDWR / Jefferson County Assessor) — not a recorded survey.",
  ];
  if (lot) {
    gisNotes.push(
      `Plat overlay: Teton Heights Div. #6 Lot ${lot.lotNumber} · ${lot.acres} ac · ${TETON_HEIGHTS_CENTER.streetRef}`,
    );
    gisNotes.push(
      `Site work scaled ${Math.round(siteWorkFactor(lot.acres) * 100)}% vs ${BASELINE_LOT_ACRES} ac baseline.`,
    );
    if (lot.notes) gisNotes.push(lot.notes);
  } else {
    gisNotes.push("No plat lot selected — rates are company baselines without lot-specific site scaling.");
  }
  if (!includeSite) {
    gisNotes.push(
      `Well / septic / driveway excluded (typical allowances ${TETON_SITE_ALLOWANCES.well.toLocaleString()} / ${TETON_SITE_ALLOWANCES.septic.toLocaleString()} / ${TETON_SITE_ALLOWANCES.driveway.toLocaleString()}).`,
    );
  } else {
    gisNotes.push("Well, septic, and driveway allowances rolled into Other — replace with sub quotes before bidding.");
  }

  const narrative = lot
    ? sitePlanNarrative(lot)
    : [
        "SITE PLAN / GIS CONTEXT",
        "No Teton Heights lot selected.",
        `County GIS: ${JEFFERSON_GIS.portal}`,
        "Pick a lot on Site plan layout to lock plat constraints and site-work scaling.",
      ].join("\n");

  return {
    draft,
    lot,
    lotNumber,
    acres: lot?.acres ?? null,
    landIncluded: costs.land,
    siteAllowances,
    costs,
    contractPrice,
    allInWithSite,
    costPerSqft: draft.sqft ? Math.round(contractPrice / draft.sqft) : null,
    platConstraints,
    gisNotes,
    narrative,
    countyPortal: JEFFERSON_GIS.portal,
  };
}

export const GIS_ESTIMATOR_EXAMPLES = [
  "1600 sf ranch + basement, 3-car, Teton Heights spec",
  "1580 sf spec ranch on Lot 16 Block 8, standard finishes",
  "2400 sf semi-custom, Rigby, upgraded finishes, include land",
  "2100 sf Cole spec Lot 7, 3-car, basement",
] as const;
