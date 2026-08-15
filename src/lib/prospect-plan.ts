import type { Prospect } from "@/data/types";

/** Map Teton build packages to Book of Plans entries when converting prospects. */
const PACKAGE_TO_PLAN: Record<string, string> = {
  bp1: "plan-jefferson-1520",
  bp2: "plan-teton-1580",
  bp3: "plan-splitrock-1620",
};

const DEFAULT_PLAN_ID = "plan-teton-1580";

/** Pick the best Book of Plans entry for a prospect conversion. */
export function resolvePlanIdForProspect(prospect: Pick<Prospect, "packageId" | "leadType">): string {
  if (prospect.packageId && PACKAGE_TO_PLAN[prospect.packageId]) {
    return PACKAGE_TO_PLAN[prospect.packageId]!;
  }
  if (prospect.leadType === "commercial") {
    return DEFAULT_PLAN_ID;
  }
  return DEFAULT_PLAN_ID;
}
