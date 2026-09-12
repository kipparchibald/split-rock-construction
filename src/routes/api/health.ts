import { createFileRoute } from "@tanstack/react-router";
import {
  getServerReadiness,
  isAuthEnvReady,
  isIngestEnvReady,
  isPortalAuthEnvReady,
} from "@/lib/server-readiness.server";
import { isCrmServerPersistenceEnabled } from "@/lib/crm/capabilities.server";

/**
 * Lightweight readiness for live cutover — booleans only, no secrets.
 * Kipp can curl this after setting Vercel env on split-rock-construction-kx9x.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () => {
        const readiness = getServerReadiness();
        const serverPersistence = isCrmServerPersistenceEnabled();
        const authReady = isAuthEnvReady(readiness);
        const ingestReady = isIngestEnvReady(readiness);
        const portalAuthReady = isPortalAuthEnvReady(readiness);

        return Response.json({
          ok: true,
          service: "split-rock-construction",
          portalAuthReady,
          readiness: {
            ...readiness,
            serverPersistence,
            authReady,
            ingestReady,
            portalAuthReady,
          },
          notes: {
            ingest:
              ingestReady
                ? "POST /api/crm/ingest-lead accepts authenticated leads"
                : "Ingest returns 503 until DATABASE_URL and CRM_INGEST_SECRET are set",
            operatorAuth:
              authReady
                ? "Operator sign-in can persist sessions"
                : "Set BETTER_AUTH_SECRET, BETTER_AUTH_URL, and DATABASE_URL for live auth",
            portalAuth:
              portalAuthReady
                ? "POST /api/portal/sign-in can issue HttpOnly Holwege sessions"
                : "Set Preview HOLWEGE_PORTAL_INVITE + PORTAL_SESSION_SECRET (≥16) then redeploy",
          },
        });
      },
    },
  },
});
