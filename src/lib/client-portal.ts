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

/**
 * Scrub operator draw-trigger / draw-name language for owner portal Money list.
 * Strips draw-base dollars, contingency-credit ops notes, invent/retainage jargon.
 * Does not mutate seed data — display-only mapping.
 */
export function scrubDrawTriggerForOwner(trigger: string): string {
  let t = trigger.trim();
  if (!t) return "Construction milestone";

  const hasOps =
    /draw\s+base/i.test(t) ||
    /contingency/i.test(t) ||
    /do\s+not\s+invent/i.test(t) ||
    /retainage/i.test(t) ||
    /\(\s*\d+%\s+of\s+draw/i.test(t);

  // Heavy ops copy: keep the leading milestone clause only (before . or ;)
  if (hasOps) {
    const head = (t.split(/[.;]/)[0] ?? t).trim();
    t = head;
  }

  // Parenthetical % of draw base (with or without $amount)
  t = t.replace(/\s*\(\s*\d+%\s+of\s+draw\s+base(?:\s*\$[\d,]+(?:\.\d+)?)?\s*\)/gi, "");
  t = t.replace(/\bof\s+draw\s+base(?:\s*\$[\d,]+(?:\.\d+)?)?/gi, "");
  t = t.replace(/\bdraw\s+base\s*\$[\d,]+(?:\.\d+)?/gi, "");
  t = t.replace(/\bdraw\s+base\b/gi, "");

  t = t.replace(/\s*\+\s*unused\s+contingency\s+credit\b/gi, "");
  t = t.replace(/\bunused\s+contingency\s+credit\b/gi, "");
  t = t.replace(/\bcontingency\s+credit\b/gi, "");
  t = t.replace(/\bcontingency\b/gi, "");
  t = t.replace(/\bretainage-style\b/gi, "");
  t = t.replace(/\bretainage\b/gi, "");
  t = t.replace(/\(\$[\d,]+(?:\.\d+)?\s+reserve\)/gi, "");
  t = t.replace(/\$[\d,]+(?:\.\d+)?/g, ""); // drop leftover dollar crumbs in ops lines
  t = t.replace(/\bon\s+this\s+draw\b/gi, "");
  t = t.replace(/\bcloseout\s+of\b/gi, "closeout");

  t = t.replace(/\s{2,}/g, " ");
  t = t.replace(/\s+([.,;:+])/g, "$1");
  t = t.replace(/[.;,+\s]+$/g, "");
  t = t.replace(/^[.;,+\s]+/g, "");
  t = t.replace(/\s*\+\s*$/g, "");
  t = t.trim();

  return t || "Construction milestone";
}
