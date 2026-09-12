import { afterEach, describe, expect, it } from "vitest";
import {
  authenticateHolwegePortalLive,
  isPortalAuthEnvReady,
  signPortalSession,
  verifyPortalSessionToken,
} from "@/lib/portal-session.server";

const PREV_INVITE = process.env.HOLWEGE_PORTAL_INVITE;
const PREV_SECRET = process.env.PORTAL_SESSION_SECRET;

afterEach(() => {
  if (PREV_INVITE === undefined) delete process.env.HOLWEGE_PORTAL_INVITE;
  else process.env.HOLWEGE_PORTAL_INVITE = PREV_INVITE;
  if (PREV_SECRET === undefined) delete process.env.PORTAL_SESSION_SECRET;
  else process.env.PORTAL_SESSION_SECRET = PREV_SECRET;
});

describe("portal session server", () => {
  it("requires env before live sign-in", () => {
    delete process.env.HOLWEGE_PORTAL_INVITE;
    delete process.env.PORTAL_SESSION_SECRET;
    expect(isPortalAuthEnvReady()).toBe(false);
    const r = authenticateHolwegePortalLive("holwegefam@comcast.net", "ANYCODE1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });

  it("authenticates Holwege against env invite and issues signed cookie session", () => {
    process.env.HOLWEGE_PORTAL_INVITE = "TESTINV1";
    process.env.PORTAL_SESSION_SECRET = "unit-test-portal-session-secret";
    expect(isPortalAuthEnvReady()).toBe(true);

    const bad = authenticateHolwegePortalLive("holwegefam@comcast.net", "WRONGCOD");
    expect(bad.ok).toBe(false);

    const ok = authenticateHolwegePortalLive("holwegefam@comcast.net", "testinv1");
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.session.clientId).toBe("c-holwege");
    expect(ok.cookie).toMatch(/HttpOnly/i);
    expect(ok.cookie).toMatch(/SameSite=Lax/i);
    expect(ok.cookie.toUpperCase()).not.toContain("TESTINV1");
  });

  it("round-trips signed session tokens", () => {
    process.env.PORTAL_SESSION_SECRET = "unit-test-portal-session-secret";
    const now = Date.now();
    const token = signPortalSession({
      clientId: "c-holwege",
      email: "holwegefam@comcast.net",
      name: "Lauren & Cindy Holwege",
      iat: now,
      exp: now + 60_000,
    });
    expect(token).toBeTruthy();
    const parsed = verifyPortalSessionToken(token!);
    expect(parsed?.clientId).toBe("c-holwege");
  });
});
