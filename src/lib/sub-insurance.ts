import type { CoiStatus, InsurancePolicy, Vendor } from "@/data/types";

const MS_DAY = 86_400_000;

export function daysUntil(iso: string, from = new Date()): number {
  const end = new Date(iso + (iso.length === 10 ? "T23:59:59" : ""));
  return Math.ceil((end.getTime() - from.getTime()) / MS_DAY);
}

export function deriveCoiStatus(policy: Pick<InsurancePolicy, "expirationDate">, warnDays = 30): CoiStatus {
  const d = daysUntil(policy.expirationDate);
  if (d < 0) return "expired";
  if (d <= warnDays) return "expiring_soon";
  return "valid";
}

export function refreshPolicyStatuses(policies: InsurancePolicy[]): InsurancePolicy[] {
  return policies.map((p) => ({ ...p, status: deriveCoiStatus(p) }));
}

export function vendorComplianceScore(vendorId: string, policies: InsurancePolicy[]): {
  score: number;
  missing: string[];
  expiring: InsurancePolicy[];
  expired: InsurancePolicy[];
} {
  const required: Array<InsurancePolicy["type"]> = ["general_liability", "workers_comp"];
  const mine = policies.filter((p) => p.vendorId === vendorId);
  const byType = new Map(mine.map((p) => [p.type, p]));
  const missing: string[] = [];
  for (const t of required) {
    const p = byType.get(t);
    if (!p) missing.push(t);
    else if (p.status === "expired" || p.status === "missing") missing.push(t);
  }
  const expiring = mine.filter((p) => p.status === "expiring_soon");
  const expired = mine.filter((p) => p.status === "expired");
  const hasAI = mine.some((p) => p.additionalInsured && p.type === "general_liability");
  let score = 100;
  score -= missing.length * 30;
  score -= expiring.length * 10;
  score -= expired.length * 25;
  if (!hasAI) score -= 15;
  return { score: Math.max(0, Math.min(100, score)), missing, expiring, expired };
}

export function policiesNeedingAttention(policies: InsurancePolicy[]): InsurancePolicy[] {
  return refreshPolicyStatuses(policies).filter(
    (p) => p.status === "expired" || p.status === "expiring_soon" || p.status === "missing",
  );
}

export const SAMPLE_VENDORS: Vendor[] = [
  {
    id: "v-framing",
    company: "Eastern Idaho Framing LLC",
    contact: "Jake Peterson",
    email: "jake@eiframing.example",
    phone: "(208) 555-0142",
    trade: "Framing",
    preferred: true,
    notes: "Primary framing crew — Twin Falls / Jefferson County",
  },
  {
    id: "v-elec",
    company: "Snake River Electric",
    contact: "Maria Lopez",
    email: "maria@srelectric.example",
    phone: "(208) 555-0198",
    trade: "Electrical",
    preferred: true,
  },
  {
    id: "v-plumb",
    company: "Rigby Plumbing & Heat",
    contact: "Tom Wright",
    email: "tom@rigbyplumb.example",
    phone: "(208) 555-0110",
    trade: "Plumbing / HVAC",
    preferred: false,
  },
];

export const samplePolicies: InsurancePolicy[] = [
  {
    id: "pol-1",
    vendorId: "v-framing",
    type: "general_liability",
    carrier: "Mountain West Mutual",
    policyNumber: "MW-GL-88421",
    expirationDate: "2026-11-15",
    status: "valid",
    additionalInsured: true,
    additionalInsuredNamed: "Split Rock Construction LLC",
  },
  {
    id: "pol-2",
    vendorId: "v-framing",
    type: "workers_comp",
    carrier: "Idaho State Fund",
    policyNumber: "ISF-WC-99201",
    expirationDate: "2026-09-01",
    status: "expiring_soon",
    additionalInsured: false,
  },
  {
    id: "pol-3",
    vendorId: "v-elec",
    type: "general_liability",
    carrier: "Travelers",
    policyNumber: "TRV-GL-44102",
    expirationDate: "2027-03-20",
    status: "valid",
    additionalInsured: true,
    additionalInsuredNamed: "Split Rock Construction LLC",
  },
];
