import type { BudgetBand, LeadType, Prospect, ProspectStage, TimelineBand } from "@/data/types";

export function scoreProspect(input: {
  leadType: LeadType;
  budgetBand: BudgetBand;
  timeline: TimelineBand;
  lotId?: string;
  packageId?: string;
  dualRoleAcknowledged?: boolean;
  source?: string;
}): number {
  let s = 40;
  if (input.timeline === "0_3mo") s += 25;
  else if (input.timeline === "3_6mo") s += 15;
  else if (input.timeline === "6_12mo") s += 8;
  else if (input.timeline === "browsing") s -= 5;

  if (input.budgetBand === "500_650k" || input.budgetBand === "650_800k") s += 15;
  else if (input.budgetBand === "800k_plus") s += 12;
  else if (input.budgetBand === "400_500k") s += 8;
  else if (input.budgetBand === "unknown") s -= 5;

  if (input.leadType === "lot_and_build") s += 12;
  if (input.leadType === "commercial") s += 5;
  if (input.lotId) s += 10;
  if (input.packageId) s += 8;
  if (input.dualRoleAcknowledged) s += 5;
  if (input.source === "teton_estimator" || input.source === "model_home") s += 6;

  return Math.max(0, Math.min(100, s));
}

export const STAGE_ORDER: ProspectStage[] = [
  "new", "contacted", "tour_scheduled", "tour_done", "qualified",
  "lot_hold", "proposal_sent", "bid", "won", "lost",
];

export function stageLabel(s: ProspectStage) {
  return s.replace(/_/g, " ");
}

export function isHot(p: Prospect) {
  return p.score >= 75 && !["won", "lost"].includes(p.stage);
}

export function needsFollowUp(p: Prospect, now = Date.now()) {
  if (["won", "lost"].includes(p.stage)) return false;
  if (p.stage === "new") return true;
  if (!p.lastContactAt) return true;
  const age = now - new Date(p.lastContactAt).getTime();
  return age > 1000 * 60 * 60 * 48; // 48h
}

export function budgetLabel(b: BudgetBand) {
  const map: Record<BudgetBand, string> = {
    under_400k: "Under $400k",
    "400_500k": "$400–500k",
    "500_650k": "$500–650k",
    "650_800k": "$650–800k",
    "800k_plus": "$800k+",
    unknown: "Unknown",
  };
  return map[b];
}

export function timelineLabel(t: TimelineBand) {
  const map: Record<TimelineBand, string> = {
    "0_3mo": "0–3 months",
    "3_6mo": "3–6 months",
    "6_12mo": "6–12 months",
    "12mo_plus": "12+ months",
    browsing: "Just browsing",
  };
  return map[t];
}
