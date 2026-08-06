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
import { liveEmpty } from "./live-empty";
import { isDemoDataEnabled } from "@/lib/runtime-config";
import type {
  ActivityItem, Bid, BidStatus, BudgetLine, ChangeOrder, Client, CloseoutItemStatus, CloseoutPackage,
  CommercialMeta, Crew, CrewMember, DailyLog, DocumentItem, DualRolePolicy, Equipment,
  PayApplication, PermitPackage, PermitStatus, ProgressDraw, Project, ProjectStatus, RealtyDeal, RealtyDealStatus,
  RealtyItemStatus, SafetyIncident, SelectionItem, SubStatus, Subcontract,
} from "./types";
import { LIMITS, clampText } from "@/lib/security";
import { estimateBucketsToBudget } from "@/lib/cost-codes";
import type { CostInputs } from "@/lib/pricing";
import { calcPrice } from "@/lib/pricing";
import type { PricingAssumptions } from "@/lib/pricing";
import { plans } from "./plans";
import { buildJobFromPlan } from "@/lib/start-from-plan";
import { generatePortalToken } from "@/lib/client-portal";
import {
  advancePermitStatus,
  buildDraftForKey,
  CORE_PERMIT_KEYS,
  createPermitPackage,
  mockAgencyReference,
  packageStatus as computePermitPackageStatus,
} from "@/lib/permits-idaho";

