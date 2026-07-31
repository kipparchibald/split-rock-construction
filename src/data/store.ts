import { create } from "zustand";
import {
  activity as seedActivity, bids as seedBids, budgetLines as seedBudget,
  changeOrders as seedCOs, clients as seedClients, closeoutPackages as seedCloseout,
  commercialMeta as seedCommercialMeta, crews as seedCrews, dailyLogs as seedLogs,
  documents as seedDocs, dualRolePolicy as seedDualPolicy, equipment as seedEquipment,
  members as seedMembers, payApplications as seedPayApps, progressDraws as seedDraws,
  projects as seedProjects, realtyDeals as seedRealty, safetyIncidents as seedSafety,
  selections as seedSelections, subcontracts as seedSubs,
} from "./seed";
import type {
  ActivityItem, Bid, BudgetLine, ChangeOrder, Client, CloseoutItemStatus, CloseoutPackage,
  CommercialMeta, Crew, CrewMember, DailyLog, DocumentItem, DualRolePolicy, Equipment,
  PayApplication, ProgressDraw, Project, ProjectStatus, RealtyDeal, RealtyDealStatus,
  RealtyItemStatus, SafetyIncident, SelectionItem, SubStatus, Subcontract,
} from "./types";
import { LIMITS, clampText } from "@/lib/security";
import { estimateBucketsToBudget } from "@/lib/cost-codes";
import type { CostInputs } from "@/lib/pricing";
import { calcPrice } from "@/lib/pricing";
import type { PricingAssumptions } from "@/lib/pricing";

function uid(prefix: string) {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
    }
  } catch {
    /* fall through */
  }
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function pushActivity(list: ActivityItem[], item: ActivityItem): ActivityItem[] {
  return [item, ...list].slice(0, LIMITS.activityFeed);
}

interface AppState {
  projects: Project[]; clients: Client[]; members: CrewMember[]; crews: Crew[];
  equipment: Equipment[]; bids: Bid[]; safety: SafetyIncident[];
  documents: DocumentItem[]; budgetLines: BudgetLine[]; activity: ActivityItem[];
  draws: ProgressDraw[]; changeOrders: ChangeOrder[]; selections: SelectionItem[];
  dailyLogs: DailyLog[];
  subcontracts: Subcontract[]; payApplications: PayApplication[]; commercialMeta: CommercialMeta[];
  closeoutPackages: CloseoutPackage[]; realtyDeals: RealtyDeal[]; dualRolePolicy: DualRolePolicy;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  addDailyLog: (log: Omit<DailyLog, "id">) => void;
  submitDraw: (id: string) => void;
  markDrawPaid: (id: string) => void;
  setChangeOrderStatus: (id: string, status: ChangeOrder["status"]) => void;
  setSelectionStatus: (id: string, status: SelectionItem["status"], choice?: string) => void;
  closeSafety: (id: string) => void;
  updateDocStatus: (id: string, status: DocumentItem["status"]) => void;
  assignEquipment: (id: string, projectId: string | undefined) => void;
  addClient: (client: Omit<Client, "id">) => void;
  addSafetyIncident: (incident: Omit<SafetyIncident, "id">) => void;
  setSubStatus: (id: string, status: SubStatus) => void;
  submitPayApp: (id: string) => void;
  certifyPayApp: (id: string) => void;
  markPayAppPaid: (id: string) => void;
  setCloseoutItemStatus: (packageId: string, key: string, status: CloseoutItemStatus) => void;
  setRealtyItemStatus: (dealId: string, key: string, status: RealtyItemStatus) => void;
  setRealtyDealStatus: (dealId: string, status: RealtyDealStatus) => void;
  acknowledgeDualCapacity: (dealId: string, by: string) => void;
  updateBudgetLine: (
    id: string,
    patch: Partial<Pick<BudgetLine, "budgeted" | "committed" | "actual" | "costCodeId" | "category">>,
  ) => void;
  /** Replace project budget lines from Bid & Price cost buckets (estimate → job cost). */
  seedBudgetFromEstimate: (
    projectId: string,
    costs: CostInputs,
    assumptions: PricingAssumptions,
  ) => void;
}

