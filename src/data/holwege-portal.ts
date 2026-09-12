/**
 * Live portal auth helpers for Holwege SOR.
 *
 * /portal/login sits outside /app, so CrmBootstrap/OpsBootstrap do not run there.
 * Live Holwege invite codes live in server env (HOLWEGE_PORTAL_INVITE) — never ship
 * a long-lived token in the client bundle. These helpers still ensure the Holwege
 * client/project rows exist for portal resolution after cookie session auth.
 *
 * Fence: never invent credentials; never revive revoked portals;
 * does not change HOLWEGE_CONTRACT / DRAW_BASE / land dollars; do not auto-email owners.
 */
import type { Client } from "./types";
import {
  HOLWEGE_CLIENT_ID,
  ensureHolwegeLiveSeed,
  holwegeClient,
  holwegePackage,
  type HolwegeLiveSeedResult,
  type HolwegeStoreApi,
} from "./holwege";
import { repairHolwegeMoneySlice } from "@/lib/holwege-pricing";
import { isDemoDataEnabled } from "@/lib/runtime-config";

export function withHolwegePortalInvite(client: Client): Client {
  if (client.portalStatus === "revoked") return client;
  return {
    ...client,
    email: client.email || holwegeClient.email,
    portalToken: undefined,
    portalStatus: client.portalStatus === "active" ? "active" : "invited",
    portalInvitedAt: client.portalInvitedAt ?? holwegeClient.portalInvitedAt,
  };
}

export function clientsForPortalAuth(clients: Client[]): Client[] {
  const idx = clients.findIndex(
    (c) =>
      c.id === HOLWEGE_CLIENT_ID ||
      c.email.trim().toLowerCase() === holwegeClient.email.toLowerCase(),
  );
  if (idx < 0) return [withHolwegePortalInvite(holwegeClient), ...clients];
  const next = clients.slice();
  next[idx] = withHolwegePortalInvite(next[idx]!);
  return next;
}

export type HolwegePortalOptions = {
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
  const clientChanged =
    fixed.portalToken !== existing.portalToken ||
    fixed.portalStatus !== existing.portalStatus ||
    Boolean(existing.portalToken);
  const budgetDrift = s.projects.some(
    (proj) =>
      (proj.id === holwegePackage.project.id || /holwege/i.test(proj.name)) &&
      proj.budget !== holwegePackage.project.budget,
  );
  const bidDrift = s.bids.some(
    (b) =>
      (b.id === holwegePackage.bid.id ||
        b.projectId === holwegePackage.project.id ||
        /holwege/i.test(b.title)) &&
      b.amount !== holwegePackage.bid.amount,
  );

  if (!clientChanged && !budgetDrift && !bidDrift) {
    return { seeded: false, reason: "Holwege portal fields already present" };
  }
  const money =
    budgetDrift || bidDrift
      ? repairHolwegeMoneySlice({
          projects: s.projects,
          bids: s.bids,
          draws: s.draws,
          budgetLines: s.budgetLines,
        })
      : null;
  appStore.setState({
    clients: s.clients.map((c, i) => (i === idx ? fixed : c)),
    ...(money
      ? {
          projects: money.projects,
          bids: money.bids,
          draws: money.draws ?? s.draws,
          budgetLines: money.budgetLines ?? s.budgetLines,
        }
      : {}),
  });
  return { seeded: true, reason: "Holwege portal fields / pricing repaired" };
}

export function ensureHolwegeForPortal(
  appStore: HolwegeStoreApi,
  options?: HolwegePortalOptions,
): HolwegeLiveSeedResult {
  const demo = options?.demo ?? isDemoDataEnabled;
  if (demo) {
    return { seeded: false, reason: "demo mode — Holwege already in seed arrays" };
  }
  let seeded = ensureHolwegeLiveSeed(appStore);
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

export { HOLWEGE_CLIENT_ID, holwegeClient };
