import type { PermitChecklistItem, PermitPackage, PermitStatus } from "@/data/types";

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
    },
    {
      key: "jc_energy",
      label: "Energy code compliance (prescriptive or performance)",
      authority: "jefferson_county",
      status: "not_started",
      formCode: "JC-IECC",
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
    },
    {
      key: "utility_power",
      label: "Utility — electrical service application",
      authority: "utility",
      status: "not_started",
    },
    {
      key: "utility_gas",
      label: "Utility — gas service (if applicable)",
      authority: "utility",
      status: "not_started",
    },
  ];
}

export function draftJcBuildingPermit(projectName: string): string {
  return [
    `JEFFERSON COUNTY BUILDING PERMIT — DRAFT`,
    `Generated for operational preparation. Verify current forms at the Jefferson County Building Department before submission.`,
    ``,
    `Project / job name: ${projectName}`,
    `Jurisdiction: Jefferson County, Idaho`,
    `Occupancy: R-3 (one/two family) — confirm with plans`,
    ``,
    `Owner / applicant: ________________________________`,
    `Mailing address: _________________________________`,
    `Phone / email: ___________________________________`,
    ``,
    `Site address / parcel: _____________________________`,
    `Legal description: ________________________________`,
    ``,
    `Contractor: Split Rock Construction LLC`,
    `Idaho contractor license #: ________________________`,
    `Contact superintendent: ___________________________`,
    ``,
    `Valuation (contract / estimate): $_________________`,
    `Heated sq ft: ______  Unheated / garage: ______`,
    `Stories: ______  Bedrooms: ______  Baths: ______`,
    ``,
    `Foundation type: ______  Roof covering: ______`,
    `Heating system: ______  Water heater: ______`,
    ``,
    `Attachments checklist:`,
    `[ ] Site plan  [ ] Floor plans  [ ] Elevations`,
    `[ ] Structural / engineering (if required)`,
    `[ ] Energy compliance worksheet`,
    `[ ] Septic approval (EIPH) if not on sewer`,
    ``,
    `Applicant signature: ________________  Date: ______`,
    ``,
    `AI DRAFT ONLY — Review all fields, local amendments, and fee schedule before filing.`,
  ].join("\n");
}

export function draftEiphSeptic(projectName: string): string {
  return [
    `EASTERN IDAHO PUBLIC HEALTH (DISTRICT 7) — WASTEWATER / SEPTIC DRAFT`,
    `Project: ${projectName}`,
    `County: Jefferson`,
    ``,
    `Property owner: ___________________________________`,
    `Site address: ____________________________________`,
    `Parcel / tax ID: _________________________________`,
    ``,
    `System type: □ New  □ Repair  □ Expansion`,
    `Bedrooms (design): ______  Soil test date: ______`,
    `Installer (licensed): _____________________________`,
    ``,
    `Water source: □ Public  □ Private well`,
    `Well log / EIPH well file #: ______________________`,
    ``,
    `Notes for health officer: _________________________`,
    ``,
    `AI DRAFT ONLY — Confirm current EIPH District 7 forms and fees before submission.`,
  ].join("\n");
}

export function packageStatus(items: PermitChecklistItem[]): PermitStatus {
  if (items.every((i) => i.status === "approved")) return "approved";
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
