import type {
  CoiStatus,
  CoiVerification,
  CoiVerificationCheck,
  InsurancePolicy,
  InsurancePolicyType,
  Vendor,
} from "@/data/types";

const MS_DAY = 86_400_000;

/** Split Rock default requirements for subcontractor COIs */
export const COI_REQUIREMENTS = {
  additionalInsuredName: "Split Rock Construction LLC",
  /** Accept common short forms when matching AI endorsement text */
  additionalInsuredAliases: [
    "split rock construction llc",
    "split rock construction",
    "split rock",
  ],
  warnDays: 30,
  minLimits: {
    general_liability: 1_000_000,
    auto: 1_000_000,
    workers_comp: 500_000,
    umbrella: 1_000_000,
    builders_risk: 0,
    professional: 1_000_000,
  } as Record<InsurancePolicyType, number>,
  requiredTypes: ["general_liability", "workers_comp"] as InsurancePolicyType[],
  /** GL must carry additional insured */
  requireAdditionalInsuredOn: ["general_liability"] as InsurancePolicyType[],
};

export function daysUntil(iso: string, from = new Date()): number {
  const end = new Date(iso + (iso.length === 10 ? "T23:59:59" : ""));
  return Math.ceil((end.getTime() - from.getTime()) / MS_DAY);
}

