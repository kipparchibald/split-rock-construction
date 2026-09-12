/**
 * Holwege Lot 16 - system-of-record seed (SRC-2).
 *
 * Money figures are verified from contracts/Holwege/ only.
 * Land $98,000 (closed 8/24/2026 · Alliance 1100920 · deed 501245) is NOT in project.budget.
 *
 * Do not invent lot/build dollars. Do not email portal credentials to owners.
 * Live invite: HOLWEGE_PORTAL_INVITE env (server) - never ship invite in client bundle.
 */

import type {
  ActivityItem,
  Bid,
  BudgetLine,
  Client,
  CloseoutPackage,
  DailyLog,
  DocumentItem,
  ProgressDraw,
  Project,
  RealtyDeal,
} from "./types";
import { pickOpsSlice, saveOpsSnapshot } from "@/lib/ops-persist";
import { isDemoDataEnabled } from "@/lib/runtime-config";

export {
  HOLWEGE_COST_OF_WORK,
  HOLWEGE_OWNER_CONTINGENCY,
  HOLWEGE_PO,
  HOLWEGE_CONTRACT,
  HOLWEGE_DRAW_BASE,
  HOLWEGE_LAND_PAID,
  HOLWEGE_LAND_NOTE,
  HOLWEGE_CLIENT_ID,
  HOLWEGE_PROJECT_ID,
  holwegeClient,
  holwegeProject,
} from "./holwege-money";

export {
  holwegeDraws,
  holwegeDocuments,
  holwegeBudgetLines,
  holwegeCloseout,
} from "./holwege-draws-docs";

export {
  holwegeRealtyDeal,
  holwegeActivity,
  holwegeDailyLog,
  holwegeBid,
} from "./holwege-crm";

import { holwegeClient, holwegeProject, HOLWEGE_CLIENT_ID, HOLWEGE_PROJECT_ID, HOLWEGE_CONTRACT } from "./holwege-money";
import { holwegeDraws, holwegeDocuments, holwegeBudgetLines, holwegeCloseout } from "./holwege-draws-docs";
import { holwegeRealtyDeal, holwegeActivity, holwegeDailyLog, holwegeBid } from "./holwege-crm";

export const holwegePackage = {
  client: holwegeClient,
  project: holwegeProject,
  draws: holwegeDraws,
  documents: holwegeDocuments,
  budgetLines: holwegeBudgetLines,
  closeout: holwegeCloseout,
  realtyDeal: holwegeRealtyDeal,
  activity: holwegeActivity,
  dailyLogs: [holwegeDailyLog] as DailyLog[],
  bid: holwegeBid,
};

export type HolwegeStoreSlice = {
  projects: Project[];
  clients: Client[];
  draws: ProgressDraw[];
  documents: DocumentItem[];
  budgetLines: BudgetLine[];
  closeoutPackages: CloseoutPackage[];
  realtyDeals: RealtyDeal[];
  activity: ActivityItem[];
  dailyLogs: DailyLog[];
  bids: Bid[];
};

export type HolwegeLiveSeedResult = {
  seeded: boolean;
  reason: string;
};

export type HolwegeStoreApi = {
  getState: () => HolwegeStoreSlice;
  setState: (partial: Partial<HolwegeStoreSlice>) => void;
};

/**
 * Idempotent live-mode merge: if p-holwege is missing, prepend the Holwege package
 * into the zustand store and persist ops (+ CRM will pick up client/project on next flush).
 * Never invents numbers; never duplicates on refresh.
 * Pass useAppStore from the caller to avoid circular imports (store → seed → holwege).
 */
export function ensureHolwegeLiveSeed(appStore: HolwegeStoreApi): HolwegeLiveSeedResult {
  if (isDemoDataEnabled) {
    return { seeded: false, reason: "demo mode - Holwege already in seed arrays" };
  }

  const s = appStore.getState();
  const hasProject =
    s.projects.some((p) => p.id === HOLWEGE_PROJECT_ID) ||
    s.projects.some((p) => /holwege/i.test(p.name));
  const hasClient = s.clients.some((c) => c.id === HOLWEGE_CLIENT_ID);
  const hasRealty = s.realtyDeals.some((d) => d.projectId === HOLWEGE_PROJECT_ID);
  const hasDraws = s.draws.some((d) => d.projectId === HOLWEGE_PROJECT_ID);

  if (hasProject && hasClient && hasRealty && hasDraws) {
    const budgetDrift = s.projects.some(
      (p) =>
        (p.id === HOLWEGE_PROJECT_ID || /holwege/i.test(p.name)) &&
        p.budget !== HOLWEGE_CONTRACT,
    );
    const bidDrift = s.bids.some(
      (b) =>
        (b.id === "b-holwege" || b.projectId === HOLWEGE_PROJECT_ID || /holwege/i.test(b.title)) &&
        b.amount !== HOLWEGE_CONTRACT,
    );
    if (budgetDrift || bidDrift) {
      appStore.setState({
        projects: s.projects.map((p) =>
          p.id === HOLWEGE_PROJECT_ID || /holwege/i.test(p.name)
            ? { ...p, budget: HOLWEGE_CONTRACT }
            : p,
        ),
        bids: s.bids.map((b) =>
          b.id === "b-holwege" || b.projectId === HOLWEGE_PROJECT_ID || /holwege/i.test(b.title)
            ? { ...b, amount: HOLWEGE_CONTRACT }
            : b,
        ),
      });
      try {
        const next = appStore.getState();
        saveOpsSnapshot(pickOpsSlice(next as unknown as Parameters<typeof pickOpsSlice>[0]));
      } catch {
        /* SSR */
      }
      return { seeded: true, reason: "Holwege pricing repaired to HOLWEGE_CONTRACT" };
    }
    return { seeded: false, reason: "Holwege already present" };
  }

  const pkg = holwegePackage;
  appStore.setState({
    clients: hasClient ? s.clients : [pkg.client, ...s.clients],
    projects: hasProject ? s.projects : [pkg.project, ...s.projects],
    draws: hasDraws ? s.draws : [...pkg.draws, ...s.draws],
    documents: s.documents.some((d) => d.projectId === HOLWEGE_PROJECT_ID)
      ? s.documents
      : [...pkg.documents, ...s.documents],
    budgetLines: s.budgetLines.some((b) => b.projectId === HOLWEGE_PROJECT_ID)
      ? s.budgetLines
      : [...pkg.budgetLines, ...s.budgetLines],
    closeoutPackages: s.closeoutPackages.some((c) => c.projectId === HOLWEGE_PROJECT_ID)
      ? s.closeoutPackages
      : [pkg.closeout, ...s.closeoutPackages],
    realtyDeals: hasRealty ? s.realtyDeals : [pkg.realtyDeal, ...s.realtyDeals],
    activity: s.activity.some((a) => a.id.startsWith("a-holwege"))
      ? s.activity
      : [...pkg.activity, ...s.activity],
    dailyLogs: s.dailyLogs.some((l) => l.projectId === HOLWEGE_PROJECT_ID)
      ? s.dailyLogs
      : [...pkg.dailyLogs, ...s.dailyLogs],
    bids: s.bids.some((b) => b.id === pkg.bid.id) ? s.bids : [pkg.bid, ...s.bids],
  });

  try {
    const next = appStore.getState();
    saveOpsSnapshot(pickOpsSlice(next as unknown as Parameters<typeof pickOpsSlice>[0]));
  } catch {
    /* localStorage may be unavailable in SSR */
  }

  return { seeded: true, reason: "Holwege package merged into live store" };
}
