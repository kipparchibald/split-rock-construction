import type { CloseoutItem, CloseoutPackage, RealtyChecklistItem, RealtyDeal } from "@/data/types";

export function itemProgress(items: { status: string }[]) {
  const actionable = items.filter((i) => i.status !== "waived" && i.status !== "n_a");
  const done = actionable.filter((i) => i.status === "complete").length;
  const total = actionable.length || 1;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function closeoutReady(pkg: CloseoutPackage) {
  const { pct } = itemProgress(pkg.items);
  const substantial = pkg.items.find((i) => i.key === "substantial_completion");
  const co = pkg.items.find((i) => i.key === "certificate_of_occupancy");
  const liens = pkg.items.find((i) => i.key === "lien_waivers");
  const blocked = pkg.items.some((i) => i.status === "blocked");
  return {
    pct,
    substantialDone: substantial?.status === "complete",
    coDone: co?.status === "complete" || co?.status === "waived",
    liensDone: liens?.status === "complete",
    punchClear: pkg.punchOpen === 0,
    blocked,
    constructionGate:
      substantial?.status === "complete" &&
      (co?.status === "complete" || co?.status === "waived") &&
      liens?.status === "complete" &&
      pkg.punchOpen === 0 &&
      !blocked,
  };
}

export function realtyReady(deal: RealtyDeal) {
  const { pct } = itemProgress(deal.items);
  const dualOk =
    deal.dualCapacity === "not_applicable" ||
    deal.dualCapacity === "disclosed" ||
    deal.dualCapacity === "declined_realty";
  const trustOk =
    !deal.earnestAmount ||
    deal.earnestHeldBy.toLowerCase().includes("trust") ||
    deal.earnestHeldBy.includes("Outside");
  const pAndS = deal.items.find((i) => i.key === "purchase_sale_agreement");
  return {
    pct,
    dualOk,
    trustOk,
    underContract: ["under_contract", "pending_close", "closed"].includes(deal.status),
    realtyGate:
      dualOk &&
      (deal.status === "n_a" ||
        deal.status === "closed" ||
        (pAndS?.status === "complete" && dualOk)),
  };
}

/** Both lanes must clear before a dual-role sale is "safe to close" in ops terms */
export function dualCloseReady(pkg: CloseoutPackage | undefined, deal: RealtyDeal | undefined) {
  if (!pkg && !deal) return { ready: false, reason: "No closeout or realty package" };
  if (deal && deal.status === "n_a") {
    const g = pkg ? closeoutReady(pkg) : { constructionGate: true };
    return {
      ready: !!g.constructionGate,
      reason: g.constructionGate ? "Construction-only closeout clear" : "Construction closeout incomplete",
    };
  }
  if (!pkg || !deal) {
    return { ready: false, reason: "Need both construction closeout and realty deal for dual-role sale" };
  }
  const c = closeoutReady(pkg);
  const r = realtyReady(deal);
  if (!c.constructionGate) return { ready: false, reason: "Construction gate blocked (substantial / CO / liens / punch)" };
  if (!r.dualOk) return { ready: false, reason: "Dual-capacity disclosure not complete" };
  if (!r.realtyGate) return { ready: false, reason: "Realty checklist incomplete" };
  if (deal.status !== "pending_close" && deal.status !== "closed") {
    return { ready: false, reason: "Deal not in pending close / closed status" };
  }
  return { ready: true, reason: "Both construction and realty gates clear" };
}

export function nextCloseoutAction(items: CloseoutItem[]) {
  return (
    items.find((i) => i.status === "blocked") ??
    items.find((i) => i.status === "in_progress") ??
    items.find((i) => i.status === "not_started")
  );
}

export function nextRealtyAction(items: RealtyChecklistItem[]) {
  return (
    items.find((i) => i.status === "blocked") ??
    items.find((i) => i.status === "in_progress") ??
    items.find((i) => i.status === "not_started")
  );
}

/** Portfolio-level next action for Closing command banner */
export function nextDualRoleAction(input: {
  packages: CloseoutPackage[];
  deals: RealtyDeal[];
}): { severity: "high" | "med" | "low" | "clear"; title: string; detail: string; projectId?: string; lane?: "closeout" | "realty" } {
  const pendingDual = input.deals.find((d) => d.dualCapacity === "pending_disclosure");
  if (pendingDual) {
    return {
      severity: "high",
      title: "Dual-capacity disclosure required",
      detail: "Record owner acknowledgment before advancing the realty lane.",
      projectId: pendingDual.projectId,
      lane: "realty",
    };
  }
  for (const pkg of input.packages) {
    if (pkg.punchOpen > 0) {
      return {
        severity: "high",
        title: `${pkg.punchOpen} punch item${pkg.punchOpen === 1 ? "" : "s"} open`,
        detail: "Clear punch before final pay and CO path.",
        projectId: pkg.projectId,
        lane: "closeout",
      };
    }
    const next = nextCloseoutAction(pkg.items);
    if (next) {
      return {
        severity: next.status === "blocked" ? "high" : "med",
        title: `Closeout · ${next.label}`,
        detail: next.status === "blocked" ? "Blocked item needs resolution" : "Advance the construction gate",
        projectId: pkg.projectId,
        lane: "closeout",
      };
    }
  }
  for (const deal of input.deals) {
    if (deal.status === "n_a" || deal.status === "closed" || deal.status === "withdrawn") continue;
    const next = nextRealtyAction(deal.items);
    if (next) {
      return {
        severity: "med",
        title: `Realty · ${next.label}`,
        detail: `${deal.status.replace(/_/g, " ")} — complete in licensed system, mark here`,
        projectId: deal.projectId,
        lane: "realty",
      };
    }
  }
  return {
    severity: "clear",
    title: "Closing lanes are clear",
    detail: "No open dual-capacity, punch, or checklist blockers in the portfolio.",
  };
}
