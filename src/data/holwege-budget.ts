import type {
  BudgetLine,
  CloseoutPackage,
} from "./types";
import {
  HOLWEGE_COST_OF_WORK,
  HOLWEGE_OWNER_CONTINGENCY,
  HOLWEGE_PO,
  HOLWEGE_PROJECT_ID,
} from "./holwege-money";

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
      owner: "-",
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
