import type { Client, PermitChecklistItem, PermitPackage, PermitStatus, Project } from "@/data/types";
import { holwegeDraftForKey, isHolwegeJob } from "@/data/holwege-permits";
import { COMPANY } from "@/lib/company";

export const CORE_PERMIT_KEYS = ["jc_building_permit", "jc_site_plan", "eiph_septic"] as const;
export type CorePermitKey = (typeof CORE_PERMIT_KEYS)[number];

export function isCorePermitKey(key: string): key is CorePermitKey {
  return (CORE_PERMIT_KEYS as readonly string[]).includes(key);
}

export interface PermitDraftContext {
  project: Pick<Project, "name" | "address" | "superintendent" | "sqft" | "beds" | "baths" | "budget" | "description">;
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

export function buildResidentialPermitChecklist(projectName: string): PermitChecklistItem[] {
  return [
    { key: "jc_building_permit", label: "Jefferson County building permit application", authority: "jefferson_county", status: "drafting", formCode: "JC-BP", notes: "Rigby / Jefferson County residential new construction", draftText: draftJcBuildingPermit(projectName) },
    { key: "jc_site_plan", label: "Site plan / plot plan", authority: "jefferson_county", status: "not_started", formCode: "JC-SP", draftText: draftJcSitePlan(projectName) },
    { key: "jc_energy", label: "Energy code compliance (prescriptive or performance)", authority: "jefferson_county", status: "not_started", formCode: "JC-IECC", draftText: draftJcEnergy(projectName) },
    { key: "eiph_septic", label: "EIPH septic / wastewater permit", authority: "eiph", status: "not_started", formCode: "EIPH-WW", notes: "Eastern Idaho Public Health District 7", draftText: draftEiphSeptic(projectName) },
    { key: "eiph_well", label: "IDWR well log + EIPH setbacks (private well)", authority: "state", status: "not_started", formCode: "IDWR-WELL", draftText: draftEiphWell(projectName) },
    { key: "utility_power", label: "Utility electrical service application", authority: "utility", status: "not_started", draftText: draftUtility(projectName, "electrical") },
    { key: "utility_gas", label: "Utility gas service", authority: "utility", status: "not_started", draftText: draftUtility(projectName, "gas") },
  ];
}

export function draftJcBuildingPermit(projectName: string, ctx?: PermitDraftContext): string {
  const filled = isHolwegeJob(`${projectName} ${ctx?.project?.name ?? ""}`) ? holwegeDraftForKey("jc_building_permit") : null;
  if (filled) return filled;
  const p = ctx?.project;
  const c = ctx?.client;
  const day = ctx?.today ?? todayIso();
  return [
    `JEFFERSON COUNTY BUILDING PERMIT — ${ctx ? "MOCK FILLED" : "DRAFT"}`,
    `Project / job name: ${p?.name ?? projectName}`,
    `Jurisdiction: Jefferson County, Idaho`,
    `Draft date: ${day}`,
    `Owner / applicant: ${c?.name ?? "________________________________"}`,
    `Site address / parcel: ${p?.address ?? "_____________________________"}`,
    `Contractor: ${COMPANY.legalName}`,
    `Idaho contractor license #: ${COMPANY.idahoContractorRegistration}`,
    `Valuation (contract / estimate): ${p ? money(p.budget) : "$_________________"}`,
    `Heated sq ft: ${p?.sqft ?? "______"}  Bedrooms: ${p?.beds ?? "______"}  Baths: ${p?.baths ?? "______"}`,
    `Foundation type: confirm on plans (do not assume basement)`,
    `Heating system: confirm bid before listing equipment`,
    `[ ] Septic approval (EIPH) if not on sewer — do not check until receipt exists`,
    ctx ? `MOCK FILING — not a filed permit.` : `AI DRAFT ONLY — review before filing.`,
  ].join("\n");
}

export function draftJcSitePlan(projectName: string, ctx?: PermitDraftContext): string {
  const filled = isHolwegeJob(`${projectName} ${ctx?.project?.name ?? ""}`) ? holwegeDraftForKey("jc_site_plan") : null;
  if (filled) return filled;
  const p = ctx?.project;
  return [`JEFFERSON COUNTY SITE / PLOT PLAN — ${ctx ? "MOCK FILLED" : "DRAFT"}`, `Project: ${p?.name ?? projectName}`, `Site address: ${p?.address ?? "—"}`, `County GIS: https://gisportal.co.jefferson.id.us/portweb/home/`].join("\n");
}

export function draftJcEnergy(projectName: string, ctx?: PermitDraftContext): string {
  const filled = isHolwegeJob(`${projectName} ${ctx?.project?.name ?? ""}`) ? holwegeDraftForKey("jc_energy") : null;
  if (filled) return filled;
  const p = ctx?.project;
  return [`ENERGY CODE COMPLIANCE — DRAFT`, `Project: ${p?.name ?? projectName}`, `Climate zone: 6`, `Wall R-21  Ceiling R-49`].join("\n");
}

export function draftEiphSeptic(projectName: string, ctx?: PermitDraftContext): string {
  const filled = isHolwegeJob(`${projectName} ${ctx?.project?.name ?? ""}`) ? holwegeDraftForKey("eiph_septic") : null;
  if (filled) return filled;
  const p = ctx?.project;
  const c = ctx?.client;
  return [`EIPH DISTRICT 7 — SEPTIC DRAFT`, `Project: ${p?.name ?? projectName}`, `Owner: ${c?.name ?? ""}`, `Bedrooms (design): ${p?.beds ?? "______"}`, `Foundation: confirm crawl vs basement`, `AI DRAFT ONLY`].join("\n");
}

export function draftEiphWell(projectName: string, ctx?: PermitDraftContext): string {
  const filled = isHolwegeJob(`${projectName} ${ctx?.project?.name ?? ""}`) ? holwegeDraftForKey("eiph_well") : null;
  if (filled) return filled;
  return [`IDWR WELL LOG — DRAFT`, `Project: ${projectName}`, `Driller files IDWR. EIPH checks setbacks only.`].join("\n");
}

export function draftUtility(projectName: string, kind: "electrical" | "gas", ctx?: PermitDraftContext): string {
  const filled = isHolwegeJob(`${projectName} ${ctx?.project?.name ?? ""}`) ? holwegeDraftForKey(kind === "electrical" ? "utility_power" : "utility_gas") : null;
  if (filled) return filled;
  return [`UTILITY SERVICE — ${kind.toUpperCase()} — DRAFT`, `Project: ${projectName}`].join("\n");
}

export function buildDraftForKey(key: string, projectName: string, ctx?: PermitDraftContext): string {
  const blob = `${projectName} ${ctx?.project?.name ?? ""} ${ctx?.project?.address ?? ""}`;
  if (isHolwegeJob(blob)) {
    const filled = holwegeDraftForKey(key);
    if (filled) return filled;
  }
  switch (key) {
    case "jc_building_permit": return draftJcBuildingPermit(projectName, ctx);
    case "jc_site_plan": return draftJcSitePlan(projectName, ctx);
    case "jc_energy": return draftJcEnergy(projectName, ctx);
    case "eiph_septic": return draftEiphSeptic(projectName, ctx);
    case "eiph_well": return draftEiphWell(projectName, ctx);
    case "utility_power": return draftUtility(projectName, "electrical", ctx);
    case "utility_gas": return draftUtility(projectName, "gas", ctx);
    default: return `DRAFT — ${key}\nProject: ${projectName}`;
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
  const items = buildResidentialPermitChecklist(projectName).map((item) => {
    if (!isHolwegeJob(`${projectId} ${projectName}`)) return item;
    const draft = holwegeDraftForKey(item.key);
    return draft ? { ...item, status: "drafting" as const, draftText: draft } : item;
  });
  return { id: `pp-${projectId}`, projectId, title: `Permit package — ${projectName}`, status: packageStatus(items), items, updatedAt: new Date().toISOString().slice(0, 10) };
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
export function nextPermitAction(items: PermitChecklistItem[]) {
  const order: PermitStatus[] = ["denied", "ready_review", "drafting", "submitted", "not_started"];
  for (const st of order) {
    const hit = items.find((i) => i.status === st);
    if (hit) return hit;
  }
  return undefined;
}
export function permitActionLabel(item: PermitChecklistItem) {
  switch (item.status) {
    case "not_started": return "Start draft";
    case "drafting": return "Mark ready for review";
    case "ready_review": return "Mark submitted to agency";
    case "submitted": return "Record approval";
    case "denied": return "Revise after denial";
    default: return "Complete";
  }
}
export function advancePermitStatus(current: PermitStatus): PermitStatus {
  switch (current) {
    case "not_started": return "drafting";
    case "drafting": return "ready_review";
    case "ready_review": return "submitted";
    case "submitted": return "approved";
    case "denied": return "drafting";
    default: return current;
  }
}
export function permitStatusVariant(s: PermitStatus): "secondary" | "warning" | "success" | "outline" | "danger" {
  if (s === "approved") return "success";
  if (s === "submitted" || s === "ready_review") return "warning";
  if (s === "denied") return "danger";
  if (s === "drafting") return "secondary";
  return "outline";
}
export function mockAgencyReference(key: string, projectId: string): string {
  const short = projectId.replace(/\W/g, "").slice(-4).toUpperCase() || "JOB";
  const year = new Date().getFullYear();
  if (key === "jc_building_permit") return `JC-BP-${year}-${short}`;
  if (key === "jc_site_plan") return `JC-SP-${year}-${short}`;
  if (key === "eiph_septic") return `EIPH-WW-${year}-${short}`;
  return `MOCK-${year}-${short}`;
}