function uid(prefix: string) {
  try {
    if (typeof window !== "undefined" && typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
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

function seedPermitPackages(projects: Project[]): PermitPackage[] {
  return projects
    .filter((p) => p.type === "residential")
    .map((p) => createPermitPackage(p.id, p.name));
}

const initial = isDemoDataEnabled
  ? {
      projects: seedProjects,
      clients: seedClients,
      members: seedMembers,
      crews: seedCrews,
      equipment: seedEquipment,
      bids: seedBids,
      safety: seedSafety,
      documents: seedDocs,
      budgetLines: seedBudget,
      activity: seedActivity,
      draws: seedDraws,
      changeOrders: seedCOs,
      selections: seedSelections,
      dailyLogs: seedLogs,
      subcontracts: seedSubs,
      payApplications: seedPayApps,
      commercialMeta: seedCommercialMeta,
      closeoutPackages: seedCloseout,
      realtyDeals: seedRealty,
      dualRolePolicy: seedDualPolicy,
      permitPackages: seedPermitPackages(seedProjects),
    }
  : {
      projects: liveEmpty.projects,
      clients: liveEmpty.clients,
      members: liveEmpty.members,
      crews: liveEmpty.crews,
      equipment: liveEmpty.equipment,
      bids: liveEmpty.bids,
      safety: liveEmpty.safety,
      documents: liveEmpty.documents,
      budgetLines: liveEmpty.budgetLines,
      activity: liveEmpty.activity,
      draws: liveEmpty.draws,
      changeOrders: liveEmpty.changeOrders,
      selections: liveEmpty.selections,
      dailyLogs: liveEmpty.dailyLogs,
      subcontracts: liveEmpty.subcontracts,
      payApplications: liveEmpty.payApplications,
      commercialMeta: liveEmpty.commercialMeta,
      closeoutPackages: liveEmpty.closeoutPackages,
      realtyDeals: liveEmpty.realtyDeals,
      dualRolePolicy: liveEmpty.dualRolePolicy,
      permitPackages: [] as PermitPackage[],
    };

interface AppState {
  projects: Project[]; clients: Client[]; members: CrewMember[]; crews: Crew[];
  equipment: Equipment[]; bids: Bid[]; safety: SafetyIncident[];
  documents: DocumentItem[]; budgetLines: BudgetLine[]; activity: ActivityItem[];
  draws: ProgressDraw[]; changeOrders: ChangeOrder[]; selections: SelectionItem[];
  dailyLogs: DailyLog[];
  subcontracts: Subcontract[]; payApplications: PayApplication[]; commercialMeta: CommercialMeta[];
  closeoutPackages: CloseoutPackage[]; realtyDeals: RealtyDeal[]; dualRolePolicy: DualRolePolicy;
  permitPackages: PermitPackage[];
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  addDailyLog: (log: Omit<DailyLog, "id">) => void;
  submitDraw: (id: string) => void;
  markDrawPaid: (id: string) => void;
  markDrawReady: (id: string) => void;
  holdDraw: (id: string, reason?: string) => void;
  releaseDraw: (id: string) => void;
  setChangeOrderStatus: (id: string, status: ChangeOrder["status"]) => void;
  addChangeOrder: (
    input: {
      projectId: string;
      title: string;
      amount: number;
      daysImpact?: number;
      description?: string;
      requestedBy?: string;
      /** default draft — use pending_owner to send to owner portal */
      status?: ChangeOrder["status"];
    },
  ) => void;
  setSelectionStatus: (id: string, status: SelectionItem["status"], choice?: string, actual?: number) => void;
  closeSafety: (id: string) => void;
  updateDocStatus: (id: string, status: DocumentItem["status"]) => void;
  assignEquipment: (id: string, projectId: string | undefined) => void;
  assignMember: (id: string, projectId: string | undefined) => void;
  assignCrew: (id: string, projectId: string | undefined) => void;
  setBidStatus: (id: string, status: BidStatus) => void;
  setEquipmentStatus: (id: string, status: Equipment["status"]) => void;
  addClient: (client: Omit<Client, "id">) => void;
  /** Issue or rotate portal access code and mark invited */
  inviteClientPortal: (clientId: string) => { token: string } | null;
  revokeClientPortal: (clientId: string) => void;
  markClientPortalLogin: (clientId: string) => void;
  addSafetyIncident: (incident: Omit<SafetyIncident, "id">) => void;
  setSubStatus: (id: string, status: SubStatus) => void;
  submitPayApp: (id: string) => void;
  certifyPayApp: (id: string) => void;
  markPayAppPaid: (id: string) => void;
  setCloseoutItemStatus: (packageId: string, key: string, status: CloseoutItemStatus) => void;
  setRealtyItemStatus: (dealId: string, key: string, status: RealtyItemStatus) => void;
  setRealtyDealStatus: (dealId: string, status: RealtyDealStatus) => void;
  acknowledgeDualCapacity: (dealId: string, by: string) => void;
  adjustPunch: (packageId: string, delta: -1 | 1) => void;
  ensurePermitPackage: (projectId: string) => void;
  setPermitItemStatus: (packageId: string, key: string, status: PermitStatus) => void;
  advancePermitItem: (packageId: string, key: string) => void;
  generatePermitDraft: (packageId: string, key: string) => void;
  /** Fill mock drafts + advance building permit, site plan, septic to approved; sync docs */
  mockFileCorePermits: (packageId: string) => void;
  updateBudgetLine: (
    id: string,
    patch: Partial<Pick<BudgetLine, "budgeted" | "committed" | "actual" | "costCodeId" | "category">>,
  ) => void;
  seedBudgetFromEstimate: (
    projectId: string,
    costs: CostInputs,
    assumptions: PricingAssumptions,
  ) => void;
  /** One-click seed from Book of Plans — returns new project id */
  startJobFromPlan: (opts: {
    planId: string;
    clientId?: string;
    clientName?: string;
    lotAddress?: string;
    elevation?: string;
    superintendent?: string;
  }) => string | null;
}

function createAppStore() {
  return create<AppState>((set, get) => ({
    ...initial,

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
      set((s) => {
        const draw = s.draws.find((d) => d.id === id);
        return {
          draws: s.draws.map((d) => (d.id === id ? { ...d, status: "submitted" as const } : d)),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: draw ? `Draw submitted · ${draw.name}` : "Draw submitted for payment",
            kind: "project",
          }),
        };
      }),

    markDrawPaid: (id) =>
      set((s) => {
        const draw = s.draws.find((d) => d.id === id);
        return {
          draws: s.draws.map((d) =>
            d.id === id ? { ...d, status: "paid" as const, paidDate: new Date().toISOString().slice(0, 10) } : d,
          ),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: draw ? `Draw paid · ${draw.name}` : "Draw marked paid",
            kind: "project",
          }),
        };
      }),

    markDrawReady: (id) =>
      set((s) => {
        const draw = s.draws.find((d) => d.id === id);
        return {
          draws: s.draws.map((d) => (d.id === id ? { ...d, status: "ready" as const } : d)),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: draw ? `Draw ready · ${draw.name} — trigger met` : "Draw marked ready",
            kind: "project",
          }),
        };
      }),

    holdDraw: (id) =>
      set((s) => {
        const draw = s.draws.find((d) => d.id === id);
        return {
          draws: s.draws.map((d) => (d.id === id ? { ...d, status: "held" as const } : d)),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: draw ? `Draw held · ${draw.name}` : "Draw held",
            kind: "project",
          }),
        };
      }),

    releaseDraw: (id) =>
      set((s) => {
        const draw = s.draws.find((d) => d.id === id);
        return {
          draws: s.draws.map((d) => (d.id === id ? { ...d, status: "ready" as const } : d)),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: draw ? `Draw released · ${draw.name}` : "Draw released to ready",
            kind: "project",
          }),
        };
      }),

    setChangeOrderStatus: (id, status) =>
      set((s) => {
        const co = s.changeOrders.find((c) => c.id === id);
        if (!co) return s;
        const today = new Date().toISOString().slice(0, 10);
        const docStatus =
          status === "approved"
            ? ("approved" as const)
            : status === "rejected"
              ? ("rejected" as const)
              : ("pending" as const);
        // Match CO docs by number prefix in title (e.g. "CO-003 …")
        const documents = s.documents.map((d) =>
          d.projectId === co.projectId &&
          d.type === "change_order" &&
          (d.title.startsWith(co.number) || d.title.includes(co.number))
            ? { ...d, status: docStatus, updatedAt: today }
            : d,
        );
        // Approved COs bump contract budget so portal money reflects the change
        const projects =
          status === "approved" && co.status !== "approved"
            ? s.projects.map((p) =>
                p.id === co.projectId ? { ...p, budget: p.budget + Math.max(0, co.amount) } : p,
              )
            : status === "rejected" && co.status === "approved"
              ? s.projects.map((p) =>
                  p.id === co.projectId
                    ? { ...p, budget: Math.max(0, p.budget - Math.max(0, co.amount)) }
                    : p,
                )
              : s.projects;
        const who =
          status === "approved"
            ? "owner approved"
            : status === "rejected"
              ? "owner declined"
              : status.replace(/_/g, " ");
        return {
          changeOrders: s.changeOrders.map((c) => (c.id === id ? { ...c, status } : c)),
          documents,
          projects,
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Change order ${co.number} ${who} · ${co.title}`,
            kind: "project",
          }),
        };
      }),

    addChangeOrder: (input) =>
      set((s) => {
        const title = clampText(input.title, 160);
        if (!title) return s;
        const project = s.projects.find((p) => p.id === input.projectId);
        if (!project) return s;
        const existing = s.changeOrders.filter((c) => c.projectId === input.projectId);
        const maxN = existing.reduce((m, c) => {
          const n = Number(String(c.number).replace(/\D/g, "")) || 0;
          return Math.max(m, n);
        }, 0);
        const number = `CO-${String(maxN + 1).padStart(3, "0")}`;
        const amount = Math.max(0, Math.min(5_000_000, Math.round(Number(input.amount) || 0)));
        const daysImpact = Math.max(0, Math.min(365, Math.round(Number(input.daysImpact) || 0)));
        const status = input.status ?? "draft";
        const today = new Date().toISOString().slice(0, 10);
        const co: ChangeOrder = {
          id: uid("co"),
          projectId: input.projectId,
          number,
          title,
          amount,
          daysImpact,
          status,
          requestedBy: clampText(input.requestedBy || project.superintendent || "Superintendent", 80),
          date: today,
          description: clampText(input.description || title, 500),
        };
        const doc: DocumentItem = {
          id: uid("doc"),
          title: `${number} ${title}`,
          type: "change_order",
          projectId: input.projectId,
          status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending",
          updatedAt: today,
          author: co.requestedBy,
          reference: number,
        };
        return {
          changeOrders: [co, ...s.changeOrders],
          documents: [doc, ...s.documents],
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text:
              status === "pending_owner"
                ? `Change order ${number} sent to owner portal · ${title}`
                : `Change order ${number} drafted · ${title}`,
            kind: "project",
          }),
        };
      }),

    setSelectionStatus: (id, status, choice, actual) =>
      set((s) => {
        const sel = s.selections.find((x) => x.id === id);
        return {
          selections: s.selections.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  ...(choice !== undefined ? { choice: clampText(choice, 200) } : {}),
                  ...(actual !== undefined ? { actual } : {}),
                }
              : item,
          ),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: sel
              ? `Selection ${status.replace(/_/g, " ")} · ${sel.category} (${sel.room})`
              : `Selection ${status.replace(/_/g, " ")}`,
            kind: "project",
          }),
        };
      }),

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

    assignMember: (id, projectId) =>
      set((s) => {
        const member = s.members.find((m) => m.id === id);
        const job = projectId ? s.projects.find((p) => p.id === projectId) : undefined;
        return {
          members: s.members.map((m) => (m.id === id ? { ...m, projectId } : m)),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: projectId
              ? `${member?.name ?? "Crew"} assigned to ${job?.name ?? "job"}`
              : `${member?.name ?? "Crew"} released to yard`,
            kind: "crew",
          }),
        };
      }),

    assignCrew: (id, projectId) =>
      set((s) => {
        const crew = s.crews.find((c) => c.id === id);
        const job = projectId ? s.projects.find((p) => p.id === projectId) : undefined;
        const memberIds = new Set(crew?.memberIds ?? []);
        return {
          crews: s.crews.map((c) => (c.id === id ? { ...c, projectId } : c)),
          members: s.members.map((m) =>
            memberIds.has(m.id) ? { ...m, projectId: projectId ?? undefined } : m,
          ),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: projectId
              ? `${crew?.name ?? "Crew"} staged on ${job?.name ?? "job"}`
              : `${crew?.name ?? "Crew"} unassigned`,
            kind: "crew",
          }),
        };
      }),

    setBidStatus: (id, status) =>
      set((s) => {
        const bid = s.bids.find((b) => b.id === id);
        return {
          bids: s.bids.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status,
                  submittedAt:
                    status === "submitted" && !b.submittedAt
                      ? new Date().toISOString().slice(0, 10)
                      : b.submittedAt,
                }
              : b,
          ),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Bid ${bid?.title ?? id} → ${status}`,
            kind: "bid",
          }),
        };
      }),

    setEquipmentStatus: (id, status) =>
      set((s) => ({
        equipment: s.equipment.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                projectId: status === "available" || status === "retired" || status === "maintenance" ? undefined : e.projectId,
              }
            : e,
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
            portalStatus: client.portalStatus ?? "none",
          },
          ...s.clients,
        ],
      })),

    inviteClientPortal: (clientId) => {
      let issued: string | null = null;
      set((s) => {
        const token = generatePortalToken();
        issued = token;
        const today = new Date().toISOString().slice(0, 10);
        return {
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  portalToken: token,
                  portalStatus: "invited" as const,
                  portalInvitedAt: today,
                }
              : c,
          ),
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Portal invite issued for ${s.clients.find((c) => c.id === clientId)?.name ?? clientId}`,
            kind: "project",
          }),
        };
      });
      return issued ? { token: issued } : null;
    },

    revokeClientPortal: (clientId) =>
      set((s) => ({
        clients: s.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                portalStatus: "revoked" as const,
                portalToken: undefined,
              }
            : c,
        ),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: `Portal access revoked for ${s.clients.find((c) => c.id === clientId)?.name ?? clientId}`,
          kind: "project",
        }),
      })),

    markClientPortalLogin: (clientId) =>
      set((s) => ({
        clients: s.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                portalStatus: "active" as const,
                portalLastLoginAt: new Date().toISOString().slice(0, 10),
              }
            : c,
        ),
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
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: `Closeout item ${status.replace(/_/g, " ")} · ${key.replace(/_/g, " ")}`,
          kind: "doc",
        }),
      })),

    adjustPunch: (packageId, delta) =>
      set((s) => ({
        closeoutPackages: s.closeoutPackages.map((pkg) => {
          if (pkg.id !== packageId) return pkg;
          const open = Math.max(0, pkg.punchOpen + delta);
          const closed =
            delta < 0
              ? pkg.punchClosed + Math.min(pkg.punchOpen, -delta)
              : Math.max(0, pkg.punchClosed - delta);
          return {
            ...pkg,
            punchOpen: open,
            punchClosed: closed,
            items: pkg.items.map((it) =>
              it.key === "punch_list"
                ? {
                    ...it,
                    status: open === 0 ? ("complete" as const) : ("in_progress" as const),
                    completedAt: open === 0 ? new Date().toISOString().slice(0, 10) : undefined,
                  }
                : it,
            ),
          };
        }),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: delta < 0 ? "Punch item closed" : "Punch item opened",
          kind: "project",
        }),
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

    ensurePermitPackage: (projectId) =>
      set((s) => {
        if (s.permitPackages.some((p) => p.projectId === projectId)) return s;
        const project = s.projects.find((p) => p.id === projectId);
        if (!project || project.type !== "residential") return s;
        return {
          permitPackages: [createPermitPackage(projectId, project.name), ...s.permitPackages],
        };
      }),

    setPermitItemStatus: (packageId, key, status) =>
      set((s) => ({
        permitPackages: s.permitPackages.map((pkg) => {
          if (pkg.id !== packageId) return pkg;
          const items = pkg.items.map((i) => (i.key === key ? { ...i, status } : i));
          return {
            ...pkg,
            items,
            status: computePermitPackageStatus(items),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }),
        activity: pushActivity(s.activity, {
          id: uid("a"),
          at: new Date().toISOString(),
          text: `Permit ${status.replace(/_/g, " ")} · ${key.replace(/_/g, " ")}`,
          kind: "doc",
        }),
      })),

    advancePermitItem: (packageId, key) =>
      set((s) => {
        const pkg = s.permitPackages.find((p) => p.id === packageId);
        const item = pkg?.items.find((i) => i.key === key);
        if (!item) return s;
        const next = advancePermitStatus(item.status);
        const items = pkg!.items.map((i) => (i.key === key ? { ...i, status: next } : i));
        const allApproved = items.every((i) => i.status === "approved");
        return {
          permitPackages: s.permitPackages.map((p) =>
            p.id !== packageId
              ? p
              : {
                  ...p,
                  items,
                  status: computePermitPackageStatus(items),
                  updatedAt: new Date().toISOString().slice(0, 10),
                },
          ),
          // When full package approved and job still permitting → move to in_progress
          projects:
            allApproved && pkg
              ? s.projects.map((pr) =>
                  pr.id === pkg.projectId && pr.status === "permitting"
                    ? { ...pr, status: "in_progress" as const }
                    : pr,
                )
              : s.projects,
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Permit advanced · ${item.label} → ${next.replace(/_/g, " ")}`,
            kind: "doc",
          }),
        };
      }),

    generatePermitDraft: (packageId, key) =>
      set((s) => ({
        permitPackages: s.permitPackages.map((pkg) => {
          if (pkg.id !== packageId) return pkg;
          const project = s.projects.find((p) => p.id === pkg.projectId);
          const client = s.clients.find((c) => c.id === project?.clientId);
          const ctx = project
            ? {
                project,
                client,
                parcelNote: project.address.includes("Teton")
                  ? "Teton Heights Division #6 — confirm lot on plat"
                  : undefined,
              }
            : undefined;
          const items = pkg.items.map((i) => {
            if (i.key !== key) return i;
            return {
              ...i,
              status: i.status === "not_started" || i.status === "denied" ? ("drafting" as const) : i.status,
              draftText: buildDraftForKey(i.key, project?.name ?? pkg.title, ctx),
            };
          });
          return {
            ...pkg,
            items,
            status: computePermitPackageStatus(items),
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }),
      })),

    mockFileCorePermits: (packageId) =>
      set((s) => {
        const pkg = s.permitPackages.find((p) => p.id === packageId);
        if (!pkg) return s;
        const project = s.projects.find((p) => p.id === pkg.projectId);
        if (!project) return s;
        const client = s.clients.find((c) => c.id === project.clientId);
        const ctx = {
          project,
          client,
          parcelNote: project.address.includes("Teton")
            ? "Teton Heights Division #6 — confirm lot on plat"
            : `${project.address} — Jefferson County`,
          today: new Date().toISOString().slice(0, 10),
        };
        const coreSet = new Set<string>(CORE_PERMIT_KEYS);
        const items = pkg.items.map((i) => {
          if (!coreSet.has(i.key)) return i;
          return {
            ...i,
            status: "approved" as const,
            draftText: buildDraftForKey(i.key, project.name, ctx),
            notes: `Mock filed ${ctx.today} · ref ${mockAgencyReference(i.key, project.id)}`,
          };
        });
        const today = ctx.today;
        // Upsert document rows for the three core permits
        let documents = [...s.documents];
        for (const key of CORE_PERMIT_KEYS) {
          const item = items.find((i) => i.key === key);
          if (!item) continue;
          const ref = mockAgencyReference(key, project.id);
          const existing = documents.find(
            (d) => d.projectId === project.id && d.type === "permit" && d.reference?.startsWith(ref.slice(0, 6)),
          );
          const title =
            key === "jc_building_permit"
              ? "Building permit — Jefferson County (mock filed)"
              : key === "jc_site_plan"
                ? "Site plan — Jefferson County (mock filed)"
                : "EIPH septic / wastewater (mock filed)";
          if (existing) {
            documents = documents.map((d) =>
              d.id === existing.id
                ? { ...d, status: "approved" as const, updatedAt: today, reference: ref, title }
                : d,
            );
          } else {
            documents = [
              {
                id: uid("doc"),
                title,
                type: "permit" as const,
                projectId: project.id,
                status: "approved" as const,
                updatedAt: today,
                author: project.superintendent,
                reference: ref,
              },
              ...documents,
            ];
          }
        }
        const allApproved = items.every((i) => i.status === "approved");
        return {
          permitPackages: s.permitPackages.map((p) =>
            p.id !== packageId
              ? p
              : {
                  ...p,
                  items,
                  status: computePermitPackageStatus(items),
                  updatedAt: today,
                },
          ),
          documents,
          projects:
            allApproved || project.status === "permitting" || project.status === "planning"
              ? s.projects.map((pr) =>
                  pr.id === project.id && (pr.status === "permitting" || pr.status === "planning")
                    ? { ...pr, status: "in_progress" as const, phase: pr.phase === "Site Work" ? pr.phase : pr.phase }
                    : pr,
                )
              : s.projects,
          activity: pushActivity(s.activity, {
            id: uid("a"),
            at: new Date().toISOString(),
            text: `Mock filed core permits · BP + site plan + EIPH septic · ${project.name}`,
            kind: "doc",
          }),
        };
      }),

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

    startJobFromPlan: (opts) => {
      const plan = plans.find((p) => p.id === opts.planId && p.active);
      if (!plan) return null;
      const built = buildJobFromPlan({
        plan,
        clientId: opts.clientId,
        clientName: opts.clientName,
        lotAddress: opts.lotAddress,
        elevation: opts.elevation,
        superintendent: opts.superintendent,
      });
      set((s) => ({
        projects: [built.project, ...s.projects],
        clients: built.client ? [built.client, ...s.clients] : s.clients,
        draws: [...built.draws, ...s.draws],
        selections: [...built.selections, ...s.selections],
        budgetLines: [...built.budgetLines, ...s.budgetLines],
        documents: [...built.documents, ...s.documents],
        closeoutPackages: [built.closeout, ...s.closeoutPackages],
        permitPackages: [createPermitPackage(built.project.id, built.project.name), ...s.permitPackages],
        activity: pushActivity(s.activity, built.activity),
      }));
      // silence unused get warning while keeping API stable
      void get;
      return built.project.id;
    },
  }));
}

export const useAppStore = createAppStore();
