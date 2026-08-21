import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getServerReadiness,
  isAuthEnvReady,
  isIngestEnvReady,
} from "./server-readiness.server";

describe("server readiness (env booleans)", () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of [
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
      "CRM_INGEST_SECRET",
      "CRM_INGEST_USER_ID",
      "VITE_SPLIT_ROCK_DEMO",
    ]) {
      prev[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("reports all false when env is empty", () => {
    const r = getServerReadiness();
    expect(r.database).toBe(false);
    expect(r.authSecret).toBe(false);
    expect(r.ingestSecret).toBe(false);
    expect(isAuthEnvReady(r)).toBe(false);
    expect(isIngestEnvReady(r)).toBe(false);
  });

  it("auth ready requires database + auth vars", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.BETTER_AUTH_SECRET = "secret";
    process.env.BETTER_AUTH_URL = "https://splitrockconst.com";
    const r = getServerReadiness();
    expect(isAuthEnvReady(r)).toBe(true);
    expect(isIngestEnvReady(r)).toBe(false);
  });

  it("ingest ready requires database + ingest secret", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.CRM_INGEST_SECRET = "ingest-secret";
    const r = getServerReadiness();
    expect(isIngestEnvReady(r)).toBe(true);
    expect(isAuthEnvReady(r)).toBe(false);
  });

  it("tracks explicit demo flag without exposing other secrets", () => {
    process.env.VITE_SPLIT_ROCK_DEMO = "false";
    const r = getServerReadiness();
    expect(r.demoFlagExplicit).toBe(true);
    expect(r.demoFlagValue).toBe("false");
  });
});
