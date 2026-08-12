import { getSql } from "@/lib/db";
import { isCrmServerPersistenceEnabled } from "./capabilities.server";
import {
  buildProspectFromIngest,
  ingestIdempotencyKey,
  normalizeIngestSource,
  type IngestLeadInput,
} from "./ingest";
import { prospectFromRow } from "./mappers";
import { upsertProspectWithIngest } from "./repository.server";

export class IngestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "IngestError";
  }
}

export type IngestLeadResult = {
  prospectId: string;
  created: boolean;
  duplicate: boolean;
};

async function resolveIngestUserId(): Promise<string> {
  const configured = process.env.CRM_INGEST_USER_ID?.trim();
  if (configured) return configured;

  const sql = await getSql();
  const rows = await sql`
    select "id" from "user" order by "createdAt" asc limit 1
  `;
  const id = rows[0]?.id as string | undefined;
  if (!id) {
    throw new IngestError(
      "No operator user found for ingest; set CRM_INGEST_USER_ID",
      503,
      "ingest_owner_missing",
    );
  }
  return id;
}

async function resolveAssignedToName(userId: string): Promise<string> {
  const sql = await getSql();
  const rows = await sql`
    select "name" from "user" where "id" = ${userId} limit 1
  `;
  const name = rows[0]?.name as string | undefined;
  return name?.trim() || "Unassigned";
}

async function findProspectByIngestKey(
  userId: string,
  ingestSource: string,
  ingestExternalId: string,
): Promise<{ id: string } | null> {
  const sql = await getSql();
  const rows = await sql`
    select id from crm_prospects
    where user_id = ${userId}
      and ingest_source = ${ingestSource}
      and ingest_external_id = ${ingestExternalId}
    limit 1
  `;
  const row = rows[0] as { id: string } | undefined;
  return row ?? null;
}

export async function ingestLead(input: IngestLeadInput): Promise<IngestLeadResult> {
  if (!isCrmServerPersistenceEnabled()) {
    throw new IngestError(
      "Lead ingest requires DATABASE_URL; CRM server persistence is not configured",
      503,
      "database_required",
    );
  }

  const userId = await resolveIngestUserId();
  const idempotency = ingestIdempotencyKey(input);

  if (idempotency) {
    const existing = await findProspectByIngestKey(
      userId,
      idempotency.ingestSource,
      idempotency.ingestExternalId,
    );
    if (existing) {
      return { prospectId: existing.id, created: false, duplicate: true };
    }
  }

  const assignedTo = await resolveAssignedToName(userId);
  const prospect = buildProspectFromIngest(input, { assignedTo });

  try {
    await upsertProspectWithIngest(userId, prospect, {
      ingestSource: idempotency?.ingestSource ?? normalizeIngestSource(input.source),
      ingestExternalId: idempotency?.ingestExternalId ?? null,
    });
  } catch (err: unknown) {
    // Race: another request inserted the same (source, externalId) first
    if (idempotency && isUniqueViolation(err)) {
      const existing = await findProspectByIngestKey(
        userId,
        idempotency.ingestSource,
        idempotency.ingestExternalId,
      );
      if (existing) {
        return { prospectId: existing.id, created: false, duplicate: true };
      }
    }
    throw err;
  }

  return { prospectId: prospect.id, created: true, duplicate: false };
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  return code === "23505";
}

/** Exported for tests that need row shape verification. */
export { prospectFromRow };
