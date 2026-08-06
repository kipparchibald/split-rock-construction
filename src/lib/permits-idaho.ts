import type { Client, PermitChecklistItem, PermitPackage, PermitStatus, Project } from "@/data/types";
import { COMPANY } from "@/lib/company";

/** Core permits for a Teton Heights / rural Jefferson County residential mock filing */
export const CORE_PERMIT_KEYS = ["jc_building_permit", "jc_site_plan", "eiph_septic"] as const;
export type CorePermitKey = (typeof CORE_PERMIT_KEYS)[number];

export function isCorePermitKey(key: string): key is CorePermitKey {
  return (CORE_PERMIT_KEYS as readonly string[]).includes(key);
}

export interface PermitDraftContext {
  project: Pick<
    Project,
    "name" | "address" | "superintendent" | "sqft" | "beds" | "baths" | "budget" | "description"
  >;
  client?: Pick<Client, "name" | "email" | "phone" | "address">;
  parcelNote?: string;
  today?: string;
}

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function todayIso(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/** Jefferson County Building Department + Eastern Idaho Public Health (District 7) starter package */
export function buildResidentialPermitChecklist(projectName: string): PermitChecklistItem[] {
  return [
    {
      key: "jc_building_permit",
      label: "Jefferson County building permit application",
      authority: "jefferson_county",
      status: "drafting",
      formCode: "JC-BP",
      notes: "Rigby / Jefferson County — residential new construction",
      draftText: draftJcBuildingPermit(projectName),
    },
    {
      key: "jc_site_plan",
      label: "Site plan / plot plan",
      authority: "jefferson_county",
      status: "not_started",
      formCode: "JC-SP",
      draftText: draftJcSitePlan(projectName),
    },
    {
      key: "jc_energy",
      label: "Energy code compliance (prescriptive or performance)",
      authority: "jefferson_county",
      status: "not_started",
      formCode: "JC-IECC",
      draftText: draftJcEnergy(projectName),
    },
    {
      key: "eiph_septic",
      label: "EIPH septic / wastewater permit (if applicable)",
      authority: "eiph",
      status: "not_started",
      formCode: "EIPH-WW",
      notes: "Eastern Idaho Public Health District 7",
      draftText: draftEiphSeptic(projectName),
    },
    {
      key: "eiph_well",
      label: "EIPH well / water system sign-off (if private well)",
      authority: "eiph",
      status: "not_started",
      formCode: "EIPH-WELL",
      draftText: draftEiphWell(projectName),
    },
    {
      key: "utility_power",
      label: "Utility — electrical service application",
      authority: "utility",
      status: "not_started",
      draftText: draftUtility(projectName, "electrical"),
    },
    {
      key: "utility_gas",
      label: "Utility — gas service (if applicable)",
      authority: "utility",
      status: "not_started",
      draftText: draftUtility(projectName, "gas"),
    },
  ];
}

export function draftJcBuildingPermit(projectName: string, ctx?: PermitDraftContext): string {
  const p = ctx?.project;
  const c = ctx?.client;
  const day = ctx?.today ?? todayIso();
  return [
    `JEFFERSON COUNTY BUILDING PERMIT — ${ctx ? "MOCK FILLED" : "DRAFT"}`,
    `Generated for operational preparation. Verify current forms at the Jefferson County Building Department before submission.`,
    ``,
    `Project / job name: ${p?.name ?? projectName}`,
    `Jurisdiction: Jefferson County, Idaho`,
    `Occupancy: R-3 (one/two family) — confirm with plans`,
    `Draft date: ${day}`,
    ``,
    `Owner / applicant: ${c?.name ?? "________________________________"}`,
    `Mailing address: ${c?.address ?? "_________________________________"}`,
    `Phone / email: ${c ? `${c.phone} / ${c.email}` : "___________________________________"}`,
    ``,
    `Site address / parcel: ${p?.address ?? "_____________________________"}`,
    `Legal description: ${ctx?.parcelNote ?? "Teton Heights / Jefferson County — confirm plat lot"}`,
    ``,
    `Contractor: ${COMPANY.legalName}`,
    `Idaho contractor license #: [on file — DOPL Class A/B]`,
    `Contact superintendent: ${p?.superintendent ?? "___________________________"}`,
    ``,
    `Valuation (contract / estimate): ${p ? money(p.budget) : "$_________________"}`,
    `Heated sq ft: ${p?.sqft ?? "______"}  Unheated / garage: ______`,
    `Stories: 1  Bedrooms: ${p?.beds ?? "______"}  Baths: ${p?.baths ?? "______"}`,
    ``,
    `Foundation type: concrete basement  Roof covering: architectural shingle`,
    `Heating system: high-efficiency gas furnace  Water heater: tankless gas`,
    ``,
    `Scope note: ${p?.description?.slice(0, 160) ?? "New single-family residence"}`,
    ``,
    `Attachments checklist:`,
    `[x] Site plan  [x] Floor plans  [x] Elevations`,
    `[ ] Structural / engineering (if required)`,
    `[ ] Energy compliance worksheet`,
    `[x] Septic approval (EIPH) if not on sewer — filed in parallel`,
    ``,
    `Applicant signature: ${c?.name ?? "________________"}  Date: ${day}`,
    ``,
    ctx
      ? `MOCK FILING — fields filled from job record for demo. Not a filed permit.`
      : `AI DRAFT ONLY — Review all fields, local amendments, and fee schedule before filing.`,
  ].join("\n");
}

export function draftJcSitePlan(projectName: string, ctx?: PermitDraftContext): string {
  const p = ctx?.project;
  const day = ctx?.today ?? todayIso();
  const isTeton = /teton|rigby|river bend|crestview|cole/i.test(
    `${p?.name ?? ""} ${p?.address ?? ""} ${projectName}`,
  );
  return [
    `JEFFERSON COUNTY SITE / PLOT PLAN — ${ctx ? "MOCK FILLED" : "DRAFT"}`,
    `Project: ${p?.name ?? projectName}`,
    `Site address: ${p?.address ?? "—"}`,
    `Date: ${day}`,
    ``,
    isTeton
      ? `GIS / improvement plan: Teton Heights Div. #6 aerial overlay (Esri imagery + lot lines, setbacks, septic, well, utilities).`
      : `GIS: reference Jefferson County parcel map for boundaries.`,
    `County GIS portal: https://gisportal.co.jefferson.id.us/portweb/home/`,
    ``,
    `Show to scale:`,
    `[x] Property lines & dimensions (0.6+ acre typical Teton Heights)`,
    `[x] Building footprint & setbacks (front / side / rear per county)`,
    `[x] Driveway / access to paved road`,
    `[x] Well location (if private) — pre-approved well site`,
    `[x] Septic tank & drainfield (if private) — EIPH design`,
    `[x] Utility routes (power, gas, fiber to lot line)`,
    `[x] North arrow & scale`,
    `[x] Aerial basemap underlay (site plan GIS tab)`,
    ``,
    `Notes: Basement practical — no high groundwater on these lots. Flat, buildable parcel.`,
    isTeton
      ? `Improvement plan layers: ROW (Teton Heights Way), utility easements, drainage corridor, spot grades.`
      : ``,
    ``,
    ctx
      ? `MOCK FILING — site plan worksheet + GIS overlay. Attach surveyor drawing for real submittal.`
      : `AI DRAFT ONLY — Use surveyor / designer drawings for submittal.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function draftJcEnergy(projectName: string, ctx?: PermitDraftContext): string {
  const p = ctx?.project;
  return [
    `ENERGY CODE COMPLIANCE WORKSHEET — DRAFT (IECC / local amendments)`,
    `Project: ${p?.name ?? projectName}`,
    ``,
    `Path: □ Prescriptive  □ Performance / REScheck`,
    `Climate zone: 6 (confirm)`,
    `Heated area: ${p?.sqft ?? "______"} sf`,
    ``,
    `Wall insulation: R-21  Ceiling: R-49  Floor / slab: R-10 edge`,
    `Window U-factor: 0.30  SHGC: 0.40`,
    `Air sealing / blower door target: 3 ACH50`,
    `HVAC efficiency: 95% AFUE  Water heater: 0.95 UEF`,
    ``,
    `AI DRAFT ONLY — Attach manufacturer specs and REScheck if used.`,
  ].join("\n");
}

export function draftEiphSeptic(projectName: string, ctx?: PermitDraftContext): string {
  const p = ctx?.project;
  const c = ctx?.client;
  const day = ctx?.today ?? todayIso();
  return [
    `EASTERN IDAHO PUBLIC HEALTH (DISTRICT 7) — WASTEWATER / SEPTIC ${ctx ? "MOCK FILLED" : "DRAFT"}`,
    `Project: ${p?.name ?? projectName}`,
    `County: Jefferson`,
    `Date: ${day}`,
    ``,
    `Property owner: ${c?.name ?? "___________________________________"}`,
    `Site address: ${p?.address ?? "____________________________________"}`,
    `Parcel / tax ID: ${ctx?.parcelNote ?? "_________________________________"}`,
    ``,
    `System type: ☑ New  □ Repair  □ Expansion`,
    `Bedrooms (design): ${p?.beds ?? "______"}  Soil test date: ${day}`,
    `Installer (licensed): [preferred installer — confirm]`,
    ``,
    `Water source: □ Public  ☑ Private well`,
    `Well log / EIPH well file #: [pending well log]`,
    ``,
    `Design notes: Standard residential system sized for ${p?.beds ?? 3}-bedroom ranch + basement.`,
    `Setbacks from well, property lines, and foundation per EIPH District 7.`,
    `See site plan aerial overlay for tank / drainfield envelope on lot.`,
    ``,
    `Notes for health officer: Rural lot, no municipal sewer. Pre-approved well site on plat.`,
    ``,
    ctx
      ? `MOCK FILING — filled from job/client for demo. Use current EIPH forms for real filing.`
      : `AI DRAFT ONLY — Confirm current EIPH District 7 forms and fees before submission.`,
  ].join("\n");
}

export function draftEiphWell(projectName: string, ctx?: PermitDraftContext): string {
  const p = ctx?.project;
  return [
    `EIPH / IDWR WELL & WATER SYSTEM — DRAFT NOTES`,
    `Project: ${p?.name ?? projectName}`,
    `Site: ${p?.address ?? "—"}`,
    ``,
    `Well log #: ________  Driller: ________`,
    `Depth: ______  Yield (gpm): ______  Casing: ______`,
    `Separation from septic: ______ ft (confirm setbacks)`,
    `Pressure tank / treatment: ________________________`,
    ``,
    `AI DRAFT ONLY — Coordinate with well driller and EIPH District 7.`,
  ].join("\n");
}

export function draftUtility(projectName: string, kind: "electrical" | "gas", ctx?: PermitDraftContext): string {
  const p = ctx?.project;
  return [
    `UTILITY SERVICE APPLICATION — ${kind.toUpperCase()} — DRAFT`,
    `Project: ${p?.name ?? projectName}`,
    ``,
    `Service address: ${p?.address ?? "_________________________________"}`,
    `Account / customer: ${ctx?.client?.name ?? "_______________________________"}`,
    `Load / meter size: ________________________________`,
    `Requested connect date: ___________________________`,
    ``,
    `AI DRAFT ONLY — Use the serving utility’s current form.`,
  ].join("\n");
}

/** Rebuild draft text for an item using job context (mock-filled when ctx provided). */
export function buildDraftForKey(key: string, projectName: string, ctx?: PermitDraftContext): string {
  switch (key) {
    case "jc_building_permit":
      return draftJcBuildingPermit(projectName, ctx);
    case "jc_site_plan":
      return draftJcSitePlan(projectName, ctx);
    case "jc_energy":
      return draftJcEnergy(projectName, ctx);
    case "eiph_septic":
      return draftEiphSeptic(projectName, ctx);
    case "eiph_well":
      return draftEiphWell(projectName, ctx);
    case "utility_power":
      return draftUtility(projectName, "electrical", ctx);
    case "utility_gas":
      return draftUtility(projectName, "gas", ctx);
    default:
      return `DRAFT — ${key}\nProject: ${projectName}\nAI DRAFT ONLY.`;
  }
}

export function packageStatus(items: PermitChecklistItem[]): PermitStatus {
  if (items.length === 0) return "not_started";
  if (items.every((i) => i.status === "approved")) return "approved";
  if (items.some((i) => i.status === "denied")) return "denied";
  if (items.some((i) => i.status === "submitted")) return "submitted";
  if (items.some((i) => i.status === "ready_review")) return "ready_review";
  if (items.some((i) => i.status === "drafting")) return "drafting";
  return "not_started";
}

export function createPermitPackage(projectId: string, projectName: string): PermitPackage {
  const items = buildResidentialPermitChecklist(projectName);
  return {
    id: `pp-${projectId}`,
    projectId,
    title: `Permit package — ${projectName}`,
    status: packageStatus(items),
    items,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function permitProgress(items: PermitChecklistItem[]) {
  const total = items.length || 1;
  const done = items.filter((i) => i.status === "approved").length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function corePermitProgress(items: PermitChecklistItem[]) {
  const core = items.filter((i) => isCorePermitKey(i.key));
  const total = core.length || 1;
  const done = core.filter((i) => i.status === "approved").length;
  return { done, total, pct: Math.round((done / total) * 100), items: core };
}

export function nextPermitAction(items: PermitChecklistItem[]): PermitChecklistItem | undefined {
  const order: PermitStatus[] = ["denied", "ready_review", "drafting", "submitted", "not_started"];
  for (const st of order) {
    const hit = items.find((i) => i.status === st);
    if (hit) return hit;
  }
  return undefined;
}

export function permitActionLabel(item: PermitChecklistItem): string {
  switch (item.status) {
    case "not_started":
      return "Start draft";
    case "drafting":
      return "Mark ready for review";
    case "ready_review":
      return "Mark submitted to agency";
    case "submitted":
      return "Record approval";
    case "denied":
      return "Revise after denial";
    default:
      return "Complete";
  }
}

export function advancePermitStatus(current: PermitStatus): PermitStatus {
  switch (current) {
    case "not_started":
      return "drafting";
    case "drafting":
      return "ready_review";
    case "ready_review":
      return "submitted";
    case "submitted":
      return "approved";
    case "denied":
      return "drafting";
    default:
      return current;
  }
}

export function permitStatusVariant(
  s: PermitStatus,
): "secondary" | "warning" | "success" | "outline" | "danger" {
  if (s === "approved") return "success";
  if (s === "submitted" || s === "ready_review") return "warning";
  if (s === "denied") return "danger";
  if (s === "drafting") return "secondary";
  return "outline";
}

export function mockAgencyReference(key: string, projectId: string): string {
  const short = projectId.replace(/\W/g, "").slice(-4).toUpperCase() || "JOB";
  const year = new Date().getFullYear();
  switch (key) {
    case "jc_building_permit":
      return `JC-BP-${year}-${short}`;
    case "jc_site_plan":
      return `JC-SP-${year}-${short}`;
    case "eiph_septic":
      return `EIPH-WW-${year}-${short}`;
    default:
      return `MOCK-${year}-${short}`;
  }
}
