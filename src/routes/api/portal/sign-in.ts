import { createFileRoute } from "@tanstack/react-router";
import { authenticateHolwegePortalLive } from "@/lib/portal-session.server";

function jsonResponse(body: unknown, status: number, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
  });
}

/**
 * Live Holwege portal sign-in.
 * Validates email + invite against server env (HOLWEGE_PORTAL_INVITE) and sets
 * an HttpOnly session cookie signed with PORTAL_SESSION_SECRET.
 * Demo mode continues to use client-side localStorage auth — this route is for live.
 */
export const Route = createFileRoute("/api/portal/sign-in")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
        }
        const email =
          typeof (body as { email?: unknown })?.email === "string"
            ? (body as { email: string }).email
            : "";
        const code =
          typeof (body as { code?: unknown })?.code === "string"
            ? (body as { code: string }).code
            : "";

        const result = authenticateHolwegePortalLive(email, code);
        if (!result.ok) {
          return jsonResponse({ ok: false, error: result.error }, result.status);
        }

        return jsonResponse(
          {
            ok: true,
            session: {
              clientId: result.session.clientId,
              name: result.session.name,
              email: result.session.email,
              signedInAt: new Date(result.session.iat).toISOString(),
              authMode: "live" as const,
            },
          },
          200,
          { "Set-Cookie": result.cookie },
        );
      },
    },
  },
});
