import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";

/**
 * Mounts Better Auth at /api/auth/* (sign-in, get-session, OAuth callbacks).
 * Required — without this route every email/password and broker call 404s.
 *
 * On credential POSTs we await operator seed first so demo sign-in never races
 * a cold PGLite boot (Invalid email or password on first click).
 */
async function handleAuth(request: Request): Promise<Response> {
  if (emailAndPasswordEnabled && request.method === "POST") {
    try {
      const { ensureOperatorAccounts } = await import("@/lib/auth/seed-users");
      await ensureOperatorAccounts();
    } catch (err) {
      console.warn("[auth] operator seed before handler:", err);
    }
  }
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});
