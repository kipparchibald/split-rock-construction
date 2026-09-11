import { describe, expect, it } from "vitest";
import { authenticateClientPortal } from "@/lib/client-portal";
import {
  HOLWEGE_CONTRACT,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_LAND_PAID,
  HOLWEGE_LAND_NOTE,
  HOLWEGE_PORTAL_TOKEN,
  HOLWEGE_PROJECT_ID,
  holwegeClient,
  holwegeDraws,
  holwegePackage,
  holwegeProject,
  type HolwegeStoreSlice,
} from "./holwege";
import {
  HOLWEGE_CLIENT_ID,
  clientsForPortalAuth,
  ensureHolwegeForPortal,
  ensureHolwegePortalFields,
  withHolwegePortalInvite,
} from "./holwege-portal";

describe("Holwege SOR seed (SRC-2)", () => {
  it("sets construction budget to verified contract total", () => {
    expect(holwegeProject.budget).toBe(689_299.65);
    expect(holwegeProject.budget).toBe(HOLWEGE_CONTRACT);
  });

  it("excludes land $98k from project.budget", () => {
    expect(holwegeProject.budget).not.toBe(HOLWEGE_CONTRACT + HOLWEGE_LAND_PAID);
    expect(holwegeProject.budget + HOLWEGE_LAND_PAID).toBe(787_299.65);
    expect(HOLWEGE_LAND_NOTE.toLowerCase()).toMatch(/not in/);
    expect(holwegeProject.description).toMatch(/Land closed separately/i);
    expect(holwegeClient.notes).toMatch(/98,?000/);
  });

  it("uses verified draw base and schedule amounts from the construction agreement", () => {
    expect(HOLWEGE_DRAW_BASE).toBe(659_330.1);
    const draws15 = holwegeDraws.filter((d) => d.id !== "pd-holwege-6");
    expect(draws15).toHaveLength(5);
    expect(draws15.map((d) => d.amount)).toEqual([
      65_933.01, 65_933.01, 131_866.02, 131_866.02, 230_765.54,
    ]);
    // Draws 1–5 are 95% of draw base; Draw 6 is the 5% retainage-style closeout line
    const sum15 = draws15.reduce((s, d) => s + d.amount, 0);
    expect(Math.abs(sum15 - HOLWEGE_DRAW_BASE * 0.95)).toBeLessThanOrEqual(0.02);
    const sumAll = holwegeDraws.reduce((s, d) => s + d.amount, 0);
    expect(Math.abs(sumAll - HOLWEGE_DRAW_BASE)).toBeLessThanOrEqual(0.02);
    expect(holwegeDraws[5]?.amount).toBe(32_966.5);
  });

  it("wires owner portal invite for Holwege client", () => {
    expect(holwegeClient.email).toBe("holwegefam@comcast.net");
    expect(holwegeClient.portalToken).toBe(HOLWEGE_PORTAL_TOKEN);
    expect(holwegeClient.portalToken).toBeTruthy();
    expect(holwegeClient.portalStatus).toBe("invited");
    expect(holwegeProject.clientId).toBe(holwegeClient.id);
  });

  it("package budget lines sum to construction contract", () => {
    const sum = holwegePackage.budgetLines.reduce((s, b) => s + b.budgeted, 0);
    expect(Math.abs(sum - HOLWEGE_CONTRACT)).toBeLessThanOrEqual(0.02);
  });
});

