export type ContractModel = "fixed_price" | "cost_plus" | "spec_build_close";
export type PaymentPath = "progress_draws" | "builder_finance_close";

export interface CostInputs {
  land: number; siteWork: number; foundation: number; structure: number;
  mep: number; finishes: number; landscaping: number; permitsFees: number; other: number;
}

/** Pricing assumptions — overhead and profit are now explicit so you can tune them independently. */
export interface PricingAssumptions {
  /** Job + company overhead % applied to (hard + contingency + soft). Typical early-stage 8–12%. */
  overheadPct: number;
  /** Desired profit % applied to the same base. Target 8–15% depending on risk/volume. */
  profitPct: number;
  contingencyPct: number;
  softCosts: number;
  taxPct: number;
}

export interface DrawMilestone {
  id: string; name: string; pct: number; trigger: string; protects: string;
}

export const DEFAULT_COSTS: CostInputs = {
  land: 0, siteWork: 42000, foundation: 68000, structure: 185000,
  mep: 98000, finishes: 142000, landscaping: 18000, permitsFees: 12000, other: 8000,
};

/** Defaults keep total OH+P at 18% (same economics as the previous combined markup). */
export const DEFAULT_ASSUMPTIONS: PricingAssumptions = {
  overheadPct: 10,
  profitPct: 8,
  contingencyPct: 5,
  softCosts: 14500,
  taxPct: 0,
};

// ── Job-specific overhead presets ───────────────────────────────────────────

export type JobPresetId =
  | "spec_ranch"
  | "semi_custom"
  | "full_custom"
  | "early_stage"
  | "volume_spec"
  | "high_risk";

export interface JobOverheadPreset {
  id: JobPresetId;
  label: string;
  shortLabel: string;
  description: string;
  /** When this preset is best used */
  bestFor: string;
  overheadPct: number;
  profitPct: number;
  contingencyPct: number;
  /** Optional soft-cost override; omit to keep current soft costs */
  softCosts?: number;
}

/**
 * Practical presets for Split Rock Construction (Teton Heights ranches,
 * Jefferson County / Eastern Idaho residential).
 *
 * Numbers are starting points — adjust after the first 2–3 completed jobs
 * once you have real job-cost data.
 */
export const JOB_OVERHEAD_PRESETS: JobOverheadPreset[] = [
  {
    id: "spec_ranch",
    label: "Spec ranch (Teton Heights)",
    shortLabel: "Spec ranch",
    description: "Repeatable 1,500–1,600 sf ranch + basement on 0.6-acre lots. Process dialed, preferred subs, standard finishes.",
    bestFor: "Your core product on Teton Heights lots once the first couple are complete.",
    overheadPct: 8,
    profitPct: 9,
    contingencyPct: 4,
    softCosts: 12000,
  },
  {
    id: "semi_custom",
    label: "Semi-custom",
    shortLabel: "Semi-custom",
    description: "Mostly standard plans with owner finish upgrades and a few plan tweaks. Moderate coordination load.",
    bestFor: "Buyers who want some personalization without full custom complexity.",
    overheadPct: 10,
    profitPct: 10,
    contingencyPct: 5,
    softCosts: 14500,
  },
  {
    id: "full_custom",
    label: "Full custom",
    shortLabel: "Full custom",
    description: "Owner-driven design, unique finishes, more RFIs, longer selection cycle, higher supervision time.",
    bestFor: "True custom homes or heavily modified plans.",
    overheadPct: 12,
    profitPct: 12,
    contingencyPct: 6,
    softCosts: 18000,
  },
  {
    id: "early_stage",
    label: "Early-stage company",
    shortLabel: "Early stage",
    description: "First 1–3 jobs while systems, preferred pricing, and processes are still being built. Fixed costs spread thinly.",
    bestFor: "Protect margin while you dial in the repeatable model.",
    overheadPct: 14,
    profitPct: 8,
    contingencyPct: 6,
    softCosts: 16000,
  },
  {
    id: "volume_spec",
    label: "Volume / preferred-sub",
    shortLabel: "Volume",
    description: "Multiple concurrent or sequential specs with locked material packages and preferred-sub pricing.",
    bestFor: "Once you have steady volume and negotiated rates.",
    overheadPct: 7,
    profitPct: 10,
    contingencyPct: 3.5,
    softCosts: 11000,
  },
  {
    id: "high_risk",
    label: "High-risk / complex site",
    shortLabel: "High risk",
    description: "Difficult access, winter start, steep grade, remote utilities, or other elevated risk factors.",
    bestFor: "Jobs that need extra contingency and higher profit to justify the risk.",
    overheadPct: 13,
    profitPct: 14,
    contingencyPct: 8,
    softCosts: 20000,
  },
];

