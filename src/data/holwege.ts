/**
 * Holwege Lot 16 — system-of-record seed (SRC-2).
 *
 * Money figures are verified from contracts/Holwege/ only.
 * Land $98,000 (closed 8/24/2026 · Alliance 1100920 · deed 501245) is NOT in project.budget.
 *
 * Do not invent lot/build dollars. Do not email portal credentials to owners —
 * portalToken is for operator testing only (portalStatus: invited).
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

/** Verified construction contract stack — contracts/Holwege/03 + 05 */
export const HOLWEGE_COST_OF_WORK = 599_391.0;
export const HOLWEGE_OWNER_CONTINGENCY = 29_969.55;
export const HOLWEGE_PO = 59_939.1;
export const HOLWEGE_CONTRACT = 689_299.65;
/** Draws 1–5 base = cost + P&O (contingency not advanced) */
export const HOLWEGE_DRAW_BASE = 659_330.1;
/** Lot closed separately — never add to project.budget */
export const HOLWEGE_LAND_PAID = 98_000;
export const HOLWEGE_LAND_NOTE =
  "Land $98,000 closed 8/24/2026 Alliance 1100920 · deed 501245 (Rigby 106 LLC / separate lot sale). NOT in construction contract or project.budget.";

export const HOLWEGE_CLIENT_ID = "c-holwege";
export const HOLWEGE_PROJECT_ID = "p-holwege";
export const HOLWEGE_PORTAL_TOKEN = "HOLW2026";

export const holwegeClient: Client = {
  id: HOLWEGE_CLIENT_ID,
  name: "Lauren & Cindy Holwege",
  email: "holwegefam@comcast.net",
  phone: "",
  type: "homeowner",
  address: "Lot 16 Block 8, Teton Heights Div 6, Jefferson County, ID",
  notes: `${HOLWEGE_LAND_NOTE} Owners: Lauren Holwege and Cindy Holwege. Portal invite for operator testing only — do not send credentials to owners until ready.`,
  portalToken: HOLWEGE_PORTAL_TOKEN,
  portalStatus: "invited",
  portalInvitedAt: "2026-09-10",
};

export const holwegeProject: Project = {
  id: HOLWEGE_PROJECT_ID,
  name: "Holwege Residence — Lot 16",
  address: "Lot 16 Block 8, Teton Heights Div 6, Rigby ID",
  clientId: HOLWEGE_CLIENT_ID,
  type: "residential",
  status: "planning",
  phase: "Site Work",
  progress: 0,
  budget: HOLWEGE_CONTRACT,
  spent: 0,
  startDate: "2026-09-15",
  endDate: "2027-06-30",
  superintendent: "Kyle Christensen",
  sqft: 2602,
  beds: 3,
  baths: 2,
  description:
    "Custom ADA one-level on crawl (~2602 sf), well + septic + 3-car. River Bend Drafting — Lauren and Cindy Holwege 8-31-2026b (Elise Shurtliff). GC: Split Rock Construction LLC · Idaho 6481622 · Kipp Archibald. Field supervisor Kyle Christensen is not a contract party. Pre-contract: awaiting signed construction agreement, Idaho 45-525 disclosures, and dual-capacity acknowledgment. Land closed separately — not in budget.",
  milestones: [
    { name: "Lot closed (deed 501245)", date: "2026-08-24", done: true },
    { name: "Plans issued (River Bend 8-31-2026b)", date: "2026-08-31", done: true },
    { name: "Construction agreement signed", date: "2026-09-15", done: false },
    { name: "Idaho 45-525 initial disclosure signed", date: "2026-09-15", done: false },
    { name: "Dual-capacity disclosure acknowledged", date: "2026-09-15", done: false },
    { name: "Permit / mobilization (Draw 1)", date: "2026-10-01", done: false },
    { name: "Certificate of occupancy", date: "2027-06-30", done: false },
  ],
  schedule: [
    { phase: "Site Work", start: "2026-09-15", end: "2026-10-15", pct: 0 },
    { phase: "Foundation", start: "2026-10-16", end: "2026-11-30", pct: 0 },
    { phase: "Framing", start: "2026-12-01", end: "2027-02-15", pct: 0 },
    { phase: "MEP Rough-In", start: "2027-02-16", end: "2027-03-31", pct: 0 },
    { phase: "Insulation", start: "2027-03-20", end: "2027-04-10", pct: 0 },
    { phase: "Interior Finishes", start: "2027-04-11", end: "2027-06-15", pct: 0 },
    { phase: "Final Walkthrough", start: "2027-06-16", end: "2027-06-30", pct: 0 },
  ],
};

