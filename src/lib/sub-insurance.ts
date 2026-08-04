import type { InsurancePolicy, InsurancePolicyStatus } from "@/data/types";

const MS_DAY = 86_400_000;

export function policyStatusFromExpiration(expirationDate: string, withinDays = 30): InsurancePolicyStatus {
  const exp = new Date(`${expirationDate}T12:00:00`);
  if (Number.isNaN(exp.getTime())) return "missing";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round((exp.getTime() - today.getTime()) / MS_DAY);
  if (days < 0) return "expired";
  if (days <= withinDays) return "expiring_soon";
  return "active";
}

/** Policies that need office action (expired or inside the window). */
export function policiesNeedingAttention(policies: InsurancePolicy[]): InsurancePolicy[] {
  return policies
    .map((p) => {
      const derived = policyStatusFromExpiration(p.expirationDate);
      return { ...p, status: derived === "active" ? p.status : derived };
    })
    .filter((p) => p.status === "expired" || p.status === "expiring_soon" || p.status === "missing");
}