describe("Holwege live portal auth helpers", () => {
  it("withHolwegePortalInvite restores HOLW2026 when CRM omitted portal fields", () => {
    const bare = {
      ...holwegeClient,
      portalToken: undefined,
      portalStatus: "none" as const,
    };
    const fixed = withHolwegePortalInvite(bare);
    expect(fixed.portalToken).toBe(HOLWEGE_PORTAL_TOKEN);
    expect(fixed.portalStatus).toBe("invited");
    expect(fixed.email).toBe("holwegefam@comcast.net");
  });

  it("does not revive revoked portal", () => {
    const revoked = {
      ...holwegeClient,
      portalStatus: "revoked" as const,
      portalToken: undefined,
    };
    expect(withHolwegePortalInvite(revoked).portalStatus).toBe("revoked");
  });

  it("clientsForPortalAuth injects Holwege when missing from live CRM list", () => {
    const list = clientsForPortalAuth([]);
    expect(list.some((c) => c.id === HOLWEGE_CLIENT_ID)).toBe(true);
    const auth = authenticateClientPortal(list, "holwegefam@comcast.net", "HOLW2026");
    expect(auth.ok).toBe(true);
    if (auth.ok) expect(auth.session.clientId).toBe(HOLWEGE_CLIENT_ID);
  });

  it("clientsForPortalAuth repairs Holwege without portalToken", () => {
    const list = clientsForPortalAuth([
      {
        ...holwegeClient,
        portalToken: undefined,
        portalStatus: "none",
      },
    ]);
    const auth = authenticateClientPortal(list, "holwegefam@comcast.net", "HOLW2026");
    expect(auth.ok).toBe(true);
  });
});

describe("ensureHolwegeForPortal (live)", () => {
  function makeStore(partial: Partial<HolwegeStoreSlice> = {}) {
    let state: HolwegeStoreSlice = {
      projects: [],
      clients: [],
      draws: [],
      documents: [],
      budgetLines: [],
      closeoutPackages: [],
      realtyDeals: [],
      activity: [],
      dailyLogs: [],
      bids: [],
      ...partial,
    };
    return {
      getState: () => state,
      setState: (p: Partial<HolwegeStoreSlice>) => {
        state = { ...state, ...p };
      },
    };
  }

  it("merges Holwege package when live store is empty", () => {
    const store = makeStore();
    const result = ensureHolwegeForPortal(store, { demo: false });
    expect(result.seeded).toBe(true);
    const s = store.getState();
    expect(s.clients.some((c) => c.id === HOLWEGE_CLIENT_ID)).toBe(true);
    expect(s.projects.some((p) => p.id === HOLWEGE_PROJECT_ID)).toBe(true);
    expect(s.clients.find((c) => c.id === HOLWEGE_CLIENT_ID)?.portalToken).toBe(HOLWEGE_PORTAL_TOKEN);
    expect(s.projects.find((p) => p.id === HOLWEGE_PROJECT_ID)?.budget).toBe(HOLWEGE_CONTRACT);
  });

  it("repairs portal fields when CRM client exists without invite", () => {
    const store = makeStore({
      clients: [
        {
          ...holwegeClient,
          portalToken: undefined,
          portalStatus: "none",
        },
      ],
      projects: [holwegeProject],
      draws: holwegePackage.draws,
      realtyDeals: [holwegePackage.realtyDeal],
      documents: holwegePackage.documents,
      budgetLines: holwegePackage.budgetLines,
      closeoutPackages: [holwegePackage.closeout],
      activity: holwegePackage.activity,
      dailyLogs: holwegePackage.dailyLogs,
      bids: [holwegePackage.bid],
    });
    const result = ensureHolwegePortalFields(store, { demo: false });
    expect(result.seeded).toBe(true);
    expect(result.reason).toMatch(/portal invite/i);
    const client = store.getState().clients.find((c) => c.id === HOLWEGE_CLIENT_ID);
    expect(client?.portalToken).toBe(HOLWEGE_PORTAL_TOKEN);
    expect(client?.portalStatus).toBe("invited");
    expect(store.getState().projects.filter((p) => p.id === HOLWEGE_PROJECT_ID)).toHaveLength(1);
  });

  it("ensureHolwegeForPortal is idempotent when Holwege fully present", () => {
    const store = makeStore({
      clients: [holwegeClient],
      projects: [holwegeProject],
      draws: holwegePackage.draws,
      realtyDeals: [holwegePackage.realtyDeal],
      documents: holwegePackage.documents,
      budgetLines: holwegePackage.budgetLines,
      closeoutPackages: [holwegePackage.closeout],
      activity: holwegePackage.activity,
      dailyLogs: holwegePackage.dailyLogs,
      bids: [holwegePackage.bid],
    });
    const result = ensureHolwegeForPortal(store, { demo: false });
    expect(result.seeded).toBe(false);
    expect(store.getState().projects.filter((p) => p.id === HOLWEGE_PROJECT_ID)).toHaveLength(1);
  });
});