export function getJobPreset(id: JobPresetId): JobOverheadPreset {
  const found = JOB_OVERHEAD_PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown job preset: ${id}`);
  return found;
}

/** Apply a preset onto existing assumptions (preserves taxPct; soft costs only override when the preset defines them). */
export function applyJobPreset(
  presetId: JobPresetId,
  current: PricingAssumptions = DEFAULT_ASSUMPTIONS,
): PricingAssumptions {
  const p = getJobPreset(presetId);
  return {
    overheadPct: p.overheadPct,
    profitPct: p.profitPct,
    contingencyPct: p.contingencyPct,
    softCosts: p.softCosts ?? current.softCosts,
    taxPct: current.taxPct,
  };
}

/** Detect which preset (if any) matches the current assumptions closely. */
export function matchJobPreset(a: PricingAssumptions): JobPresetId | null {
  for (const p of JOB_OVERHEAD_PRESETS) {
    if (
      Math.abs(a.overheadPct - p.overheadPct) < 0.05 &&
      Math.abs(a.profitPct - p.profitPct) < 0.05 &&
      Math.abs(a.contingencyPct - p.contingencyPct) < 0.05
    ) {
      return p.id;
    }
  }
  return null;
}

export const STANDARD_DRAWS: DrawMilestone[] = [
  { id: "d1", name: "Contract deposit", pct: 0.1, trigger: "Signed contract + materials deposit", protects: "Locks plans & long-lead items." },
  { id: "d2", name: "Foundation complete", pct: 0.15, trigger: "Foundation poured, inspected, backfilled", protects: "Pay only for verified work in place." },
  { id: "d3", name: "Dried-in / shell", pct: 0.2, trigger: "Framing, roof, windows, weather-tight", protects: "Largest value jump after structure is standing." },
  { id: "d4", name: "Rough-in complete", pct: 0.2, trigger: "MEP rough + insulation; rough inspections passed", protects: "Third-party inspection before more cash moves." },
  { id: "d5", name: "Finishes progress", pct: 0.2, trigger: "Drywall, cabinets, flooring substantially complete", protects: "Owner can walk quality before final draw." },
  { id: "d6", name: "Substantial completion", pct: 0.1, trigger: "CO / punch list started", protects: "Builder paid for livable home; punch still open." },
  { id: "d7", name: "Final / retainage", pct: 0.05, trigger: "Punch list signed off + lien waivers", protects: "Owner keeps leverage until defects closed." },
];

export function hardCostTotal(c: CostInputs): number {
  return c.land + c.siteWork + c.foundation + c.structure + c.mep + c.finishes + c.landscaping + c.permitsFees + c.other;
}

export interface PriceBreakdown {
  hardCosts: number;
  contingency: number;
  softCosts: number;
  /** Dollar amount of overhead */
  overhead: number;
  /** Dollar amount of profit */
  profit: number;
  /** Combined OH + Profit (for compatibility / summary) */
  markup: number;
  tax: number;
  contractPrice: number;
  minSafePrice: number;
  costPerSqft: number | null;
  /** Effective total OH&P percentage used */
  totalOhpPct: number;
}

export function calcPrice(costs: CostInputs, assumptions: PricingAssumptions, sqft?: number): PriceBreakdown {
  const hardCosts = hardCostTotal(costs);
  const contingency = hardCosts * (assumptions.contingencyPct / 100);
  const base = hardCosts + contingency + assumptions.softCosts;

  // Both percentages apply to the same base so the math stays predictable and matches prior 18% combined behavior.
  const overhead = base * (assumptions.overheadPct / 100);
  const profit = base * (assumptions.profitPct / 100);
  const markup = overhead + profit;
  const totalOhpPct = assumptions.overheadPct + assumptions.profitPct;

  const pretax = base + markup;
  const tax = pretax * (assumptions.taxPct / 100);
  const contractPrice = Math.round(pretax + tax);

  // Safe floor: hard + soft + ~12% minimum coverage (protects against under-pricing early jobs).
  const minSafePrice = Math.round(hardCosts + assumptions.softCosts + hardCosts * 0.12);

  return {
    hardCosts: Math.round(hardCosts),
    contingency: Math.round(contingency),
    softCosts: Math.round(assumptions.softCosts),
    overhead: Math.round(overhead),
    profit: Math.round(profit),
    markup: Math.round(markup),
    tax: Math.round(tax),
    contractPrice,
    minSafePrice,
    costPerSqft: sqft && sqft > 0 ? Math.round(contractPrice / sqft) : null,
    totalOhpPct,
  };
}

export function buildDrawSchedule(contractPrice: number, draws: DrawMilestone[] = STANDARD_DRAWS) {
  let cumulative = 0;
  return draws.map((m, i) => {
    const isLast = i === draws.length - 1;
    const amount = isLast ? contractPrice - cumulative : Math.round(contractPrice * m.pct);
    cumulative += amount;
    return { milestone: m, amount, cumulative };
  });
}

export interface FinanceScenario {
  months: number; interestRatePct: number; ltcPct: number;
  holdingMonthly: number; salePrice: number; sellingCostPct: number;
}
export interface FinanceResult {
  totalBuildCost: number; financedAmount: number; equityCash: number;
  interestCarry: number; holdingCost: number; totalOutlay: number;
  netAtClose: number; peakCashNeed: number; monthlyDrawHint: number;
}

export function calcBuilderFinance(totalBuildCost: number, scenario: FinanceScenario): FinanceResult {
  const financedAmount = Math.round(totalBuildCost * (scenario.ltcPct / 100));
  const equityCash = totalBuildCost - financedAmount;
  const interestCarry = Math.round(financedAmount * (scenario.interestRatePct / 100) * (scenario.months / 12) * 0.55);
  const holdingCost = Math.round(scenario.holdingMonthly * scenario.months);
  const sellingCosts = Math.round(scenario.salePrice * (scenario.sellingCostPct / 100));
  const totalOutlay = totalBuildCost + interestCarry + holdingCost;
  const netAtClose = Math.round(scenario.salePrice - sellingCosts - totalOutlay);
  const peakCashNeed = equityCash + Math.round(interestCarry * 0.5) + holdingCost;
  const monthlyDrawHint = Math.round(totalBuildCost / Math.max(scenario.months, 1));
  return { totalBuildCost, financedAmount, equityCash, interestCarry, holdingCost, totalOutlay, netAtClose, peakCashNeed, monthlyDrawHint };
}

export const CONTRACT_GUIDANCE: Record<ContractModel, { title: string; summary: string; protectsYou: string; protectsOwner: string }> = {
  fixed_price: {
    title: "Fixed-price (lump sum)",
    summary: "One contract price for defined scope. Best when plans & finishes are locked.",
    protectsYou: "Change orders for owner-driven scope; contingency line for unknowns.",
    protectsOwner: "Price certainty; draws only after milestones; retainage until punch list.",
  },
  cost_plus: {
    title: "Cost-plus (open book)",
    summary: "Owner pays verified costs + agreed GC fee %. Ideal for custom homes with evolving selections.",
    protectsYou: "Fee earned on all approved costs; weekly cost reports avoid surprises.",
    protectsOwner: "Full transparency on invoices; fee % capped; unused contingency returns to owner.",
  },
  spec_build_close: {
    title: "Spec / build-to-close",
    summary: "You finance construction; buyer closes at the end (or pre-sold with delayed close).",
    protectsYou: "Construction loan + interest reserve; sale price floor; early termination fee if buyer walks.",
    protectsOwner: "Pays only at closing for a finished home; inspection & warranty before funds release.",
  },
};

export const PAYMENT_PATH_GUIDANCE: Record<PaymentPath, { title: string; when: string; cashFlow: string; risks: string }> = {
  progress_draws: {
    title: "Progress draws (pay as you build)",
    when: "Custom homes for a known owner with construction financing or cash.",
    cashFlow: "Owner (or their lender) funds each milestone. Your cash need stays low if draws are timely.",
    risks: "Late draws starve the job — use payment terms, stop-work rights, and partial lien waivers each draw.",
  },
  builder_finance_close: {
    title: "Builder finance → close at end",
    when: "Spec homes or pre-sales where buyer cannot fund during build.",
    cashFlow: "You carry land + construction (cash or construction loan). Full recovery at closing.",
    risks: "Interest, market, and buyer walk-away risk. Size interest reserve and require non-refundable deposit on pre-sales.",
  },
};
