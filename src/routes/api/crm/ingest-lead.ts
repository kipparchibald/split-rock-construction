import { createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";
import {
  extractIngestSecret,
  ingestLeadSchema,
  secretsMatch,
} from "@/lib/crm/ingest";
import { IngestError, ingestLead } from "@/lib/crm/ingest.server";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function verifyIngestAuth(request: Request): Response | null {
  const expected = process.env.CRM_INGEST_SECRET?.trim();
  if (!expected) {
    return jsonResponse(
      { ok: false, error: "Lead ingest is not configured (CRM_INGEST_SECRET missing)" },
      503,
    );
  }

  const provided = extractIngestSecret(request);
  if (!provided || !secretsMatch(provided, expected)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  return null;
}

/**
 * External lead ingest for Rigby Lots and other partner sites.
 * Auth: Authorization: Bearer <CRM_INGEST_SECRET> or X-CRM-Ingest-Secret header.
 * Requires DATABASE_URL for persistence (503 otherwise).
 */
export const Route = createFileRoute("/api/crm/ingest-lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authError = verifyIngestAuth(request);
        if (authError) return authError;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
        }

        let input;
        try {
          input = ingestLeadSchema.parse(body);
        } catch (err) {
          if (err instanceof ZodError) {
            return jsonResponse(
              { ok: false, error: "Validation failed", details: err.flatten().fieldErrors },
              400,
            );
          }
          throw err;
        }

        try {
          const result = await ingestLead(input);
          return jsonResponse(
            {
              ok: true,
              prospectId: result.prospectId,
              created: result.created,
              duplicate: result.duplicate,
            },
            result.created ? 201 : 200,
          );
        } catch (err) {
          if (err instanceof IngestError) {
            return jsonResponse({ ok: false, error: err.message, code: err.code }, err.status);
          }
          const msg = err instanceof Error ? err.message : "Ingest failed";
          return jsonResponse({ ok: false, error: msg }, 500);
        }
      },
    },
  },
});
