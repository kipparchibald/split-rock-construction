import { z } from "zod";
import type { LeadSource, LeadType, Prospect } from "@/data/types";
import { scoreProspect } from "@/lib/prospects";

/** External ingest sources (Rigby Lots, etc.) — mapped to internal LeadSource. */
export const ingestSourceSchema = z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i);

export const ingestLeadSchema = z.object({
  source: ingestSourceSchema,
  externalId: z.string().min(1).max(256).optional(),
  name: z.string().min(1).max(200),
  email: z.union([z.string().email().max(320), z.literal("")]),
  phone: z.string().max(40).optional().default(""),
  interest: z.string().max(500).optional().default(""),
  notes: z.string().max(4000).optional().default(""),
  lotId: z.string().max(64).optional(),
  leadType: z
    .enum(["lot_only", "lot_and_build", "custom_own_land", "commercial", "referral"])
    .optional()
    .default("lot_only"),
  dualRole: z.boolean().optional(),
});

export type IngestLeadInput = z.infer<typeof ingestLeadSchema>;

export type IngestIdempotencyKey = {
  ingestSource: string;
  ingestExternalId: string;
};

/** Normalize ingest source for storage and lookup (lowercase). */
export function normalizeIngestSource(source: string): string {
  return source.trim().toLowerCase();
}

/** Build idempotency key when externalId is present; otherwise null. */
export function ingestIdempotencyKey(
  input: Pick<IngestLeadInput, "source" | "externalId">,
): IngestIdempotencyKey | null {
  const externalId = input.externalId?.trim();
  if (!externalId) return null;
  return {
    ingestSource: normalizeIngestSource(input.source),
    ingestExternalId: externalId,
  };
}

/** Map external ingest source to internal CRM LeadSource. */
export function mapIngestSourceToLeadSource(ingestSource: string): LeadSource {
  const key = normalizeIngestSource(ingestSource);
  switch (key) {
    case "rigbylots":
    case "rigby_lots":
      return "website";
    case "teton_estimator":
      return "teton_estimator";
    case "referral":
    case "referral_agent":
      return "referral_agent";
    default:
      return "other";
  }
}

/** Whether dual-role disclosure applies for this lead. */
export function resolveDualRoleFlag(input: IngestLeadInput): boolean {
  if (input.dualRole === true) return true;
  const lt: LeadType = input.leadType ?? "lot_only";
  return lt === "lot_only" || lt === "lot_and_build";
}

export function newProspectId(): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `pr${suffix}`;
}

/** Build a Prospect domain object from validated ingest payload. */
export function buildProspectFromIngest(
  input: IngestLeadInput,
  options: { assignedTo: string; id?: string; createdAt?: string },
): Prospect {
  const leadType = input.leadType ?? "lot_only";
  const leadSource = mapIngestSourceToLeadSource(input.source);
  const dualRoleFlag = resolveDualRoleFlag(input);
  const createdAt = options.createdAt ?? new Date().toISOString();

  const score = scoreProspect({
    leadType,
    budgetBand: "unknown",
    timeline: "browsing",
    lotId: input.lotId,
    source: leadSource,
    dualRoleAcknowledged: false,
  });

  const sourceLabel = normalizeIngestSource(input.source);
  const notes =
    input.notes?.trim() ||
    `Ingested from ${sourceLabel}${input.externalId ? ` (external id: ${input.externalId})` : ""}.`;

  return {
    id: options.id ?? newProspectId(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: (input.phone ?? "").trim(),
    leadType,
    stage: "new",
    source: leadSource,
    budgetBand: "unknown",
    timeline: "browsing",
    interest: (input.interest ?? "").trim(),
    notes,
    dualRoleFlag,
    dualRoleAcknowledged: false,
    score,
    lotId: input.lotId,
    assignedTo: options.assignedTo,
    createdAt,
  };
}

/** Extract shared-secret from Authorization Bearer or X-CRM-Ingest-Secret. */
export function extractIngestSecret(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (match?.[1]) return match[1].trim();
  }
  const header = request.headers.get("X-CRM-Ingest-Secret");
  return header?.trim() ?? null;
}

/** Constant-time-ish comparison to reduce timing leaks (secrets are high-entropy). */
export function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