function createAppStore() {
  return create<AppState>((set) => ({
    projects: seedProjects, clients: seedClients, members: seedMembers, crews: seedCrews,
    equipment: seedEquipment, bids: seedBids, safety: seedSafety, documents: seedDocs,
    budgetLines: seedBudget, activity: seedActivity, draws: seedDraws,
    changeOrders: seedCOs, selections: seedSelections, dailyLogs: seedLogs,
    subcontracts: seedSubs, payApplications: seedPayApps, commercialMeta: seedCommercialMeta,
    closeoutPackages: seedCloseout, realtyDeals: seedRealty, dualRolePolicy: seedDualPolicy,

    updateProjectStatus: (id, status) =>
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: `Project status → ${status.replace(/_/g, " ")}`,
          kind: "project",
        }),
      })),

    addDailyLog: (log) =>
      set((s) => {
        const workDone = clampText(log.workDone, LIMITS.dailyLogWork);
        const blockers = log.blockers ? clampText(log.blockers, LIMITS.dailyLogBlockers) : undefined;
        return {
          dailyLogs: [
            {
              ...log,
              id: uid("dl"),
              workDone,
              blockers: blockers || undefined,
              crewCount: Math.min(Math.max(0, Math.floor(log.crewCount) || 0), 500),
              hours: Math.min(Math.max(0, Number(log.hours) || 0), 24 * 31),
            },
            ...s.dailyLogs,
          ].slice(0, 200),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Daily log: ${workDone.slice(0, 60)}`,
            kind: "project",
          }),
        };
      }),

    submitDraw: (id) =>
      set((s) => ({
        draws: s.draws.map((d) => (d.id === id ? { ...d, status: "submitted" as const } : d)),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: "Draw submitted for payment",
          kind: "project",
        }),
      })),

    markDrawPaid: (id) =>
      set((s) => ({
        draws: s.draws.map((d) =>
          d.id === id ? { ...d, status: "paid" as const, paidDate: new Date().toISOString().slice(0, 10) } : d,
        ),
      })),

    setChangeOrderStatus: (id, status) =>
      set((s) => ({
        changeOrders: s.changeOrders.map((c) => (c.id === id ? { ...c, status } : c)),
      })),

    setSelectionStatus: (id, status, choice) =>
      set((s) => ({
        selections: s.selections.map((sel) =>
          sel.id === id ? { ...sel, status, ...(choice !== undefined ? { choice: clampText(choice, 200) } : {}) } : sel,
        ),
      })),

    closeSafety: (id) => set((s) => ({ safety: s.safety.map((i) => (i.id === id ? { ...i, status: "closed" as const } : i)) })),

    updateDocStatus: (id, status) =>
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === id ? { ...d, status, updatedAt: new Date().toISOString().slice(0, 10) } : d,
        ),
      })),

    assignEquipment: (id, projectId) =>
      set((s) => ({
        equipment: s.equipment.map((e) =>
          e.id === id ? { ...e, projectId, status: projectId ? ("on_site" as const) : ("available" as const) } : e,
        ),
      })),

    addClient: (client) =>
      set((s) => ({
        clients: [
          {
            ...client,
            id: uid("c"),
            name: clampText(client.name, LIMITS.clientName),
            notes: clampText(client.notes, LIMITS.clientNotes),
            email: clampText(client.email, 160),
            phone: clampText(client.phone, 40),
            address: clampText(client.address, 240),
          },
          ...s.clients,
        ],
      })),

    addSafetyIncident: (incident) =>
      set((s) => ({
        safety: [
          {
            ...incident,
            id: uid("s"),
            title: clampText(incident.title, 160),
            description: clampText(incident.description, 2000),
          },
          ...s.safety,
        ],
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: `Safety: ${clampText(incident.title, 60)}`,
          kind: "safety",
        }),
      })),

    setSubStatus: (id, status) =>
      set((s) => ({
        subcontracts: s.subcontracts.map((sub) => (sub.id === id ? { ...sub, status } : sub)),
      })),

    submitPayApp: (id) =>
      set((s) => ({
        payApplications: s.payApplications.map((pa) =>
          pa.id === id
            ? { ...pa, status: "submitted" as const, submittedAt: new Date().toISOString().slice(0, 10) }
            : pa,
        ),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: "Pay application submitted",
          kind: "project",
        }),
      })),

    certifyPayApp: (id) =>
      set((s) => ({
        payApplications: s.payApplications.map((pa) =>
          pa.id === id
            ? { ...pa, status: "certified" as const, certifiedAt: new Date().toISOString().slice(0, 10) }
            : pa,
        ),
      })),

    markPayAppPaid: (id) =>
      set((s) => ({
        payApplications: s.payApplications.map((pa) =>
          pa.id === id
            ? { ...pa, status: "paid" as const, paidAt: new Date().toISOString().slice(0, 10) }
            : pa,
        ),
      })),

    setCloseoutItemStatus: (packageId, key, status) =>
      set((s) => ({
        closeoutPackages: s.closeoutPackages.map((pkg) =>
          pkg.id !== packageId
            ? pkg
            : {
                ...pkg,
                items: pkg.items.map((it) =>
                  it.key !== key
                    ? it
                    : {
                        ...it,
                        status,
                        completedAt: status === "complete" ? new Date().toISOString().slice(0, 10) : it.completedAt,
                      },
                ),
              },
        ),
      })),

    setRealtyItemStatus: (dealId, key, status) =>
      set((s) => ({
        realtyDeals: s.realtyDeals.map((d) =>
          d.id !== dealId
            ? d
            : {
                ...d,
                items: d.items.map((it) =>
                  it.key !== key
                    ? it
                    : {
                        ...it,
                        status,
                        completedAt: status === "complete" ? new Date().toISOString().slice(0, 10) : it.completedAt,
                      },
                ),
              },
        ),
      })),

    setRealtyDealStatus: (dealId, status) =>
      set((s) => ({
        realtyDeals: s.realtyDeals.map((d) => (d.id === dealId ? { ...d, status } : d)),
      })),

    acknowledgeDualCapacity: (dealId, by) =>
      set((s) => ({
        realtyDeals: s.realtyDeals.map((d) =>
          d.id === dealId
            ? {
                ...d,
                dualCapacity: "disclosed" as const,
                dualCapacityAcknowledgedAt: new Date().toISOString().slice(0, 10),
                dualCapacityAcknowledgedBy: clampText(by, 120),
                items: d.items.map((it) =>
                  it.key === "dual_capacity_disclosure"
                    ? { ...it, status: "complete" as const, completedAt: new Date().toISOString().slice(0, 10) }
                    : it,
                ),
              }
            : d,
        ),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: `Dual-capacity disclosure acknowledged by ${clampText(by, 60)}`,
          kind: "doc",
        }),
      })),
    updateBudgetLine: (id, patch) =>
      set((s) => ({
        budgetLines: s.budgetLines.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          const clamp = (n: unknown) => Math.max(0, Math.min(50_000_000, Math.round(Number(n) || 0)));
          return {
            ...next,
            budgeted: patch.budgeted !== undefined ? clamp(patch.budgeted) : l.budgeted,
            committed: patch.committed !== undefined ? clamp(patch.committed) : l.committed,
            actual: patch.actual !== undefined ? clamp(patch.actual) : l.actual,
            category: patch.category !== undefined ? clampText(patch.category, 80) : l.category,
            costCodeId: patch.costCodeId !== undefined ? clampText(patch.costCodeId, 24) : l.costCodeId,
          };
        }),
      })),

    seedBudgetFromEstimate: (projectId, costs, assumptions) =>
      set((s) => {
        const price = calcPrice(costs, assumptions);
        const rows = estimateBucketsToBudget(costs, {
          softCosts: assumptions.softCosts,
          contingency: price.contingency,
          overheadProfit: price.markup,
        });
        const fresh: BudgetLine[] = rows.map((r) => ({
          id: uid("bl"),
          projectId,
          costCodeId: r.costCodeId,
          category: r.category,
          budgeted: r.budgeted,
          committed: 0,
          actual: 0,
        }));
        return {
          budgetLines: [...s.budgetLines.filter((l) => l.projectId !== projectId), ...fresh],
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Job cost seeded from estimate (${fresh.length} codes)`,
            kind: "project",
          }),
        };
      }),

  }));
}

// Always create from current seed so commercial data stays in sync on reload
export const useAppStore = createAppStore();