export function deriveCoiStatus(
  policy: Pick<InsurancePolicy, "expirationDate">,
  warnDays = COI_REQUIREMENTS.warnDays,
): CoiStatus {
  const d = daysUntil(policy.expirationDate);
  if (d < 0) return "expired";
  if (d <= warnDays) return "expiring_soon";
  return "valid";
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesAdditionalInsured(named?: string): boolean {
  if (!named?.trim()) return false;
  const n = normalizeName(named);
  return COI_REQUIREMENTS.additionalInsuredAliases.some(
    (alias) => n.includes(alias) || alias.includes(n),
  );
}

/**
 * Automated COI verification against Split Rock requirements.
 * Runs without external carrier APIs — rules engine on recorded fields.
 * Ready to plug OCR / ACORD extractors into the same check pipeline.
 */
export function verifyCoi(policy: InsurancePolicy): CoiVerification {
  const checks: CoiVerificationCheck[] = [];
  const minLimit = COI_REQUIREMENTS.minLimits[policy.type] ?? 0;
  const days = daysUntil(policy.expirationDate);
  const dateStatus = deriveCoiStatus(policy);

  // 1. Expiration
  if (days < 0) {
    checks.push({
      id: "expiration",
      label: "Policy not expired",
      result: "fail",
      detail: `Expired ${Math.abs(days)} day(s) ago (${policy.expirationDate}).`,
    });
  } else if (days <= COI_REQUIREMENTS.warnDays) {
    checks.push({
      id: "expiration",
      label: "Policy not expired",
      result: "warn",
      detail: `Expires in ${days} day(s) on ${policy.expirationDate} — renew before mobilizing long-duration work.`,
    });
  } else {
    checks.push({
      id: "expiration",
      label: "Policy not expired",
      result: "pass",
      detail: `Active through ${policy.expirationDate} (${days} days remaining).`,
    });
  }

  // 2. Carrier + policy number present
  if (!policy.carrier?.trim() || !policy.policyNumber?.trim()) {
    checks.push({
      id: "identity",
      label: "Carrier and policy number",
      result: "fail",
      detail: "Carrier name and policy number are required for audit trail.",
    });
  } else {
    checks.push({
      id: "identity",
      label: "Carrier and policy number",
      result: "pass",
      detail: `${policy.carrier} · ${policy.policyNumber}`,
    });
  }

  // 3. Coverage limit (when provided)
  if (minLimit > 0) {
    if (policy.coverageLimit == null) {
      checks.push({
        id: "limit",
        label: `Minimum limit ≥ $${minLimit.toLocaleString()}`,
        result: "warn",
        detail: "Limit not recorded on COI entry — confirm on certificate before approval.",
      });
    } else if (policy.coverageLimit < minLimit) {
      checks.push({
        id: "limit",
        label: `Minimum limit ≥ $${minLimit.toLocaleString()}`,
        result: "fail",
        detail: `Recorded limit $${policy.coverageLimit.toLocaleString()} is below required $${minLimit.toLocaleString()}.`,
      });
    } else {
      checks.push({
        id: "limit",
        label: `Minimum limit ≥ $${minLimit.toLocaleString()}`,
        result: "pass",
        detail: `Limit $${policy.coverageLimit.toLocaleString()} meets minimum.`,
      });
    }
  }

  // 4. Additional insured (GL and other required types)
  if (COI_REQUIREMENTS.requireAdditionalInsuredOn.includes(policy.type)) {
    if (!policy.additionalInsured) {
      checks.push({
        id: "additional_insured",
        label: `Additional insured: ${COI_REQUIREMENTS.additionalInsuredName}`,
        result: "fail",
        detail: "Certificate does not show Split Rock as additional insured — request endorsement before field work.",
      });
    } else if (!matchesAdditionalInsured(policy.additionalInsuredNamed)) {
      checks.push({
        id: "additional_insured",
        label: `Additional insured: ${COI_REQUIREMENTS.additionalInsuredName}`,
        result: "fail",
        detail: `Named AI "${policy.additionalInsuredNamed ?? "(blank)"}" does not match ${COI_REQUIREMENTS.additionalInsuredName}.`,
      });
    } else {
      checks.push({
        id: "additional_insured",
        label: `Additional insured: ${COI_REQUIREMENTS.additionalInsuredName}`,
        result: "pass",
        detail: `Endorsement names ${policy.additionalInsuredNamed}.`,
      });
    }
  }

  // 5. Certificate file on record
  if (!policy.certificateUrl) {
    checks.push({
      id: "document",
      label: "Certificate document on file",
      result: "warn",
      detail: "No PDF/image attached — keep the ACORD certificate for audit.",
    });
  } else {
    checks.push({
      id: "document",
      label: "Certificate document on file",
      result: "pass",
      detail: "Document reference recorded.",
    });
  }

  const failCount = checks.filter((c) => c.result === "fail").length;
  const warnCount = checks.filter((c) => c.result === "warn").length;
  let overall: CoiVerification["overall"] = "passed";
  if (failCount > 0) overall = "failed";
  else if (warnCount > 0) overall = "needs_review";

  let score = 100;
  score -= failCount * 35;
  score -= warnCount * 12;
  if (dateStatus === "expired") score = Math.min(score, 20);

  return {
    verifiedAt: new Date().toISOString(),
    overall,
    checks,
    score: Math.max(0, Math.min(100, score)),
  };
}

/** Apply date-based status, then attach automated verification */
export function refreshPolicyStatuses(policies: InsurancePolicy[]): InsurancePolicy[] {
  return policies.map((p) => {
    const status = deriveCoiStatus(p);
    const verification = verifyCoi({ ...p, status });
    // If verification failed hard, surface pending_review when not expired
    let nextStatus = status;
    if (verification.overall === "failed" && status !== "expired") {
      nextStatus = "pending_review";
    }
    return { ...p, status: nextStatus, verification };
  });
}

export function vendorComplianceScore(
  vendorId: string,
  policies: InsurancePolicy[],
): {
  score: number;
  missing: string[];
  expiring: InsurancePolicy[];
  expired: InsurancePolicy[];
  failedVerification: InsurancePolicy[];
} {
  const required = COI_REQUIREMENTS.requiredTypes;
  const mine = refreshPolicyStatuses(policies.filter((p) => p.vendorId === vendorId));
  const byType = new Map(mine.map((p) => [p.type, p]));
  const missing: string[] = [];
  for (const t of required) {
    const p = byType.get(t);
    if (!p) missing.push(t);
    else if (p.status === "expired" || p.status === "missing") missing.push(t);
  }
  const expiring = mine.filter((p) => p.status === "expiring_soon");
  const expired = mine.filter((p) => p.status === "expired");
  const failedVerification = mine.filter((p) => p.verification?.overall === "failed");
  const hasAI = mine.some(
    (p) =>
      p.type === "general_liability" &&
      p.additionalInsured &&
      matchesAdditionalInsured(p.additionalInsuredNamed),
  );
  let score = 100;
  score -= missing.length * 30;
  score -= expiring.length * 10;
  score -= expired.length * 25;
  score -= failedVerification.length * 15;
  if (!hasAI) score -= 15;
  return {
    score: Math.max(0, Math.min(100, score)),
    missing,
    expiring,
    expired,
    failedVerification,
  };
}

export function policiesNeedingAttention(policies: InsurancePolicy[]): InsurancePolicy[] {
  return refreshPolicyStatuses(policies).filter(
    (p) =>
      p.status === "expired" ||
      p.status === "expiring_soon" ||
      p.status === "missing" ||
      p.status === "pending_review" ||
      p.verification?.overall === "failed",
  );
}

/**
 * Simulate structured extract from an uploaded COI filename / metadata.
 * Placeholder for future OCR / ACORD 25 parser — returns sensible defaults
 * operators can confirm before save.
 */
export function simulateExtractFromUpload(fileName: string): Partial<InsurancePolicy> {
  const lower = fileName.toLowerCase();
  let type: InsurancePolicyType = "general_liability";
  if (lower.includes("wc") || lower.includes("workers")) type = "workers_comp";
  else if (lower.includes("auto")) type = "auto";
  else if (lower.includes("umbrella") || lower.includes("excess")) type = "umbrella";

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const exp = nextYear.toISOString().slice(0, 10);

  return {
    type,
    carrier: "Extracted Carrier (confirm)",
    policyNumber: `AUTO-${Date.now().toString().slice(-6)}`,
    expirationDate: exp,
    coverageLimit: COI_REQUIREMENTS.minLimits[type] || 1_000_000,
    additionalInsured: type === "general_liability",
    additionalInsuredNamed:
      type === "general_liability" ? COI_REQUIREMENTS.additionalInsuredName : undefined,
    certificateUrl: `local://${fileName}`,
    notes: `Auto-extracted from ${fileName} — confirm against ACORD certificate.`,
  };
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
    coverageLimit: 1_000_000,
    certificateUrl: "local://eif-gl-2026.pdf",
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
    coverageLimit: 500_000,
    certificateUrl: "local://eif-wc-2026.pdf",
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
    coverageLimit: 2_000_000,
    certificateUrl: "local://sre-gl-2027.pdf",
  },
  {
    id: "pol-4",
    vendorId: "v-plumb",
    type: "general_liability",
    carrier: "Unknown Mutual",
    policyNumber: "UM-112",
    expirationDate: "2026-12-01",
    status: "pending_review",
    additionalInsured: false,
    coverageLimit: 500_000,
  },
];
