/**
 * Offline smart-seed estimator for Split Rock Construction.
 *
 * Safe model: short text → structured draft (costs + OH preset + assumptions).
 * Runs 100% offline — rule/heuristic engine with local closed-job blending.
 * Never produces a binding bid; always human-reviewed before use.
 */

import {
  DEFAULT_ASSUMPTIONS,
  applyJobPreset,
  calcPrice,
  type CostInputs,
  type JobPresetId,
  type PricingAssumptions,
} from "./pricing";
import {
  blendHistoryRates,
  emptyCosts,
  type ClosedJobRecord,
  type ProjectKind,
} from "./estimate-history";
import { LIMITS, clampText } from "./security";

export type FinishLevel = "standard" | "upgraded" | "luxury";
export type CommercialSubtype = "shell" | "ti" | "warehouse" | "retail" | "office" | "mixed";

export interface ParsedBrief {
  kind: ProjectKind;
  commercialSubtype: CommercialSubtype | null;
  sqft: number;
  beds: number | null;
  baths: number | null;
  garageBays: number;
  basement: boolean;
  finish: FinishLevel;
  highRisk: boolean;
  earlyStage: boolean;
  volume: boolean;
  custom: boolean;
  semiCustom: boolean;
  ranch: boolean;
  includeLand: boolean;
  landHint: number | null;
  locationHints: string[];
  tags: string[];
  raw: string;
}

export interface EstimateDraft {
  /** Deterministic parse of the brief */
  parsed: ParsedBrief;
  costs: CostInputs;
  assumptions: PricingAssumptions;
  presetId: JobPresetId;
  sqft: number;
  /** 0–1 overall confidence in the draft */
  confidence: number;
  /** Human-readable assumptions the engine used */
  assumptionsList: string[];
  /** Explicit exclusions — not in the number */
  exclusions: string[];
  /** Risks / watch items */
  risks: string[];
  historySummary: string;
  historyMatched: number;
  /** Preview contract price using calcPrice (same math as Bid & Price) */
  previewContractPrice: number;
  previewCostPerSqft: number | null;
  disclaimer: string;
}

// ── Baseline $/sf rates (Idaho residential / light commercial starting points) ─

interface RateTable {
  siteWork: number;
  foundation: number;
  structure: number;
  mep: number;
  finishes: number;
  landscaping: number;
  permitsFees: number;
  other: number;
}

const RES_BASE: RateTable = {
  siteWork: 18,
  foundation: 28,
  structure: 72,
  mep: 38,
  finishes: 55,
  landscaping: 8,
  permitsFees: 5,
  other: 4,
};

const COMM_SHELL_BASE: RateTable = {
  siteWork: 14,
  foundation: 22,
  structure: 58,
  mep: 28,
  finishes: 12,
  landscaping: 3,
  permitsFees: 4,
  other: 5,
};

const COMM_TI_BASE: RateTable = {
  siteWork: 4,
  foundation: 2,
  structure: 18,
  mep: 42,
  finishes: 48,
  landscaping: 1,
  permitsFees: 3,
  other: 6,
};

