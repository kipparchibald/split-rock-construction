import type {
  ActivityItem,
  Bid,
  DailyLog,
  RealtyDeal,
} from "./types";
import {
  HOLWEGE_CLIENT_ID,
  HOLWEGE_CONTRACT,
  HOLWEGE_COST_OF_WORK,
  HOLWEGE_LAND_PAID,
  HOLWEGE_OWNER_CONTINGENCY,
  HOLWEGE_PO,
  HOLWEGE_PROJECT_ID,
} from "./holwege-money";

export const holwegeRealtyDeal: RealtyDeal = {
  id: "rd-holwege",
  projectId: HOLWEGE_PROJECT_ID,
  status: "exploring",
  agencyRole: "dual_agency",
  dualCapacity: "pending_disclosure",
  brokerage: "Archibald-Bagley Real Estate (lot representation finished - not a party to construction)",
  agentName: "Kipp Archibald",
  salePrice: HOLWEGE_LAND_PAID,
  underContractDate: "2026-08-24",
  closingDate: "2026-08-24",
  earnestHeldBy: "- (lot closed; no open earnest on construction)",
  trustAccountNote:
    "Lot purchase closed 8/24/2026. Construction draws go to Split Rock Construction LLC operating path only - never brokerage trust.",
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
      systemOfRecord: "-",
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
      systemOfRecord: "-",
      notes: "Construction Agreement + Exhibits govern; not a resale P&S.",
    },
    {
      key: "seller_builder_disclosure",
      label: "Seller / builder property disclosure",
      status: "n_a",
      systemOfRecord: "-",
    },
    {
      key: "earnest_money_trust",
      label: "Earnest money in brokerage trust",
      status: "n_a",
      systemOfRecord: "-",
      notes: "Lot closed; construction payments are draws to GC.",
    },
    {
      key: "financing_contingency",
      label: "Financing contingency cleared",
      status: "n_a",
      systemOfRecord: "-",
    },
    {
      key: "inspection_walkthrough",
      label: "Buyer walkthrough / inspection",
      status: "n_a",
      systemOfRecord: "-",
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
    text: "Holwege Lot 16 seeded as system of record - awaiting construction agreement, 45-525, and dual-capacity signatures",
    kind: "project",
  },
  {
    id: "a-holwege-land",
    at: "2026-08-24T16:00:00",
    text: "Holwege lot closed ($98,000 paid · deed 501245) - land excluded from construction budget",
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
    "Pre-construction - SOR seed. Site not mobilized. Awaiting signed agreement + disclosures before ground break.",
  blockers: "Contract + Idaho 45-525 + dual-capacity initials pending.",
  author: "Kyle Christensen",
};

export const holwegeBid: Bid = {
  id: "b-holwege",
  title: "Holwege Residence - Lot 16 Construction",
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
