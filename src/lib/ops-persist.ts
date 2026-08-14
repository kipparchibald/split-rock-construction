/**
 * Browser persistence for operational job data (draws, logs, COs, etc.).
 * CRM entities sync separately; this keeps field/money state across refresh
 * until Neon-backed ops tables exist.
 */

import type {
  ActivityItem,
  BudgetLine,
  ChangeOrder,
  CloseoutPackage,
  DailyLog,
  DocumentItem,
  PermitPackage,
  ProgressDraw,
  SafetyIncident,
  SelectionItem,
} from "@/data/types";
import { loadJson, saveJson } from "@/lib/local-persist";

const OPS_KEY = "ops-snapshot";

export interface OpsSnapshot {
  draws: ProgressDraw[];
  changeOrders: ChangeOrder[];
  selections: SelectionItem[];
  dailyLogs: DailyLog[];
  documents: DocumentItem[];
  budgetLines: BudgetLine[];
  closeoutPackages: CloseoutPackage[];
  permitPackages: PermitPackage[];
  safety: SafetyIncident[];
  activity: ActivityItem[];
}

const empty: OpsSnapshot = {
  draws: [],
  changeOrders: [],
  selections: [],
  dailyLogs: [],
  documents: [],
  budgetLines: [],
  closeoutPackages: [],
  permitPackages: [],
  safety: [],
  activity: [],
};

export function loadOpsSnapshot(): Partial<OpsSnapshot> {
  const saved = loadJson<Partial<OpsSnapshot> | null>(OPS_KEY, null);
  if (!saved || typeof saved !== "object") return {};
  return saved;
}

export function saveOpsSnapshot(snapshot: OpsSnapshot): void {
  saveJson(OPS_KEY, snapshot);
}

export function pickOpsSlice(state: {
  draws: OpsSnapshot["draws"];
  changeOrders: OpsSnapshot["changeOrders"];
  selections: OpsSnapshot["selections"];
  dailyLogs: OpsSnapshot["dailyLogs"];
  documents: OpsSnapshot["documents"];
  budgetLines: OpsSnapshot["budgetLines"];
  closeoutPackages: OpsSnapshot["closeoutPackages"];
  permitPackages: OpsSnapshot["permitPackages"];
  safety: OpsSnapshot["safety"];
  activity: OpsSnapshot["activity"];
}): OpsSnapshot {
  return {
    draws: state.draws,
    changeOrders: state.changeOrders,
    selections: state.selections,
    dailyLogs: state.dailyLogs,
    documents: state.documents,
    budgetLines: state.budgetLines,
    closeoutPackages: state.closeoutPackages,
    permitPackages: state.permitPackages,
    safety: state.safety,
    activity: state.activity,
  };
}

/** True when any ops slice has persisted rows (used to avoid overwriting with empty CRM hydrate). */
export function opsSnapshotHasData(snapshot: Partial<OpsSnapshot>): boolean {
  return (
    (snapshot.draws?.length ?? 0) > 0 ||
    (snapshot.changeOrders?.length ?? 0) > 0 ||
    (snapshot.selections?.length ?? 0) > 0 ||
    (snapshot.dailyLogs?.length ?? 0) > 0 ||
    (snapshot.documents?.length ?? 0) > 0 ||
    (snapshot.budgetLines?.length ?? 0) > 0 ||
    (snapshot.closeoutPackages?.length ?? 0) > 0 ||
    (snapshot.permitPackages?.length ?? 0) > 0 ||
    (snapshot.safety?.length ?? 0) > 0 ||
    (snapshot.activity?.length ?? 0) > 0
  );
}

export { empty as emptyOpsSnapshot };
