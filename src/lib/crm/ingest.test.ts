import { describe, expect, it } from "vitest";
import {
  buildProspectFromIngest,
  extractIngestSecret,
  ingestIdempotencyKey,
  ingestLeadSchema,
  mapIngestSourceToLeadSource,
  normalizeIngestSource,
  resolveDualRoleFlag,
  secretsMatch,
} from "./ingest";

describe("ingestLeadSchema", () => {
  it("accepts a minimal Rigby Lots payload", () => {
    const parsed = ingestLeadSchema.parse({
      source: "rigbylots",
      name: "Jane Doe",
      email: "jane@example.com",
    });
    expect(parsed.source).toBe("rigbylots");
    expect(parsed.leadType).toBe("lot_only");
    expect(parsed.phone).toBe("");
  });

  it("accepts full payload with externalId", () => {
    const parsed = ingestLeadSchema.parse({
      source: "rigbylots",
      externalId: "rl-lead-42",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "208-555-0100",
      interest: "Lot 12 / Teton Heights",
      notes: "Wants tour next week",
      lotId: "th-lot-12",
      leadType: "lot_and_build",
      dualRole: true,
    });
    expect(parsed.externalId).toBe("rl-lead-42");
    expect(parsed.leadType).toBe("lot_and_build");
  });

  it("rejects missing name", () => {
    expect(() =>
      ingestLeadSchema.parse({ source: "rigbylots", name: "", email: "a@b.c" }),
    ).toThrow();
  });

  it("rejects invalid email when non-empty", () => {
    expect(() =>
      ingestLeadSchema.parse({ source: "rigbylots", name: "A", email: "not-an-email" }),
    ).toThrow();
  });

  it("allows empty email string", () => {
    const parsed = ingestLeadSchema.parse({
      source: "rigbylots",
      name: "No Email Lead",
      email: "",
    });
    expect(parsed.email).toBe("");
  });
});

describe("ingestIdempotencyKey", () => {
  it("returns null when externalId is omitted", () => {
    expect(ingestIdempotencyKey({ source: "rigbylots" })).toBeNull();
  });

  it("returns null when externalId is blank", () => {
    expect(ingestIdempotencyKey({ source: "rigbylots", externalId: "   " })).toBeNull();
  });

  it("normalizes source and trims externalId", () => {
    expect(
      ingestIdempotencyKey({ source: "RigbyLots", externalId: "  lead-99  " }),
    ).toEqual({
      ingestSource: "rigbylots",
      ingestExternalId: "lead-99",
    });
  });
});

describe("normalizeIngestSource", () => {
  it("lowercases and trims", () => {
    expect(normalizeIngestSource("  RigbyLots  ")).toBe("rigbylots");
  });
});

describe("mapIngestSourceToLeadSource", () => {
  it("maps rigbylots to website", () => {
    expect(mapIngestSourceToLeadSource("rigbylots")).toBe("website");
    expect(mapIngestSourceToLeadSource("rigby_lots")).toBe("website");
  });

  it("maps unknown sources to other", () => {
    expect(mapIngestSourceToLeadSource("partner_xyz")).toBe("other");
  });
});

describe("resolveDualRoleFlag", () => {
  it("is true when dualRole is true", () => {
    expect(
      resolveDualRoleFlag({
        source: "rigbylots",
        name: "A",
        email: "",
        dualRole: true,
        leadType: "commercial",
      }),
    ).toBe(true);
  });

  it("is true for lot_and_build without explicit dualRole", () => {
    expect(
      resolveDualRoleFlag({
        source: "rigbylots",
        name: "A",
        email: "",
        leadType: "lot_and_build",
      }),
    ).toBe(true);
  });

  it("is false for commercial without dualRole", () => {
    expect(
      resolveDualRoleFlag({
        source: "rigbylots",
        name: "A",
        email: "",
        leadType: "commercial",
      }),
    ).toBe(false);
  });
});

describe("buildProspectFromIngest", () => {
  it("creates a new-stage prospect with score and mapped source", () => {
    const prospect = buildProspectFromIngest(
      {
        source: "rigbylots",
        externalId: "x1",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "555",
        interest: "Lot 12",
        leadType: "lot_and_build",
        lotId: "th12",
      },
      { assignedTo: "Kipp Archibald", id: "prtest1234", createdAt: "2026-08-01T00:00:00.000Z" },
    );

    expect(prospect.id).toBe("prtest1234");
    expect(prospect.stage).toBe("new");
    expect(prospect.source).toBe("website");
    expect(prospect.dualRoleFlag).toBe(true);
    expect(prospect.lotId).toBe("th12");
    expect(prospect.score).toBeGreaterThan(0);
    expect(prospect.notes).toContain("rigbylots");
  });
});

describe("extractIngestSecret", () => {
  it("reads Bearer token", () => {
    const req = new Request("https://example.com", {
      headers: { Authorization: "Bearer my-secret-token" },
    });
    expect(extractIngestSecret(req)).toBe("my-secret-token");
  });

  it("reads X-CRM-Ingest-Secret header", () => {
    const req = new Request("https://example.com", {
      headers: { "X-CRM-Ingest-Secret": "header-secret" },
    });
    expect(extractIngestSecret(req)).toBe("header-secret");
  });

  it("returns null when missing", () => {
    expect(extractIngestSecret(new Request("https://example.com"))).toBeNull();
  });
});

describe("secretsMatch", () => {
  it("matches equal secrets", () => {
    expect(secretsMatch("abc123", "abc123")).toBe(true);
  });

  it("rejects different secrets", () => {
    expect(secretsMatch("abc123", "abc124")).toBe(false);
    expect(secretsMatch("short", "longer")).toBe(false);
  });
});
