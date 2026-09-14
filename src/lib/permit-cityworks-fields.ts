/**
 * Jefferson County / City of Rigby SFD Cityworks field dictionary.
 * Values come from River Bend 8-31-2026b + Holwege contract facts.
 * Blank or "CONFIRM" means do not invent — operator types it in Cityworks.
 */
import { HOLWEGE_PERMIT } from "@/data/holwege-permits";
import { COMPANY } from "@/lib/company";

export type FieldConfidence = "locked" | "from_plans" | "confirm" | "missing";

export type CityworksField = {
  id: string;
  group: string;
  label: string;
  value: string;
  confidence: FieldConfidence;
  source: string;
};

export const CITYWORKS_PORTAL =
  "https://app04.cityworksonline.com/CLIENT_JeffersonCoID-public/login";
export const CITYWORKS_HELP =
  "https://www.jcgov.us/DocumentCenter/View/3349/Rigby---Single-Family-Dwelling-Townhouse-and-Additions-Help-information";
export const EIPH_SEPTIC =
  "https://eiph.id.gov/wp-content/uploads/2026/03/Septic-Permit-Application-Packet-0326.pdf";

/** Facts read off River Bend sheets P-1–P-8 (8-31-2026b) + plot notes. */
export const RIVER_BEND_HOLWEGE = {
  set: "River Bend Drafting — Lauren and Cindy Holwege 8-31-2026b",
  drafter: "Elise Shurtliff, River Bend Drafting and Design (208-557-3621)",
  sheets: "P-1 through P-8",
  occupancy: "R-3 one-family dwelling",
  constructionType: "VB (wood frame, 2018 IRC)",
  stories: "1",
  foundation: "4-foot crawlspace — not a basement",
  footprint: "77'-6\" x 57'-1\"",
  mainWalls: "9' walls, 2x6 @ 24\" O.C., R-21 batt",
  garage: "29'-8\" x 37'-11\" · 3-bay · zero-entry into house",
  garageBays: "3",
  roofPitch: "6:12 engineered trusses @ 24\" O.C. (8:12 and 3:12 accents)",
  sprinklers: "No",
  climateZone: "6",
  ceilingR: "R-49 blown",
  wallR: "R-21 batt in 2x6",
  floorR: "R-30",
  heat: "CONFIRM equipment from HVAC bid before listing in Cityworks",
  septicArea: "Septic + replacement area approx. 20' x 60' on plot",
  grade: "Fall 6\" in first 10' away from foundation",
} as const;

function f(
  group: string,
  id: string,
  label: string,
  value: string,
  confidence: FieldConfidence,
  source: string,
): CityworksField {
  return { id, group, label, value, confidence, source };
}