const COMM_WAREHOUSE: RateTable = {
  siteWork: 12,
  foundation: 18,
  structure: 42,
  mep: 22,
  finishes: 8,
  landscaping: 2,
  permitsFees: 3,
  other: 4,
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Phrase / token match with word boundaries for single tokens so
 * "spec" ≠ "special", "star" ≠ "start", "shell" ≠ "eggshell".
 */
function has(text: string, ...phrases: string[]): boolean {
  return phrases.some((p) => {
    const needle = p.toLowerCase();
    if (needle.includes(" ") || /[^a-z0-9]/.test(needle)) {
      return text.includes(needle);
    }
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`).test(text);
  });
}

function extractNumberNear(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

/** Parse a free-text job brief into structured signals. */
export function parseBrief(input: string): ParsedBrief {
  const raw = clampText(input, LIMITS.estimateBrief);
  const t = raw.toLowerCase().replace(/\s+/g, " ");

  const commercial =
    has(
      t,
      "commercial",
      "tenant improve",
      "tenant improvement",
      "warehouse",
      "industrial",
      "retail",
      "office build",
      "office ti",
      "csi",
      "pay app",
      "tilt-up",
      "tilt up",
      "metal building",
      "shop building",
      "flex space",
      "light industrial",
    ) ||
    has(t, "shell") ||
    has(t, "ti") ||
    /\bt\.i\.?\b/.test(t);

  const kind: ProjectKind = commercial ? "commercial" : "residential";

  let commercialSubtype: CommercialSubtype | null = null;
  if (kind === "commercial") {
    if (has(t, "tenant improve", "tenant improvement") || has(t, "ti") || /\bt\.i\.?\b/.test(t)) {
      commercialSubtype = "ti";
    } else if (has(t, "shell", "core and shell", "core & shell")) {
      commercialSubtype = "shell";
    } else if (has(t, "warehouse", "industrial", "tilt-up", "tilt up", "metal building", "shop")) {
      commercialSubtype = "warehouse";
    } else if (has(t, "retail")) commercialSubtype = "retail";
    else if (has(t, "office")) commercialSubtype = "office";
    else commercialSubtype = "mixed";
  }

  const sqftRaw =
    extractNumberNear(t, [
      /([\d,]{3,6})\s*(?:sf|sq\.?\s*ft|sqft|square\s*feet)/i,
      /(?:sf|sq\.?\s*ft|sqft)\s*([\d,]{3,6})/i,
      /([\d,]{3,6})\s*(?:sf|sqft)/i,
    ]) ?? (kind === "commercial" ? 12000 : 2400);
  // Cap absurd sizes so a poisoned brief can't overflow pricing UI
  const sqft = Math.min(Math.round(sqftRaw), kind === "commercial" ? 500_000 : 50_000);

  const beds = extractNumberNear(t, [/(\d+)\s*(?:bed|br|bedroom)/i]);
  const baths = extractNumberNear(t, [/(\d+(?:\.\d+)?)\s*(?:bath|ba\b)/i]);

  let garageBays = 0;
  if (has(t, "3-car", "3 car", "three car", "3car")) garageBays = 3;
  else if (has(t, "2-car", "2 car", "two car", "2car", "double garage")) garageBays = 2;
  else if (has(t, "4-car", "4 car", "four car")) garageBays = 4;
  else if (has(t, "garage")) garageBays = 2;

  const basement = has(t, "basement", "daylight basement", "walkout");
  const ranch = has(t, "ranch", "single story", "single-story", "1-story", "one story");
  const custom = has(t, "full custom", "custom home", "custom build", "owner design");
  const semiCustom = has(t, "semi-custom", "semi custom", "plan tweak", "upgraded finish");
  // Word-boundary "spec" avoids matching "special" / "specification" mid-word issues for "spec "
  const volume =
    has(t, "volume", "production", "tract", "multiple homes", "preferred sub") ||
    has(t, "spec") ||
    t.includes("spec home") ||
    t.includes("spec ranch");
  const earlyStage = has(t, "first job", "early stage", "startup", "first few");
  const highRisk = has(
    t,
    "steep",
    "hillside",
    "winter start",
    "remote",
    "difficult access",
    "high risk",
    "bad soil",
    "engineered fill",
    "flood",
    "phased occupied",
  );

  let finish: FinishLevel = "standard";
  if (has(t, "luxury", "high-end", "high end", "premium finish", "custom finish")) finish = "luxury";
  else if (has(t, "upgrade", "upgraded", "better finish", "semi-custom", "semi custom")) finish = "upgraded";

  const includeLand = has(t, "include land", "with land", "land included", "lot included");
  const landHint = extractNumberNear(t, [
    /land\s*(?:at|@|for)?\s*\$?\s*([\d,]+)/i,
    /lot\s*(?:at|@|for)?\s*\$?\s*([\d,]+)/i,
  ]);

  const locationHints: string[] = [];
  for (const place of [
    "rigby",
    "meridian",
    "nampa",
    "eagle",
    "kuna",
    "star",
    "caldwell",
    "idaho falls",
    "rexburg",
    "rigby",
    "ammon",
    "jefferson",
    "teton heights",
    "treasure valley",
    "eastern idaho",
  ]) {
    if (has(t, place)) locationHints.push(place);
  }

  const tags: string[] = [kind];
  if (commercialSubtype) tags.push(commercialSubtype);
  if (ranch) tags.push("ranch");
  if (basement) tags.push("basement");
  if (garageBays >= 3) tags.push("3car");
  if (finish !== "standard") tags.push(finish);
  if (volume) tags.push("spec");
  if (custom) tags.push("custom");
  if (highRisk) tags.push("high_risk");
  locationHints.forEach((l) => tags.push(l.replace(/\s+/g, "_")));

  return {
    kind,
    commercialSubtype,
    sqft,
    beds,
    baths,
    garageBays,
    basement,
    finish,
    highRisk,
    earlyStage,
    volume,
    custom,
    semiCustom,
    ranch,
    includeLand,
    landHint,
    locationHints,
    tags,
    raw,
  };
}

function pickPreset(p: ParsedBrief): JobPresetId {
  if (p.highRisk) return "high_risk";
  if (p.earlyStage) return "early_stage";
  if (p.kind === "commercial") {
    if (p.commercialSubtype === "ti") return "semi_custom";
    if (p.volume) return "volume_spec";
    return "full_custom";
  }
  if (p.custom || p.finish === "luxury") return "full_custom";
  if (p.semiCustom || p.finish === "upgraded") return "semi_custom";
  if (p.volume && p.ranch) return "volume_spec";
  if (p.ranch || p.volume) return "spec_ranch";
  return "semi_custom";
}

function baseRatesFor(p: ParsedBrief): RateTable {
  if (p.kind === "residential") {
    const r = { ...RES_BASE };
    if (p.finish === "upgraded") {
      r.finishes *= 1.18;
      r.mep *= 1.08;
    }
    if (p.finish === "luxury") {
      r.finishes *= 1.45;
      r.mep *= 1.2;
      r.structure *= 1.1;
    }
    if (p.basement) {
      r.foundation *= 1.55;
      r.mep *= 1.12;
      r.structure *= 1.08;
    }
    if (p.garageBays >= 3) {
      r.structure += 8;
      r.foundation += 3;
    } else if (p.garageBays === 2) {
      r.structure += 4;
      r.foundation += 1.5;
    }
    if (p.ranch) {
      r.structure *= 0.96;
      r.foundation *= 1.06;
    }
    return r;
  }

  let r: RateTable;
  switch (p.commercialSubtype) {
    case "ti":
      r = { ...COMM_TI_BASE };
      break;
    case "warehouse":
      r = { ...COMM_WAREHOUSE };
      break;
    case "retail":
      r = { ...COMM_SHELL_BASE, finishes: 28, mep: 34 };
      break;
    case "office":
      r = { ...COMM_SHELL_BASE, finishes: 32, mep: 36, structure: 52 };
      break;
    case "shell":
    default:
      r = { ...COMM_SHELL_BASE };
      break;
  }
  if (p.finish === "upgraded") {
    r.finishes *= 1.2;
    r.mep *= 1.1;
  }
  if (p.finish === "luxury") {
    r.finishes *= 1.4;
    r.mep *= 1.18;
  }
  return r;
}

function ratesToCosts(rates: RateTable, sqft: number, land: number): CostInputs {
  const m = (psf: number) => Math.round(psf * sqft);
  return {
    land: Math.round(land),
    siteWork: m(rates.siteWork),
    foundation: m(rates.foundation),
    structure: m(rates.structure),
    mep: m(rates.mep),
    finishes: m(rates.finishes),
    landscaping: m(rates.landscaping),
    permitsFees: m(rates.permitsFees),
    other: m(rates.other),
  };
}

function mixRates(base: RateTable, hist: CostInputs, weight: number): RateTable {
  if (weight <= 0) return base;
  const mix = (a: number, b: number) => a * (1 - weight) + b * weight;
  return {
    siteWork: mix(base.siteWork, hist.siteWork),
    foundation: mix(base.foundation, hist.foundation),
    structure: mix(base.structure, hist.structure),
    mep: mix(base.mep, hist.mep),
    finishes: mix(base.finishes, hist.finishes),
    landscaping: mix(base.landscaping, hist.landscaping),
    permitsFees: mix(base.permitsFees, hist.permitsFees),
    other: mix(base.other, hist.other),
  };
}

function confidenceFor(p: ParsedBrief, historyMatched: number): number {
  let c = 0.42;
  if (p.raw.length >= 20) c += 0.08;
  if (/\d{3,}/.test(p.raw)) c += 0.1;
  if (p.kind === "residential" && (p.ranch || p.custom || p.semiCustom || p.volume)) c += 0.08;
  if (p.kind === "commercial" && p.commercialSubtype) c += 0.1;
  if (p.locationHints.length) c += 0.05;
  if (historyMatched > 0) c += Math.min(0.18, historyMatched * 0.05);
  if (p.raw.length < 8) c -= 0.15;
  return Math.max(0.25, Math.min(0.88, c));
}

const DEFAULT_EXCLUSIONS = [
  "Not a bid — draft seed only; supers/estimator must review every line",
  "No subcontractor quotes or material takeoffs",
  "No geotech, survey, impact fees beyond permits allowance",
  "No FF&E, appliances, or owner-furnished items",
  "No escalation beyond contingency line",
];

/**
 * Build a full offline draft from short text.
 * Optional `closedJobs` injects history without touching localStorage (tests).
 */
export function draftEstimateFromText(
  text: string,
  options?: { closedJobs?: ClosedJobRecord[] },
): EstimateDraft {
  const parsed = parseBrief(text || "standard residential home");
  const presetId = pickPreset(parsed);
  const assumptions: PricingAssumptions = { ...applyJobPreset(presetId, DEFAULT_ASSUMPTIONS) };

  if (parsed.kind === "commercial" && assumptions.softCosts < 18000) {
    assumptions.softCosts = Math.max(
      assumptions.softCosts,
      parsed.commercialSubtype === "ti" ? 16000 : 22000,
    );
  }

  let rates = baseRatesFor(parsed);
  const history = blendHistoryRates(parsed.kind, parsed.tags, options?.closedJobs);
  rates = mixRates(rates, history.rates, history.weight);

  const land =
    parsed.includeLand || parsed.landHint
      ? parsed.landHint ?? (parsed.kind === "residential" ? 95000 : 0)
      : 0;

  const costs = ratesToCosts(rates, parsed.sqft, land);
  const price = calcPrice(costs, assumptions, parsed.sqft);

  const assumptionsList: string[] = [
    `Type: ${parsed.kind}${parsed.commercialSubtype ? ` · ${parsed.commercialSubtype}` : ""}`,
    `Area: ${parsed.sqft.toLocaleString()} sf`,
    `Preset: ${presetId.replace(/_/g, " ")} (OH ${assumptions.overheadPct}% · Profit ${assumptions.profitPct}% · Cont ${assumptions.contingencyPct}%)`,
    `Finish level: ${parsed.finish}`,
  ];
  if (parsed.basement) assumptionsList.push("Basement included (foundation/MEP uplift)");
  if (parsed.garageBays) assumptionsList.push(`Garage: ${parsed.garageBays}-car allowance`);
  if (parsed.beds) assumptionsList.push(`Beds mentioned: ${parsed.beds}`);
  if (parsed.locationHints.length) assumptionsList.push(`Location hints: ${parsed.locationHints.join(", ")}`);
  assumptionsList.push(history.summary);

  const risks: string[] = [];
  if (parsed.highRisk) risks.push("High-risk signals in brief — contingency/profit elevated via preset");
  if (parsed.kind === "commercial" && parsed.commercialSubtype === "ti") {
    risks.push("TI scope varies widely — verify MEP capacity and landlord shell conditions");
  }
  if (parsed.sqft >= 8000 && parsed.kind === "residential") {
    risks.push("Large residential footprint — confirm takeoff; $/sf may not scale linearly");
  }
  if (!/\d/.test(parsed.raw)) {
    risks.push("No size in brief — used default sf; edit sqft before pricing");
  }
  if (history.matched.length === 0) {
    risks.push("No closed-job history yet — rates are company baselines until you record finished jobs");
  }

  const exclusions = [...DEFAULT_EXCLUSIONS];
  if (!land) exclusions.push("Land / lot cost not included");
  if (parsed.kind === "commercial") {
    exclusions.push("Bonds, builder's risk, and special inspections beyond other allowance");
  }

  return {
    parsed,
    costs,
    assumptions,
    presetId,
    sqft: parsed.sqft,
    confidence: confidenceFor(parsed, history.matched.length),
    assumptionsList,
    exclusions,
    risks,
    historySummary: history.summary,
    historyMatched: history.matched.length,
    previewContractPrice: price.contractPrice,
    previewCostPerSqft: price.costPerSqft,
    disclaimer:
      "Draft estimate only — not a bid or contract price. Review and edit every line before presenting to an owner or lender.",
  };
}

/** Example prompts shown in the UI */
export const DRAFT_EXAMPLES = [
  "1600 sf ranch + basement, 3-car, Teton Heights spec",
  "2400 sf semi-custom, Rigby, upgraded finishes",
  "18000 sf commercial shell, Rigby light industrial",
  "4500 sf retail TI, Rigby strip center",
] as const;