/**
 * Draw schedule from contracts/Holwege/03_Construction_Agreement.md §4.
 * Draws 1–5 % of draw base $659,330.10. Contingency not advanced in 1–5.
 * Draw 1 = ready so command center surfaces money attention; none paid yet.
 */
export const holwegeDraws: ProgressDraw[] = [
  {
    id: "pd-holwege-1",
    projectId: HOLWEGE_PROJECT_ID,
    name: "Agreement + permit + mobilization",
    pct: 0.1,
    amount: 65_933.01,
    status: "ready",
    dueDate: "2026-09-20",
    trigger: "Signed agreement + permit + mobilization (10% of draw base $659,330.10)",
  },
  {
    id: "pd-holwege-2",
    projectId: HOLWEGE_PROJECT_ID,
    name: "Foundation complete",
    pct: 0.1,
    amount: 65_933.01,
    status: "upcoming",
    trigger: "Foundation complete (10% of draw base)",
  },
  {
    id: "pd-holwege-3",
    projectId: HOLWEGE_PROJECT_ID,
    name: "Dried-in",
    pct: 0.2,
    amount: 131_866.02,
    status: "upcoming",
    trigger: "Dried-in / weather-tight (20% of draw base)",
  },
  {
    id: "pd-holwege-4",
    projectId: HOLWEGE_PROJECT_ID,
    name: "MEP rough + insulation",
    pct: 0.2,
    amount: 131_866.02,
    status: "upcoming",
    trigger: "MEP rough + insulation (20% of draw base)",
  },
  {
    id: "pd-holwege-5",
    projectId: HOLWEGE_PROJECT_ID,
    name: "Finishes substantial",
    pct: 0.35,
    amount: 230_765.54,
    status: "upcoming",
    trigger: "Finishes substantial (35% of draw base)",
  },
  {
    id: "pd-holwege-6",
    projectId: HOLWEGE_PROJECT_ID,
    name: "CO + punch + waivers + §45-525(3) + unused contingency credit",
    pct: 0.05,
    amount: 32_966.5,
    status: "upcoming",
    trigger:
      "CO + punch + lien waivers + Idaho §45-525(3) completion disclosure. Amount at least $32,966.50 retainage-style closeout of draw base; credit unused owner contingency ($29,969.55 reserve) on this draw — do not invent the credit until closeout.",
  },
];

export const holwegeDocuments: DocumentItem[] = [
  {
    id: "doc-holwege-contract",
    title: "Construction Agreement — Holwege Lot 16",
    type: "contract",
    projectId: HOLWEGE_PROJECT_ID,
    status: "pending",
    updatedAt: "2026-09-10",
    author: "Kipp Archibald",
    reference: "contracts/Holwege/03_Construction_Agreement.md",
    dueDate: "2026-09-20",
  },
  {
    id: "doc-holwege-45525-initial",
    title: "Idaho 45-525 Initial Disclosure",
    type: "contract",
    projectId: HOLWEGE_PROJECT_ID,
    status: "pending",
    updatedAt: "2026-09-10",
    author: "Kipp Archibald",
    reference: "contracts/Holwege/01_Initial_Disclosure_45-525.md",
    dueDate: "2026-09-20",
  },
  {
    id: "doc-holwege-dual-capacity",
    title: "Dual-capacity disclosure (builder + licensee)",
    type: "contract",
    projectId: HOLWEGE_PROJECT_ID,
    status: "pending",
    updatedAt: "2026-09-10",
    author: "Kipp Archibald",
    reference: "Agreement §13 / Archibald-Bagley lot representation (closed)",
    dueDate: "2026-09-20",
  },
  {
    id: "doc-holwege-45525-completion",
    title: "Idaho 45-525 Completion Disclosure (subcontractors) — stub",
    type: "contract",
    projectId: HOLWEGE_PROJECT_ID,
    status: "pending",
    updatedAt: "2026-09-10",
    author: "Kipp Archibald",
    reference: "contracts/Holwege/02_Completion_Disclosure_Subcontractors_45-525.md",
  },
  {
    id: "doc-holwege-exhibit-b",
    title: "Cost breakdown Exhibit B",
    type: "contract",
    projectId: HOLWEGE_PROJECT_ID,
    status: "approved",
    updatedAt: "2026-09-04",
    author: "Kipp Archibald",
    reference: "contracts/Holwege/05_Cost_Breakdown_and_Contingency.md",
  },
  {
    id: "doc-holwege-plans",
    title: "River Bend plans — Lauren and Cindy Holwege 8-31-2026b",
    type: "drawing",
    projectId: HOLWEGE_PROJECT_ID,
    status: "approved",
    updatedAt: "2026-08-31",
    author: "Elise Shurtliff / River Bend Drafting",
  },
];