export function fillRigbySfdFromPlans(jobName = HOLWEGE_PERMIT.jobName): CityworksField[] {
  const H = HOLWEGE_PERMIT;
  const P = RIVER_BEND_HOLWEGE;
  return [
    f("Application", "jurisdiction", "Application type", "City of Rigby — Single Family Dwelling (new)", "locked", "JC help sheet 1/2/2024"),
    f("Application", "code", "Code year", "2018 IRC (Jefferson County / Rigby)", "locked", "JC help sheet"),
    f("Application", "portal", "File in", CITYWORKS_PORTAL, "locked", "JC PZB"),
    f("Parties", "applicant", "Applicant / contractor", `${COMPANY.legalName} · ${COMPANY.idahoContractorRegistration}`, "locked", "DOPL + company.ts"),
    f("Parties", "applicant_addr", "Contractor address", H.contractorAddress, "locked", "holwege-permits"),
    f("Parties", "applicant_phone", "Contractor phone", COMPANY.phone, "locked", "company.ts"),
    f("Parties", "applicant_email", "Contractor email", COMPANY.email, "locked", "company.ts"),
    f("Parties", "owners", "Property owners", H.owners, "locked", "deed / contract"),
    f("Parties", "owner_email", "Owner email", H.ownerEmail, "locked", "CRM"),
    f("Parties", "owner_mail", "Owner mailing + phone", "CONFIRM before filing", "missing", "not on file"),
    f("Property", "legal", "Legal description", H.legal, "locked", "deed 501245"),
    f("Property", "subdivision", "Subdivision / lot / block", `${H.subdivision} · Lot ${H.lot} · Block ${H.block}`, "locked", "plat"),
    f("Property", "site", "Location address", H.siteAddress + " (county address not yet assigned)", "from_plans", "lot legal"),
    f("Property", "parcel", "Parcel number (PIN)", "MISSING — pull from Jefferson County GIS / Assessor before submit", "missing", "assessor"),
    f("Property", "acres", "Parcel size (acres)", "0.60 (Teton Heights working grid — confirm plat)", "confirm", "GIS overlay"),
    f("Property", "zoning", "City of Rigby zoning", "CONFIRM on Rigby zoning certificate", "missing", "city zoning cert"),
    f("Property", "flood", "Flood zone", "CONFIRM on FEMA / county GIS. Do not guess.", "missing", "FEMA"),
    f("Property", "deed", "Warranty deed", `Instrument No. ${H.deed} · Alliance Title 1100920 · closed ${H.lotClosed}`, "locked", "closing file"),
    f("Structure", "type", "Type of structure", "New single-family dwelling", "from_plans", P.set),
    f("Structure", "occupancy", "Occupancy class", P.occupancy, "from_plans", P.set),
    f("Structure", "const_type", "Construction type", P.constructionType, "from_plans", P.set),
    f("Structure", "stories", "Stories", P.stories, "from_plans", P.sheets),
    f("Structure", "beds", "Bedrooms", String(H.beds), "from_plans", "permit packet + EIPH design"),
    f("Structure", "baths", "Bathrooms", String(H.baths), "from_plans", "permit packet"),
    f("Structure", "garage_bays", "Garage bays", P.garageBays, "from_plans", P.sheets),
    f("Structure", "garage_size", "Garage size", P.garage, "from_plans", P.sheets),
    f("Structure", "sprinkler", "Fire sprinkler installed", P.sprinklers, "from_plans", "not shown on set"),
    f("Structure", "sprinkler_req", "Sprinkler required by code?", "No (confirm with reviewer)", "confirm", "2018 IRC"),
    f("Structure", "height", "Building height above ground", "CONFIRM from elevations (9' walls + 6:12 roof). Do not invent feet-inches.", "confirm", P.sheets),
    f("Structure", "eave", "Height to eave / gable / eave projection", "CONFIRM off elevations P-set", "confirm", P.sheets),
    f("Structure", "footprint", "Overall footprint", P.footprint, "from_plans", P.sheets),
    f("Structure", "sf_living", "Living / heated square footage", `${H.heatedSqft} (on file — Elise to print SF on sheets for appraiser)`, "confirm", "holwege-permits"),
    f("Structure", "sf_garage", "Garage square footage", "Approx 1,126 (29'-8\" x 37'-11\") — print on plans", "confirm", P.sheets),
    f("Structure", "sf_basement", "Basement square footage", "0 — crawlspace only, not a basement", "locked", P.sheets),
    f("Structure", "foundation", "Foundation", P.foundation, "from_plans", P.sheets),
    f("Setbacks", "n", "North setback", "CONFIRM on scaled site plan PDF (app GIS is schematic)", "missing", "site plan"),
    f("Setbacks", "e", "East setback", "CONFIRM on scaled site plan PDF", "missing", "site plan"),
    f("Setbacks", "w", "West setback", "CONFIRM on scaled site plan PDF", "missing", "site plan"),
    f("Setbacks", "s", "South setback", "CONFIRM on scaled site plan PDF", "missing", "site plan"),
    f("Setbacks", "other_bldg", "Distance from other buildings", "None on lot (vacant)", "from_plans", "plot"),
    f("Setbacks", "canal", "Canals on property", "CONFIRM on plat / irrigation map", "missing", "plat"),
    f("Utilities", "sewer", "Sewer provider", H.sewer, "locked", "contract"),
    f("Utilities", "sewer_permit", "Sewer / septic permit number", "EIPH application not yet filed — do this first", "missing", "EIPH"),
    f("Utilities", "water", "Water source", H.water, "locked", "contract"),
    f("Utilities", "heat", "Heat system", P.heat, "confirm", "HVAC bid"),
    f("Utilities", "at_lot", "Utilities already at lot", H.utilitiesAtLot, "locked", "contract § utilities"),
    f("Money", "valuation", "Declared valuation", `$${H.contract.toLocaleString("en-US", { minimumFractionDigits: 2 })} construction only. Do not add the $98,000 lot.`, "locked", "contract price"),
    f("Money", "job", "Job name", jobName, "locked", "OS"),
    f("Plans", "set", "Plan set", P.set, "locked", "Exhibit A"),
    f("Plans", "drafter", "Drafter", P.drafter, "locked", "title block"),
    f("Attachments", "plans_pdf", "Complete plan set PDF", "ATTACH River Bend 8-31-2026b P-1–P-8", "confirm", "Drive / packet"),
    f("Attachments", "truss", "Engineered truss design + layout", "MISSING — request from truss plant", "missing", "truss vendor"),
    f("Attachments", "site_pdf", "Scaled site plan PDF", "MISSING — GIS overlay is schematic only", "missing", "survey / Elise"),
    f("Attachments", "zoning_cert", "City of Rigby zoning certificate", "MISSING", "missing", "City of Rigby"),
    f("Attachments", "deed_pdf", "Recorded warranty deed PDF", "HAVE — Instrument 501245", "locked", "closing"),
    f("Attachments", "license", "Idaho contractor license copy", `HAVE — ${COMPANY.idahoContractorRegistration}`, "locked", "DOPL"),
    f("Attachments", "access", "Access / approach permit", "Teton Heights internal street — confirm Public Works if they still want a form", "confirm", "PW"),
  ];
}

