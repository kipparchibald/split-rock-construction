/**
 * Client (owner) portal access — separate from operator Better Auth.
 *
 * Isolation rules:
 * - A portal session is bound to exactly one clientId + portalToken.
 * - Project lists and mutations in the portal must filter by that clientId.
 * - Tokens rotate on revoke/re-invite so old links stop working.
 */
import type { Client, Project } from "@/data/types";

export const PORTAL_SESSION_KEY = "split-rock-portal-session-v1";

export type PortalSession = {
  clientId: string;
  /** Must match Client.portalToken at login and on each read */
  token: string;
  name: string;
  email: string;
  signedInAt: string;
};

export function generatePortalToken(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeToken(token: string): string {
  return token.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function readPortalSession(): PortalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PORTAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalSession;
    if (!parsed?.clientId || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePortalSession(session: PortalSession): void {
  window.localStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("src-portal-session"));
}

export function clearPortalSession(): void {
  window.localStorage.removeItem(PORTAL_SESSION_KEY);
  window.dispatchEvent(new Event("src-portal-session"));
}

/** Validate session still matches live client record (token not rotated/revoked). */
export function resolvePortalClient(
  clients: Client[],
  session: PortalSession | null,
): Client | null {
  if (!session) return null;
  const client = clients.find((c) => c.id === session.clientId);
  if (!client) return null;
  if (client.portalStatus === "revoked") return null;
  if (!client.portalToken) return null;
  if (normalizeToken(client.portalToken) !== normalizeToken(session.token)) return null;
  return client;
}

export function projectsForClient(projects: Project[], clientId: string): Project[] {
  return projects.filter((p) => p.clientId === clientId);
}

export function portalInvitePath(clientId: string, token: string): string {
  const q = new URLSearchParams({
    client: clientId,
    code: token,
  });
  return `/portal/login?${q.toString()}`;
}

export function authenticateClientPortal(
  clients: Client[],
  email: string,
  code: string,
): { ok: true; client: Client; session: PortalSession } | { ok: false; error: string } {
  const em = normalizeEmail(email);
  const tok = normalizeToken(code);
  if (!em || !tok) return { ok: false, error: "Enter the email on file and your access code." };

  const client = clients.find((c) => normalizeEmail(c.email) === em);
  if (!client) {
    return { ok: false, error: "No portal access for that email. Contact Split Rock." };
  }
  if (client.portalStatus === "revoked") {
    return { ok: false, error: "Portal access was revoked. Contact Split Rock to re-invite." };
  }
  if (!client.portalToken || client.portalStatus === "none") {
    return { ok: false, error: "You have not been invited yet. Ask Split Rock for an invite." };
  }
  if (normalizeToken(client.portalToken) !== tok) {
    return { ok: false, error: "Access code does not match. Check the invite or ask for a new code." };
  }

  const session: PortalSession = {
    clientId: client.id,
    token: client.portalToken,
    name: client.name,
    email: client.email,
    signedInAt: new Date().toISOString(),
  };
  return { ok: true, client, session };
}