export const holwegeBudgetLines: BudgetLine[] = [
  {
    id: "bl-holwege-cow",
    projectId: HOLWEGE_PROJECT_ID,
    costCodeId: "01-SUB",
    category: "Cost of work",
    budgeted: HOLWEGE_COST_OF_WORK,
    committed: 0,
    actual: 0,
  },
  {
    id: "bl-holwege-cont",
    projectId: HOLWEGE_PROJECT_ID,
    costCodeId: "01-CONT",
    category: "Owner contingency (5%)",
    budgeted: HOLWEGE_OWNER_CONTINGENCY,
    committed: 0,
    actual: 0,
  },
  {
    id: "bl-holwege-po",
    projectId: HOLWEGE_PROJECT_ID,
    costCodeId: "01-OHP",
    category: "Split Rock P&O (10% of cost)",
    budgeted: HOLWEGE_PO,
    committed: 0,
    actual: 0,
  },
];

export const holwegeCloseout: CloseoutPackage = {
  id: "co-holwege",
  projectId: HOLWEGE_PROJECT_ID,
  punchOpen: 0,
  punchClosed: 0,
  notes:
    "Pre-contract skeleton. Final draw credits unused contingency; §45-525(3) completion disclosure required at closeout.",
  items: [
    {
      key: "substantial_completion",
      label: "Substantial completion certificate (G704-style)",
      status: "not_started",
      owner: "Kyle Christensen",
    },
    {
      key: "punch_list",
      label: "Punch list tracked to zero",
      status: "not_started",
      owner: "Kyle Christensen",
    },
    {
      key: "certificate_of_occupancy",
      label: "Certificate of occupancy",
      status: "not_started",
      owner: "Jefferson County",
    },
    {
      key: "final_pay_app",
      label: "Final pay application / Draw 6 + unused contingency credit",
      status: "not_started",
      owner: "Kipp Archibald",
      notes: "Draw 6 ≥ $32,966.50 + unused reserve credit per agreement §4.",
    },
    {
      key: "lien_waivers",
      label: "Final lien waivers (GC + subs)",
      status: "not_started",
      owner: "Kipp Archibald",
    },
    {
      key: "as_builts",
      label: "As-builts / O&M manuals",
      status: "not_started",
      owner: "Kyle Christensen",
    },
    {
      key: "warranty_packet",
      label: "Warranty packet delivered",
      status: "not_started",
      owner: "Kipp Archibald",
    },
    {
      key: "keys_codes",
      label: "Keys, codes, remotes",
      status: "not_started",
      owner: "Kyle Christensen",
    },
    {
      key: "surety_consent",
      label: "Surety consent to final payment",
      status: "waived",
      owner: "—",
      notes: "Not bonded residential job.",
    },
    {
      key: "final_cleaning",
      label: "Final cleaning",
      status: "not_started",
      owner: "Crew",
    },
  ],
};

/** Lot closed; construction pending — dual-capacity still needs owner initials on agreement §13 */
export const holwegeRealtyDeal: RealtyDeal = {
  id: "rd-holwege",
  projectId: HOLWEGE_PROJECT_ID,
  status: "exploring",
  agencyRole: "dual_agency",
  dualCapacity: "pending_disclosure",
  brokerage: "Archibald-Bagley Real Estate (lot representation finished — not a party to construction)",
  agentName: "Kipp Archibald",
  salePrice: HOLWEGE_LAND_PAID,
  underContractDate: "2026-08-24",
  closingDate: "2026-08-24",
  earnestHeldBy: "— (lot closed; no open earnest on construction)",
  trustAccountNote:
    "Lot purchase closed 8/24/2026. Construction draws go to Split Rock Construction LLC operating path only — never brokerage trust.",
  notes:
    "Lot closed via Alliance 1100920 / deed 501245 for $98,000 (paid). Construction agreement pending signatures. Dual-capacity (builder + licensee who represented owners on the closed lot) must be initialed on Agreement §13 before advancing.",
  items: [
    {
      key: "agency_election",
      label: "Agency election signed",
      status: "complete",
      systemOfRecord: "Lot file / Archibald-Bagley",
      completedAt: "2026-08-24",
      notes: "Lot brokerage relationship finished at closing.",
    },
    {
      key: "dual_capacity_disclosure",
      label: "Dual-capacity disclosure (builder + licensee)",
      status: "in_progress",
      systemOfRecord: "Construction Agreement §13",
      notes: "Pending owner initials (Lauren + Cindy) on construction agreement.",
    },
    {
      key: "listing_or_buyer_agreement",
      label: "Listing / buyer representation agreement",
      status: "n_a",
      systemOfRecord: "—",
      notes: "Lot closed; no active listing for construction phase.",
    },
    {
      key: "purchase_sale_agreement",
      label: "Purchase & sale agreement (lot)",
      status: "complete",
      systemOfRecord: "Title / Alliance 1100920",
      completedAt: "2026-08-24",
    },
    {
      key: "new_construction_addendum",
      label: "New-construction addendum",
      status: "n_a",
      systemOfRecord: "—",
      notes: "Construction Agreement + Exhibits govern; not a resale P&S.",
    },
    {
      key: "seller_builder_disclosure",
      label: "Seller / builder property disclosure",
      status: "n_a",
      systemOfRecord: "—",
    },
    {
      key: "earnest_money_trust",
      label: "Earnest money in brokerage trust",
      status: "n_a",
      systemOfRecord: "—",
      notes: "Lot closed; construction payments are draws to GC.",
    },
    {
      key: "financing_contingency",
      label: "Financing contingency cleared",
      status: "n_a",
      systemOfRecord: "—",
    },
    {
      key: "inspection_walkthrough",
      label: "Buyer walkthrough / inspection",
      status: "n_a",
      systemOfRecord: "—",
    },
    {
      key: "title_commitment",
      label: "Title commitment reviewed",
      status: "complete",
      systemOfRecord: "Title co.",
      completedAt: "2026-08-24",
    },
    {
      key: "closing_disclosure_review",
      label: "Closing disclosure reviewed",
      status: "complete",
      systemOfRecord: "Title / Alliance",
      completedAt: "2026-08-24",
    },
    {
      key: "deed_recorded",
      label: "Deed recorded / keys at closing",
      status: "complete",
      systemOfRecord: "Deed Instrument No. 501245",
      completedAt: "2026-08-24",
    },
  ],
};

