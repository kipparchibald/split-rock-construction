/**
 * Demo-only Holwege portal client.
 * Live SOR (`holwegeClient`) must not ship HOLW2026.
 * Seed/store use this when `isDemoDataEnabled` so E2E + demo login resolve.
 */
import { holwegeClient } from "./holwege";
import { DEMO_HOLWEGE_PORTAL } from "@/lib/demo-credentials";
import type { Client } from "./types";

export const holwegeDemoClient: Client = {
  ...holwegeClient,
  portalToken: DEMO_HOLWEGE_PORTAL.portalToken,
  portalStatus: "invited",
  portalInvitedAt: holwegeClient.portalInvitedAt ?? "2026-08-31",
};