export function fieldsByGroup(fields = fillRigbySfdFromPlans()) {
  const groups: { group: string; fields: CityworksField[] }[] = [];
  for (const field of fields) {
    const last = groups[groups.length - 1];
    if (last && last.group === field.group) last.fields.push(field);
    else groups.push({ group: field.group, fields: [field] });
  }
  return groups;
}

export function fieldCounts(fields = fillRigbySfdFromPlans()) {
  const counts = { locked: 0, from_plans: 0, confirm: 0, missing: 0, total: fields.length };
  for (const field of fields) counts[field.confidence] += 1;
  return counts;
}

export function cityworksWorksheetText(fields = fillRigbySfdFromPlans()): string {
  const counts = fieldCounts(fields);
  const lines = [
    "JEFFERSON COUNTY / CITY OF RIGBY — SFD CITYWORKS WORKSHEET",
    "AI fill from River Bend 8-31-2026b + Holwege contract facts.",
    "NOT A FILED PERMIT. Copy into Cityworks. Confirm every CONFIRM / MISSING line.",
    `Prepared ${new Date().toISOString().slice(0, 10)} · ${COMPANY.legalName} · ${COMPANY.idahoContractorRegistration}`,
    `Portal: ${CITYWORKS_PORTAL}`,
    `Counts: ${counts.locked} locked · ${counts.from_plans} from plans · ${counts.confirm} confirm · ${counts.missing} missing`,
    "",
  ];
  let group = "";
  for (const field of fields) {
    if (field.group !== group) {
      group = field.group;
      lines.push(`## ${group.toUpperCase()}`);
    }
    lines.push(`${field.label}: ${field.value}  [${field.confidence.toUpperCase()} · ${field.source}]`);
  }
  lines.push("");
  lines.push("EIPH septic first: " + EIPH_SEPTIC);
  lines.push("Do not mark submitted in Split Rock OS until Cityworks shows a case number.");
  return lines.join("\n");
}
