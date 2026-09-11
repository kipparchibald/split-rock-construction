/**
 * Live portal auth helpers for Holwege SOR.
 *
 * /portal/login sits outside /app, so CrmBootstrap/OpsBootstrap do not run there.
 * These helpers ensure holwegefam@comcast.net + HOLW2026 remain authenticatable
 * in live mode (VITE_SPLIT_ROCK_DEMO=false) even when CRM hydrate omitted portal fields.
 *
 * Fence: does not invent credentials; keeps HOLW2026; never revives revoked portals;
 * does not change HOLWEGE_CONTRACT / DRAW_BASE / land dollars.
 */
import type { Client } from "./types";
import {
  HOLWEGE_CLIENT_ID,
  HOLWEGE_PORTAL_TOKEN,
  ensureHolwegeLiveSeed,
  holwegeClient,
  holwegePackage,
  type HolwegeLiveSeedResult,
  type HolwegeStoreApi,
} from "./holwege";
import { isDemoDataEnabled } from "@/lib/runtime-config";

/** Ensure Holwege client carries portal invite fields for live portal auth. */
export function withHolwegePortalInvite(client: Client): Client {
  if (client.portalStatus === "revoked") return client;
  if (client.portalToken && client.portalStatus && client.portalStatus !== "none") {
    return client;
  }
  return {
    ...client,
    email: client.email || holwegeClient.email,
    portalToken: client.portalToken || HOLWEGE_PORTAL_TOKEN,
    portalStatus: client.portalStatus === "active" ? "active" : "invited",
    portalInvitedAt: client.portalInvitedAt ?? holwegeClient.portalInvitedAt,
  };
}

/**
 * Merge Holwege into a client list for portal authentication (live mode).
 * Prefer store/CRM row when present; always ensure portalToken HOLW2026 unless revoked.
 */
export function clientsForPortalAuth(clients: Client[]): Client[] {
  const idx = clients.findIndex(
    (c) =>
      c.id === HOLWEGE_CLIENT_ID ||
      c.email.trim().toLowerCase() === holwegeClient.email.toLowerCase(),
  );
  if (idx < 0) return [holwegeClient, ...clients];
  const next = clients.slice();
  next[idx] = withHolwegePortalInvite(next[idx]!);
  return next;
}

/**
 * Patch store Holwege client portal fields when CRM hydrated without invite token.
 * No-op if Holwege client missing (call ensureHolwegeLiveSeed first for full package).
 */
export type HolwegePortalOptions = {
  /** Override demo flag for unit tests (default: runtime isDemoDataEnabled). */
  demo?: boolean;
};

export function ensureHolwegePortalFields(
  appStore: HolwegeStoreApi,
  options?: HolwegePortalOptions,
): HolwegeLiveSeedResult {
  const demo = options?.demo ?? isDemoDataEnabled;
  if (demo) {
    return { seeded: false, reason: "demo mode — Holwege already in seed arrays" };
  }
  const s = appStore.getState();
  const idx = s.clients.findIndex((c) => c.id === HOLWEGE_CLIENT_ID);
  if (idx < 0) {
    return { seeded: false, reason: "Holwege client missing — run ensureHolwegeLiveSeed" };
  }
  const existing = s.clients[idx]!;
  if (existing.portalStatus === "revoked") {
    return { seeded: false, reason: "Holwege portal revoked" };
  }
  const fixed = withHolwegePortalInvite(existing);
  if (
    fixed.portalToken === existing.portalToken &&
    fixed.portalStatus === existing.portalStatus
  ) {
    return { seeded: false, reason: "Holwege portal fields already present" };
  }
  appStore.setState({
    clients: s.clients.map((c, i) => (i === idx ? fixed : c)),
  });
  return { seeded: true, reason: "Holwege portal invite fields repaired" };
}

/**
 * Live portal/app bootstrap: merge SOR package if missing, then repair portal invite.
 */
export function ensureHolwegeForPortal(
  appStore: HolwegeStoreApi,
  options?: HolwegePortalOptions,
): HolwegeLiveSeedResult {
  const demo = options?.demo ?? isDemoDataEnabled;
  if (demo) {
    return { seeded: false, reason: "demo mode — Holwege already in seed arrays" };
  }
  // Prefer built-in live seed (no-ops when runtime demo=true even if options.demo=false).
  let seeded = ensureHolwegeLiveSeed(appStore);
  // Unit tests pass { demo: false } while vitest still has isDemoDataEnabled=true —
  // merge the package directly so portal auth coverage does not depend on Vite env.
  if (!seeded.seeded && options?.demo === false) {
    const s = appStore.getState();
    const hasProject = s.projects.some((p) => p.id === holwegePackage.project.id);
    const hasClient = s.clients.some((c) => c.id === HOLWEGE_CLIENT_ID);
    if (!hasProject || !hasClient) {
      const pkg = holwegePackage;
      appStore.setState({
        clients: hasClient ? s.clients : [pkg.client, ...s.clients],
        projects: hasProject ? s.projects : [pkg.project, ...s.projects],
        draws: s.draws.some((d) => d.projectId === pkg.project.id)
          ? s.draws
          : [...pkg.draws, ...s.draws],
        documents: s.documents.some((d) => d.projectId === pkg.project.id)
          ? s.documents
          : [...pkg.documents, ...s.documents],
        budgetLines: s.budgetLines.some((b) => b.projectId === pkg.project.id)
          ? s.budgetLines
          : [...pkg.budgetLines, ...s.budgetLines],
        closeoutPackages: s.closeoutPackages.some((c) => c.projectId === pkg.project.id)
          ? s.closeoutPackages
          : [pkg.closeout, ...s.closeoutPackages],
        realtyDeals: s.realtyDeals.some((d) => d.projectId === pkg.project.id)
          ? s.realtyDeals
          : [pkg.realtyDeal, ...s.realtyDeals],
        activity: s.activity.some((a) => a.id.startsWith("a-holwege"))
          ? s.activity
          : [...pkg.activity, ...s.activity],
        dailyLogs: s.dailyLogs.some((l) => l.projectId === pkg.project.id)
          ? s.dailyLogs
          : [...pkg.dailyLogs, ...s.dailyLogs],
        bids: s.bids.some((b) => b.id === pkg.bid.id) ? s.bids : [pkg.bid, ...s.bids],
      });
      seeded = { seeded: true, reason: "Holwege package merged (test/live override)" };
    }
  }
  const repaired = ensureHolwegePortalFields(appStore, { demo: false });
  if (seeded.seeded || repaired.seeded) {
    return {
      seeded: true,
      reason:
        [seeded.reason, repaired.reason].filter((r) => !r.includes("already")).join("; ") ||
        "Holwege portal ready",
    };
  }
  return seeded.reason.includes("already") && repaired.reason.includes("already")
    ? { seeded: false, reason: "Holwege already present" }
    : seeded.seeded
      ? seeded
      : repaired;
}

export { HOLWEGE_CLIENT_ID, HOLWEGE_PORTAL_TOKEN, holwegeClient };
