/**
 * Empty operational datasets for live publish (VITE_SPLIT_ROCK_DEMO=false).
 * Keep dual-role policy text — compliance guidance is not demo fluff.
 */
import type {
  ActivityItem,
  Bid,
  BudgetLine,
  ChangeOrder,
  Client,
  CloseoutPackage,
  CommercialMeta,
  Crew,
  CrewMember,
  DailyLog,
  DocumentItem,
  DualRolePolicy,
  Equipment,
  PayApplication,
  ProgressDraw,
  Project,
  RealtyDeal,
  SafetyIncident,
  SelectionItem,
  Subcontract,
} from "./types";
import { COMPANY } from "@/lib/company";

export const liveDualRolePolicy: DualRolePolicy = {
  builderEntity: COMPANY.legalName,
  brokerage: "Under broker supervision — use approved brokerage forms only",
  licenseNote:
    "Construction contract work and real estate brokerage are separate duties, licenses, and money paths.",
  rules: [
    "Never substitute a purchase agreement or walkthrough for substantial completion / CO / lien-waiver closeout.",
    "Disclose dual capacity (builder + licensee) in writing before substantive negotiation.",
    "Keep earnest money and other trust funds in the brokerage trust account — never in construction operating or draw accounts.",
    "Execute official Idaho REALTORS® / brokerage forms in the approved e-sign system; Split Rock tracks status and attachments only.",
    "Use a new-construction addendum covering completion date, allowances, warranty, punch, and CO contingency.",
    "Align builder warranty language with the purchase contract so post-closing punch is unambiguous.",
    "On buyer-rep + builder-seller deals, consider separate buyer representation when conflicts are material.",
    "Advertise with correct brokerage identification; do not imply neutral advocacy when acting as builder-seller.",
    "Confirm GL, builders risk, completed ops, and real estate E&O all cover dual-role scenarios.",
    "This app provides operational checklists — not legal advice or licensed form substitutes.",
  ],
};

export const liveEmpty = {
  projects: [] as Project[],
  clients: [] as Client[],
  members: [] as CrewMember[],
  crews: [] as Crew[],
  equipment: [] as Equipment[],
  bids: [] as Bid[],
  safety: [] as SafetyIncident[],
  documents: [] as DocumentItem[],
  budgetLines: [] as BudgetLine[],
  activity: [] as ActivityItem[],
  draws: [] as ProgressDraw[],
  changeOrders: [] as ChangeOrder[],
  selections: [] as SelectionItem[],
  dailyLogs: [] as DailyLog[],
  subcontracts: [] as Subcontract[],
  payApplications: [] as PayApplication[],
  commercialMeta: [] as CommercialMeta[],
  closeoutPackages: [] as CloseoutPackage[],
  realtyDeals: [] as RealtyDeal[],
  dualRolePolicy: liveDualRolePolicy,
};
