export type ContractModel = "fixed_price" | "cost_plus" | "spec_build_close";
export type PaymentPath = "progress_draws" | "builder_finance_close";

export interface CostInputs {
  land: number; siteWork: number; foundation: number; structure: number;
  mep: number; finishes: number; landscaping: number; permitsFees: number; other: number;
}
export interface PricingAssumptions {
  markupPct: number; contingencyPct: number; softCosts: number; taxPct: number;
}
export interface DrawMilestone {
  id: string; name: string; pct: number; trigger: string; protects: string;
}

export const DEFAULT_COSTS: CostInputs = {
  land: 0, siteWork: 42000, foundation: 68000, structure: 185000,
  mep: 98000, finishes: 142000, landscaping: 18000, permitsFees: 12000, other: 8000,
};
export const DEFAULT_ASSUMPTIONS: PricingAssumptions = {
  markupPct: 18, contingencyPct: 5, softCosts: 14500, taxPct: 0,
};

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
  hardCosts: number; contingency: number; markup: number; softCosts: number;
  tax: number; contractPrice: number; minSafePrice: number; costPerSqft: number | null;
}

export function calcPrice(costs: CostInputs, assumptions: PricingAssumptions, sqft?: number): PriceBreakdown {
  const hardCosts = hardCostTotal(costs);
  const contingency = hardCosts * (assumptions.contingencyPct / 100);
  const base = hardCosts + contingency + assumptions.softCosts;
  const markup = base * (assumptions.markupPct / 100);
  const pretax = base + markup;
  const tax = pretax * (assumptions.taxPct / 100);
  const contractPrice = Math.round(pretax + tax);
  const minSafePrice = Math.round(hardCosts + assumptions.softCosts + hardCosts * 0.12);
  return {
    hardCosts: Math.round(hardCosts), contingency: Math.round(contingency),
    markup: Math.round(markup), softCosts: Math.round(assumptions.softCosts),
    tax: Math.round(tax), contractPrice, minSafePrice,
    costPerSqft: sqft && sqft > 0 ? Math.round(contractPrice / sqft) : null,
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
