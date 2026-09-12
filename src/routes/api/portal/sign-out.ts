import { createFileRoute } from "@tanstack/react-router";
import { clearPortalSessionCookie } from "@/lib/portal-session.server";

function jsonResponse(body: unknown, status: number, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
  });
}

/** Clear the live portal HttpOnly session cookie. */
export const Route = createFileRoute("/api/portal/sign-out")({
  server: {
    handlers: {
      POST: () => {
        return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearPortalSessionCookie() });
      },
    },
  },
});
