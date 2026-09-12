/**
 * Server-only Holwege / owner portal session (HttpOnly cookie).
 * Invite codes live in env (HOLWEGE_PORTAL_INVITE) — never ship them in the client bundle.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  HOLWEGE_CLIENT_ID,
  holwegeClient,
} from "@/data/holwege";
import { normalizeEmail, normalizeToken } from "@/lib/client-portal";

export const PORTAL_COOKIE_NAME = "src_portal_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type LivePortalSessionPayload = {
  clientId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
};

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

/** Dynamic key so Vite cannot bake empty process.env.NAME at first build. */
function envTrim(key: string): string | null {
  const s = typeof process !== "undefined" ? process.env[key]?.trim() : undefined;
  return s ? s : null;
}

function sessionSecret(): string | null {
  const s = envTrim("PORTAL_SESSION_SECRET");
  return s && s.length >= 16 ? s : null;
}

function inviteCode(): string | null {
  const s = envTrim("HOLWEGE_PORTAL_INVITE");
  return s ? normalizeToken(s) : null;
}

/** Constant-time compare for invite / secrets. */
export function portalSecretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isPortalAuthEnvReady(): boolean {
  return Boolean(sessionSecret() && inviteCode());
}

export function signPortalSession(payload: LivePortalSessionPayload): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyPortalSessionToken(token: string): LivePortalSessionPayload | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;
  const expected = b64url(createHmac("sha256", secret).update(body).digest());
  if (!portalSecretsMatch(sig, expected)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as LivePortalSessionPayload;
    if (!payload?.clientId || !payload?.email || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function readPortalSessionFromRequest(request: Request): LivePortalSessionPayload | null {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const raw = cookies[PORTAL_COOKIE_NAME];
  if (!raw) return null;
  return verifyPortalSessionToken(raw);
}

export function portalCookieOptions(maxAgeSec: number): string {
  const secure =
    envTrim("NODE_ENV") === "production" ||
    envTrim("VERCEL") === "1" ||
    (envTrim("BETTER_AUTH_URL") ?? "").startsWith("https://");
  const parts = [
    `${PORTAL_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, maxAgeSec)}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function setPortalSessionCookie(token: string): string {
  const base = portalCookieOptions(Math.floor(SESSION_TTL_MS / 1000));
  return base.replace(`${PORTAL_COOKIE_NAME}=`, `${PORTAL_COOKIE_NAME}=${encodeURIComponent(token)}`);
}

export function clearPortalSessionCookie(): string {
  return portalCookieOptions(0).replace(`${PORTAL_COOKIE_NAME}=`, `${PORTAL_COOKIE_NAME}=`);
}

export type PortalSignInResult =
  | { ok: true; session: LivePortalSessionPayload; cookie: string }
  | { ok: false; error: string; status: number };

/**
 * Validate live Holwege portal sign-in against env invite (revocable by rotating env).
 * Does not email owners. Does not read client-bundle tokens.
 */
export function authenticateHolwegePortalLive(
  email: string,
  code: string,
): PortalSignInResult {
  if (!isPortalAuthEnvReady()) {
    return {
      ok: false,
      error: "Portal sign-in is not configured. Contact Split Rock.",
      status: 503,
    };
  }
  const em = normalizeEmail(email);
  const tok = normalizeToken(code);
  if (!em || !tok) {
    return { ok: false, error: "Enter the email on file and your access code.", status: 400 };
  }

  const expectedEmail = normalizeEmail(holwegeClient.email);
  if (em !== expectedEmail) {
    return {
      ok: false,
      error: "No portal access for that email. Contact Split Rock.",
      status: 401,
    };
  }

  const expectedInvite = inviteCode()!;
  if (!portalSecretsMatch(tok, expectedInvite)) {
    return {
      ok: false,
      error: "Access code does not match. Check the invite or ask for a new code.",
      status: 401,
    };
  }

  const now = Date.now();
  const session: LivePortalSessionPayload = {
    clientId: HOLWEGE_CLIENT_ID,
    email: holwegeClient.email,
    name: holwegeClient.name,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const token = signPortalSession(session);
  if (!token) {
    return { ok: false, error: "Portal session could not be issued.", status: 503 };
  }
  return { ok: true, session, cookie: setPortalSessionCookie(token) };
}
