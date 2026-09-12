import { createFileRoute } from "@tanstack/react-router";
import { readPortalSessionFromRequest } from "@/lib/portal-session.server";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Return the current live portal session from the HttpOnly cookie (no token leaked). */
export const Route = createFileRoute("/api/portal/session")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const session = readPortalSessionFromRequest(request);
        if (!session) {
          return jsonResponse({ ok: true, session: null }, 200);
        }
        return jsonResponse(
          {
            ok: true,
            session: {
              clientId: session.clientId,
              name: session.name,
              email: session.email,
              signedInAt: new Date(session.iat).toISOString(),
              authMode: "live" as const,
            },
          },
          200,
        );
      },
    },
  },
});
