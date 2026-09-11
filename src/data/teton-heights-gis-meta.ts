/**
 * Teton Heights Division No. 6 — operational GIS + recorded well & septic
 * improvement plan (Jefferson County Instrument No. 492361).
 *
 * Well and septic locations follow the recorded Thompson Land Surveying sheet:
 *   - Domestic well (W) at the street / 15' PUE frontage
 *   - 90' x 38' standard rock-and-pipe drainfield + replacement field
 *   - 100' domestic well separation
 *   - 20' drainfield-to-basement dwelling (IDAPA 58.01.03.008.d)
 *   - 68' x 61' building footprint as shown on the sheet
 *
 * Lot rings below remain a schematic working grid for the operator overlay.
 * Confirm bearings and pins on the recorded plat + a PLS mark-out before staking.
 * County parcels: https://gisportal.co.jefferson.id.us/portweb/home/
 */

export const JEFFERSON_GIS = {
  portal: "https://gisportal.co.jefferson.id.us/portweb/home/",
  countyPage: "https://www.jcgov.us/224/Geographic-Information-Systems-GIS-Mappi",
  dataFiles: "https://www.jcgov.us/479/Data-Files",
  aerialTiles:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Esri World Imagery · Jefferson County GIS · Teton Heights Div. 6 Well & Septic Improvement Plans, Inst. 492361",
} as const;

/** Recorded well & septic improvement plan — Thompson Land Surveying, 6/26/2025. */
export const TETON_HEIGHTS_RECORDED_PLAN = {
  title: "Teton Heights Division No. 6 Well & Septic Improvement Plans",
  instrument: "492361",
  surveyor: "Kevin L. Thompson, PLS 10563 — Thompson Land Surveying, Inc.",
  jobNumber: "2005-036",
  date: "2025-06-26",
  scale: "1 in = 100 ft",
  driveFileId: "1ttXCVRfvBTApwH4mDmALiqhZ3O2BeLzc",
  driveUrl: "https://drive.google.com/file/d/1ttXCVRfvBTApwH4mDmALiqhZ3O2BeLzc/view",
  location: "S 1/2 of Section 29, T4N, R39E, B.M., Jefferson County, Idaho",
} as const;

/** Rules printed on the recorded sheet. */
export const TETON_HEIGHTS_PLAN_RULES = {
  wellSeparationFt: 100,
  drainfieldToBasementDwellingFt: 20,
  drainfieldPrimaryFt: { width: 90, depth: 38 },
  drainfieldReplacementFt: { width: 90, depth: 38 },
  buildingFootprintFt: { width: 68, depth: 61 },
  publicUtilityEasementFt: 15,
  canalSetbackFt: 60,
  streetSetbackFromCenterlineFt: 65,
  idapa: "IDAPA 58.01.03.008.d",
  zoning: "Jefferson County Zoning Ordinance Chapter 112-263",
  note: "90 x 38 drainfield as shown is for a 6-bedroom home standard rock and pipe drainfield. Alternate systems must fit the shown drainfield site. Lot owner shall hire a PLS to mark the drainfield area prior to septic installation.",
} as const;

export const TETON_HEIGHTS_CENTER = {
  lat: 43.6892,
  lng: -111.8685,
  streetRef: "Teton Heights Loop / E 146 N / E 136 N / E 121 N, Rigby, ID 83442",
} as const;

export type PlanLayerId =
  | "aerial"
  | "parcels"
  | "lots"
  | "setbacks"
  | "building"
  | "driveway"
  | "utilities"
  | "septic"
  | "well"
  | "easements"
  | "contours"
  | "recordedPlan";

export interface PlanLayerMeta {
  id: PlanLayerId;
  label: string;
  description: string;
  defaultOn: boolean;
  color: string;
}

export const PLAN_LAYERS: PlanLayerMeta[] = [
  {
    id: "aerial",
    label: "Aerial imagery",
    description: "Esri World Imagery basemap",
    defaultOn: true,
    color: "#888",
  },
  {
    id: "recordedPlan",
    label: "Recorded well & septic plan",
    description: "Inst. 492361 — Thompson sheet is the source of truth for well and drainfield",
    defaultOn: true,
    color: "#e7e5e4",
  },
  {
    id: "parcels",
    label: "County parcels",
    description: "Jefferson County assessor boundaries (IDWR)",
    defaultOn: true,
    color: "#60a5fa",
  },
  {
    id: "lots",
    label: "Lot lines (working grid)",
    description: "Operator overlay — confirm on recorded plat",
    defaultOn: true,
    color: "#f5f0e6",
  },
  {
    id: "easements",
    label: "15' public utility easement",
    description: "Street-front PUE as shown on Inst. 492361",
    defaultOn: true,
    color: "#fbbf24",
  },
  {
    id: "utilities",
    label: "Power / gas routes",
    description: "Service laterals from ROW",
    defaultOn: true,
    color: "#38bdf8",
  },
  {
    id: "well",
    label: "Domestic well (W)",
    description: "Recorded frontage well + 100' separation ring",
    defaultOn: true,
    color: "#22d3ee",
  },
  {
    id: "septic",
    label: "Drainfield + replacement",
    description: "90 x 38 primary and replacement rock-and-pipe fields",
    defaultOn: true,
    color: "#a3e635",
  },
  {
    id: "setbacks",
    label: "Building setbacks",
    description: "Front / side / rear envelopes",
    defaultOn: true,
    color: "#fb923c",
  },
  {
    id: "building",
    label: "Building footprint",
    description: "68 x 61 footprint as shown on the improvement plan",
    defaultOn: true,
    color: "#f87171",
  },
  {
    id: "driveway",
    label: "Driveway / access",
    description: "Access from subdivision street",
    defaultOn: true,
    color: "#c4b5a0",
  },
  {
    id: "contours",
    label: "Spot grades",
    description: "Illustrative elevation spots",
    defaultOn: false,
    color: "#94a3b8",
  },
];

export type PlanPoint = [number, number];

export interface LotPlan {
  lotNumber: number;
  label: string;
  ring: PlanPoint[];
  centroid: PlanPoint;
  acres: number;
  projectId?: string;
  notes?: string;
}
