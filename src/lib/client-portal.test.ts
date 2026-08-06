import { describe, expect, it } from "vitest";
import {
  authenticateClientPortal,
  generatePortalToken,
  normalizeEmail,
  normalizeToken,
  projectsForClient,
  resolvePortalClient,
} from "./client-portal";
import type { Client, Project } from "@/data/types";

const clients: Client[] = [
  {
    id: "c1",
    name: "Hart",
    email: "elena.hart@email.com",
    phone: "1",
    type: "homeowner",
    address: "",
    notes: "",
    portalToken: "HART2026",
    portalStatus: "active",
  },
  {
    id: "c3",
    name: "Bennett",
    email: "noah.b@email.com",
    phone: "2",
    type: "homeowner",
    address: "",
    notes: "",
    portalToken: "BENN2026",
    portalStatus: "active",
  },
  {
    id: "c4",
    name: "Revoked",
    email: "x@y.com",
    phone: "3",
    type: "homeowner",
    address: "",
    notes: "",
    portalToken: "REVOKED1",
    portalStatus: "revoked",
  },
];

const projects = [
  { id: "p1", clientId: "c1", name: "Hart Residence" },
  { id: "p2", clientId: "c1", name: "Hart Spec" },
  { id: "p3", clientId: "c3", name: "Willow Creek" },
] as Project[];

describe("client portal isolation", () => {
  it("authenticates only matching email + token", () => {
    const ok = authenticateClientPortal(clients, "elena.hart@email.com", "hart2026");
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.session.clientId).toBe("c1");
      expect(ok.session.token).toBe("HART2026");
    }

    const wrong = authenticateClientPortal(clients, "elena.hart@email.com", "BENN2026");
    expect(wrong.ok).toBe(false);

    const other = authenticateClientPortal(clients, "noah.b@email.com", "HART2026");
    expect(other.ok).toBe(false);
  });

  it("blocks revoked clients", () => {
    const r = authenticateClientPortal(clients, "x@y.com", "REVOKED1");
    expect(r.ok).toBe(false);
  });

  it("scopes projects to one clientId", () => {
    const hart = projectsForClient(projects, "c1");
    expect(hart.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
    expect(hart.every((p) => p.clientId === "c1")).toBe(true);

    const benn = projectsForClient(projects, "c3");
    expect(benn).toHaveLength(1);
    expect(benn[0]!.id).toBe("p3");
  });

  it("invalidates session when token rotates", () => {
    const session = {
      clientId: "c1",
      token: "OLDTOKEN",
      name: "Hart",
      email: "elena.hart@email.com",
      signedInAt: new Date().toISOString(),
    };
    expect(resolvePortalClient(clients, session)).toBeNull();
    expect(
      resolvePortalClient(clients, { ...session, token: "HART2026" })?.id,
    ).toBe("c1");
  });

  it("normalizes emails and tokens", () => {
    expect(normalizeEmail("  Elena.Hart@Email.COM ")).toBe("elena.hart@email.com");
    expect(normalizeToken(" ha-rt 20 26 ")).toBe("HART2026");
    expect(generatePortalToken()).toHaveLength(8);
  });
});
