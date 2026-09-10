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
