import { create } from "zustand";
import {
  activity as seedActivity, bids as seedBids, budgetLines as seedBudget,
  changeOrders as seedCOs, clients as seedClients, commercialMeta as seedCommercialMeta,
  crews as seedCrews, dailyLogs as seedLogs, documents as seedDocs,
  equipment as seedEquipment, members as seedMembers, payApplications as seedPayApps,
  progressDraws as seedDraws, projects as seedProjects, safetyIncidents as seedSafety,
  selections as seedSelections, subcontracts as seedSubs,
} from "./seed";
import type {
  ActivityItem, Bid, BudgetLine, ChangeOrder, Client, CommercialMeta, Crew, CrewMember,
  DailyLog, DocumentItem, Equipment, PayApplication, ProgressDraw, Project, ProjectStatus,
  SafetyIncident, SelectionItem, SubStatus, Subcontract,
} from "./types";

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

interface AppState {
  projects: Project[]; clients: Client[]; members: CrewMember[]; crews: Crew[];
  equipment: Equipment[]; bids: Bid[]; safety: SafetyIncident[];
  documents: DocumentItem[]; budgetLines: BudgetLine[]; activity: ActivityItem[];
  draws: ProgressDraw[]; changeOrders: ChangeOrder[]; selections: SelectionItem[];
  dailyLogs: DailyLog[];
  subcontracts: Subcontract[]; payApplications: PayApplication[]; commercialMeta: CommercialMeta[];
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
}

function createAppStore() {
  return create<AppState>((set) => ({
    projects: seedProjects, clients: seedClients, members: seedMembers, crews: seedCrews,
    equipment: seedEquipment, bids: seedBids, safety: seedSafety, documents: seedDocs,
    budgetLines: seedBudget, activity: seedActivity, draws: seedDraws,
    changeOrders: seedCOs, selections: seedSelections, dailyLogs: seedLogs,
    subcontracts: seedSubs, payApplications: seedPayApps, commercialMeta: seedCommercialMeta,

    updateProjectStatus: (id, status) =>
      set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, status } : p)),
        activity: [{ id: uid("a"), at: new Date().toISOString(), text: `Project status → ${status.replace(/_/g, " ")}`, kind: "project" }, ...s.activity],
      })),

    addDailyLog: (log) =>
      set((s) => ({
        dailyLogs: [{ ...log, id: uid("dl") }, ...s.dailyLogs],
        activity: [{ id: uid("a"), at: new Date().toISOString(), text: `Daily log: ${log.workDone.slice(0, 60)}`, kind: "project" }, ...s.activity],
      })),

    submitDraw: (id) =>
      set((s) => ({
        draws: s.draws.map((d) => (d.id === id ? { ...d, status: "submitted" as const } : d)),
        activity: [{ id: uid("a"), at: new Date().toISOString(), text: "Draw submitted for payment", kind: "project" }, ...s.activity],
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
          sel.id === id ? { ...sel, status, ...(choice !== undefined ? { choice } : {}) } : sel,
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

    addClient: (client) => set((s) => ({ clients: [{ ...client, id: uid("c") }, ...s.clients] })),

    addSafetyIncident: (incident) =>
      set((s) => ({
        safety: [{ ...incident, id: uid("s") }, ...s.safety],
        activity: [{ id: uid("a"), at: new Date().toISOString(), text: `Safety: ${incident.title}`, kind: "safety" }, ...s.activity],
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
        activity: [{ id: uid("a"), at: new Date().toISOString(), text: "Pay application submitted", kind: "project" }, ...s.activity],
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
  }));
}

// Always create from current seed so commercial data stays in sync on reload
export const useAppStore = createAppStore();
