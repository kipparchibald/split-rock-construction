/**
 * Verified Holwege permit facts. Do not invent parcel PIN, well log, or installer.
 */
export const HOLWEGE_PERMIT = {
  projectId: "p-holwege",
  jobName: "Holwege Residence — Lot 16",
  owners: "Lauren Holwege and Cindy Holwege",
  ownerEmail: "holwegefam@comcast.net",
  legal: "Lot 16, Block 8, Teton Heights Division 6, Jefferson County, Idaho",
  siteAddress: "Lot 16 Block 8, Teton Heights Div 6, Rigby ID 83442",
  subdivision: "Teton Heights Division 6",
  lot: "16",
  block: "8",
  county: "Jefferson",
  deed: "Instrument No. 501245",
  titleFile: "Alliance Title 1100920",
  lotClosed: "2026-08-24",
  lotPaid: 98000,
  plans: "River Bend Drafting — Lauren and Cindy Holwege 8-31-2026b (Elise Shurtliff)",
  occupancy: "R-3 one-family",
  stories: 1,
  foundation: "4-foot crawlspace (not a basement)",
  heatedSqft: 2602,
  beds: 3,
  baths: 2,
  garage: "3-car garage, zero-entry",
  roof: "6:12 engineered trusses, architectural shingles",
  walls: "2x6 @ 24 O.C., R-21 batt",
  ceilingR: "R-49",
  climateZone: "6",
  contractor: "Split Rock Construction LLC",
  license: "6481622",
  contractorAddress: "527 Rigby Town Square, Rigby, ID 83442",
  contractorPhone: "(208) 200-0605",
  contractorEmail: "Kipp@splitrockconst.com",
  member: "Kipp Archibald, Member",
  field: "Kyle Christensen (field supervisor — not a contract party)",
  costOfWork: 599391,
  contract: 689299.65,
  valuationNote: "Use construction contract $689,299.65. Do not add the $98,000 lot.",
  utilitiesAtLot:
    "Natural gas, power with transformer set, and fiber are already to the lot. House laterals only.",
  water: "Private well (to be drilled) — IDWR well log after drill. Not an EIPH well permit.",
  sewer: "Private septic — EIPH District 7 individual system",
  eiphContact: "Vincent McHenry · VMcHenry@EIPH.Idaho.gov · (208) 533-3170",
  eiphFee: 900,
  cityworks: "https://app04.cityworksonline.com/CLIENT_JeffersonCoID-public/login",
  countyPhone: "(208) 745-9220",
  missing: [
    "Jefferson County parcel PIN",
    "Township / Range / Section",
    "Owner mailing address and phone",
    "Licensed septic installer name",
    "Test hole scheduled with EIPH",
    "Engineered truss packet",
    "Scaled site plan PDF",
    "REScheck or energy worksheet",
    "Cityworks account in Split Rock LLC name",
  ],
} as const;

export function isHolwegeJob(nameOrAddress: string | undefined | null): boolean {
  if (!nameOrAddress) return false;
  return /holwege|lot 16.*block 8|p-holwege/i.test(nameOrAddress);
}

export function holwegeDraftForKey(key: string): string | null {
  const H = HOLWEGE_PERMIT;
  const missing = H.missing.map((m) => "  - " + m).join("\n");
  const head = (title: string) =>
    title +
    "\nPREP PACKET — copy into the live agency form. Not a filed permit.\nPrepared 2026-09-11 · Split Rock Construction LLC · 6481622\n";
  if (key === "jc_building_permit") {
    return [
      head("JEFFERSON COUNTY BUILDING PERMIT — HOLWEGE FIELD SHEET"),
      "File in Cityworks: " + H.cityworks,
      "Applicant: " + H.contractor + " · license " + H.license,
      "Address: " + H.contractorAddress + " · " + H.contractorPhone,
      "Owners: " + H.owners + " · " + H.ownerEmail,
      "Legal: " + H.legal,
      "Deed: " + H.deed + " · " + H.titleFile + " closed " + H.lotClosed,
      "Foundation: " + H.foundation,
      "Beds/baths/sf: " + H.beds + " / " + H.baths + " / " + H.heatedSqft,
      "Plans: " + H.plans,
      "Valuation: $689,299.65 construction only. Do not add the $98,000 lot.",
      H.utilitiesAtLot,
      "DO NOT mark submitted in the app until Cityworks shows a case number.",
      "STILL NEEDED:\n" + missing,
    ].join("\n");
  }
  if (key === "jc_site_plan") {
    return head("JEFFERSON COUNTY SITE PLAN — HOLWEGE") + H.legal + "\nScaled PDF required. App GIS is schematic.";
  }
  if (key === "jc_energy") {
    return head("ENERGY PATH — HOLWEGE CZ6") + H.ceilingR + " ceiling · " + H.walls;
  }
  if (key === "eiph_septic") {
    return [
      head("EIPH DISTRICT 7 — SEPTIC FIELD SHEET"),
      "Submit to: " + H.eiphContact + " · fee $" + H.eiphFee,
      "Form: https://eiph.id.gov/wp-content/uploads/2026/03/Septic-Permit-Application-Packet-0326.pdf",
      "New residential · crawl space · private well · Lot 16 Block 8 Teton Heights Div 6",
      "Installer: ASK KYLE",
    ].join("\n");
  }
  if (key === "eiph_well" || key === "idwr_well") {
    return head("WELL — IDWR + EIPH SETBACKS") + H.water + "\nDo not apply to EIPH for a well permit.";
  }
  if (key === "utility_power" || key === "utility_gas") {
    return head("UTILITY — HOLWEGE") + H.utilitiesAtLot;
  }
  return null;
}