export const holwegeActivity: ActivityItem[] = [
  {
    id: "a-holwege-seed",
    at: "2026-09-10T12:00:00",
    text: "Holwege Lot 16 seeded as system of record — awaiting construction agreement, 45-525, and dual-capacity signatures",
    kind: "project",
  },
  {
    id: "a-holwege-land",
    at: "2026-08-24T16:00:00",
    text: "Holwege lot closed ($98,000 paid · deed 501245) — land excluded from construction budget",
    kind: "doc",
  },
];

/** Starter log so phone daily-log path has a project target */
export const holwegeDailyLog: DailyLog = {
  id: "dl-holwege-1",
  projectId: HOLWEGE_PROJECT_ID,
  date: "2026-09-10",
  weather: "clear",
  crewCount: 0,
  hours: 0,
  workDone:
    "Pre-construction — SOR seed. Site not mobilized. Awaiting signed agreement + disclosures before ground break.",
  blockers: "Contract + Idaho 45-525 + dual-capacity initials pending.",
  author: "Kyle Christensen",
};

export const holwegeBid: Bid = {
  id: "b-holwege",
  title: "Holwege Residence — Lot 16 Construction",
  clientId: HOLWEGE_CLIENT_ID,
  type: "residential",
  status: "won",
  amount: HOLWEGE_CONTRACT,
  submittedAt: "2026-09-04",
  dueDate: "2026-09-20",
  projectId: HOLWEGE_PROJECT_ID,
  notes:
    "Verified stack from contracts/Holwege: cost $599,391 + contingency $29,969.55 + P&O $59,939.10 = $689,299.65. Land $98k excluded.",
  lineItems: [
    { label: "Cost of work", amount: HOLWEGE_COST_OF_WORK },
    { label: "Owner contingency (5%)", amount: HOLWEGE_OWNER_CONTINGENCY },
    { label: "Split Rock P&O (10% of cost)", amount: HOLWEGE_PO },
  ],
};

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
    return { seeded: false, reason: "demo mode — Holwege already in seed arrays" };
  }

  const s = appStore.getState();
  const hasProject =
    s.projects.some((p) => p.id === HOLWEGE_PROJECT_ID) ||
    s.projects.some((p) => /holwege/i.test(p.name));
  const hasClient = s.clients.some((c) => c.id === HOLWEGE_CLIENT_ID);
  const hasRealty = s.realtyDeals.some((d) => d.projectId === HOLWEGE_PROJECT_ID);
  const hasDraws = s.draws.some((d) => d.projectId === HOLWEGE_PROJECT_ID);

  if (hasProject && hasClient && hasRealty && hasDraws) {
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
    // Full store slice at runtime (caller passes useAppStore); cast for OpsSnapshot pick
    saveOpsSnapshot(pickOpsSlice(next as Parameters<typeof pickOpsSlice>[0]));
  } catch {
    /* localStorage may be unavailable in SSR */
  }

  return { seeded: true, reason: "Holwege package merged into live store" };
}
