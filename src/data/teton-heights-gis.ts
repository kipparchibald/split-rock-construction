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

export const TETON_HEIGHTS_LOTS: LotPlan[] = [
  {
    lotNumber: 1,
    label: "Lot 1",
    ring: [
      [40, 80],
      [220, 80],
      [220, 280],
      [40, 280],
      [40, 80],
    ],
    centroid: [130, 180],
    acres: 0.63,
  },
  {
    lotNumber: 2,
    label: "Lot 2",
    ring: [
      [230, 80],
      [410, 80],
      [410, 280],
      [230, 280],
      [230, 80],
    ],
    centroid: [320, 180],
    acres: 0.63,
  },
  {
    lotNumber: 3,
    label: "Lot 3",
    ring: [
      [420, 80],
      [600, 80],
      [600, 280],
      [420, 280],
      [420, 80],
    ],
    centroid: [510, 180],
    acres: 0.63,
  },
  {
    lotNumber: 4,
    label: "Lot 4",
    ring: [
      [610, 80],
      [790, 80],
      [790, 280],
      [610, 280],
      [610, 80],
    ],
    centroid: [700, 180],
    acres: 0.63,
  },
  {
    lotNumber: 5,
    label: "Lot 5",
    ring: [
      [800, 80],
      [980, 80],
      [980, 280],
      [800, 280],
      [800, 80],
    ],
    centroid: [890, 180],
    acres: 0.63,
  },
  {
    lotNumber: 6,
    label: "Lot 6",
    ring: [
      [40, 300],
      [220, 300],
      [220, 500],
      [40, 500],
      [40, 300],
    ],
    centroid: [130, 400],
    acres: 0.6,
  },
  {
    lotNumber: 7,
    label: "Lot 7",
    ring: [
      [230, 300],
      [410, 300],
      [410, 500],
      [230, 500],
      [230, 300],
    ],
    centroid: [320, 400],
    acres: 0.6,
    projectId: "p4",
    notes: "Cole Spec — active Split Rock job",
  },
  {
    lotNumber: 8,
    label: "Lot 8",
    ring: [
      [420, 300],
      [600, 300],
      [600, 500],
      [420, 500],
      [420, 300],
    ],
    centroid: [510, 400],
    acres: 0.6,
  },
  {
    lotNumber: 9,
    label: "Lot 9",
    ring: [
      [610, 300],
      [790, 300],
      [790, 500],
      [610, 500],
      [610, 300],
    ],
    centroid: [700, 400],
    acres: 0.6,
  },
  {
    lotNumber: 10,
    label: "Lot 10",
    ring: [
      [800, 300],
      [980, 300],
      [980, 500],
      [800, 500],
      [800, 300],
    ],
    centroid: [890, 400],
    acres: 0.6,
  },
  {
    lotNumber: 11,
    label: "Lot 11",
    ring: [
      [40, 520],
      [410, 520],
      [410, 700],
      [40, 700],
      [40, 520],
    ],
    centroid: [225, 610],
    acres: 0.75,
  },
  {
    lotNumber: 12,
    label: "Lot 12",
    ring: [
      [420, 520],
      [790, 520],
      [790, 700],
      [420, 700],
      [420, 520],
    ],
    centroid: [605, 610],
    acres: 0.75,
  },
];

export const TETON_STREET_ROW: PlanPoint[] = [
  [20, 40],
  [1000, 40],
];

export const UTILITY_EASEMENTS: { id: string; ring: PlanPoint[] }[] = [
  {
    id: "pue-street",
    ring: [
      [40, 40],
      [980, 40],
      [980, 55],
      [40, 55],
      [40, 40],
    ],
  },
];

export const DRAINAGE_EASEMENT: PlanPoint[] = [
  [20, 60],
  [40, 60],
  [40, 720],
  [20, 720],
  [20, 60],
];

export interface LotImprovements {
  lotNumber: number;
  building: PlanPoint[];
  driveway: PlanPoint[];
  setbacks: PlanPoint[];
  well: PlanPoint;
  wellSeparationFt: number;
  septicTank: PlanPoint;
  drainfield: PlanPoint[];
  replacementDrainfield: PlanPoint[];
  powerLateral: PlanPoint[];
  gasLateral: PlanPoint[];
  spotGrades: { pt: PlanPoint; elev: number }[];
  source: "recorded-plan-492361";
}

/**
 * Place well, septic, and drainfields the way Inst. 492361 shows them:
 * well (W) at the street frontage inside the 15' PUE side of the lot,
 * 68x61 house set back from the street, 90x38 primary drainfield in the
 * rear opposite the well, replacement field stacked behind it, tank between
 * house and field. 100' well ring is drawn by the overlay.
 */
export function defaultImprovements(lot: LotPlan): LotImprovements {
  const xs = lot.ring.map((p) => p[0]);
  const ys = lot.ring.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX;
  const d = maxY - minY;
  const cx = (minX + maxX) / 2;

  const pue = TETON_HEIGHTS_PLAN_RULES.publicUtilityEasementFt;
  const bw = TETON_HEIGHTS_PLAN_RULES.buildingFootprintFt.width;
  const bd = TETON_HEIGHTS_PLAN_RULES.buildingFootprintFt.depth;
  const dfW = TETON_HEIGHTS_PLAN_RULES.drainfieldPrimaryFt.width;
  const dfD = TETON_HEIGHTS_PLAN_RULES.drainfieldPrimaryFt.depth;
  const houseGap = TETON_HEIGHTS_PLAN_RULES.drainfieldToBasementDwellingFt;

  const setbacks: PlanPoint[] = [
    [minX + 10, minY + pue + 10],
    [maxX - 10, minY + pue + 10],
    [maxX - 10, maxY - 15],
    [minX + 10, maxY - 15],
    [minX + 10, minY + pue + 10],
  ];

  const bx = Math.max(minX + 12, cx - bw / 2);
  const by = minY + pue + 18;
  const building: PlanPoint[] = [
    [bx, by],
    [bx + Math.min(bw, w - 24), by],
    [bx + Math.min(bw, w - 24), by + Math.min(bd, d * 0.42)],
    [bx, by + Math.min(bd, d * 0.42)],
    [bx, by],
  ];
  const houseBottom = by + Math.min(bd, d * 0.42);

  const driveway: PlanPoint[] = [
    [cx - 8, minY],
    [cx + 8, minY],
    [cx + 8, by],
    [cx - 8, by],
    [cx - 8, minY],
  ];

  // Recorded pattern: domestic well (W) at street frontage, offset from driveway.
  const well: PlanPoint = [minX + Math.min(28, w * 0.22), minY + pue + 6];

  const fieldTop = Math.min(maxY - dfD * 2 - 8, houseBottom + houseGap);
  const fieldLeft = Math.max(minX + 8, maxX - dfW - 12);
  const drainfield: PlanPoint[] = [
    [fieldLeft, fieldTop],
    [fieldLeft + Math.min(dfW, w - 16), fieldTop],
    [fieldLeft + Math.min(dfW, w - 16), fieldTop + dfD],
    [fieldLeft, fieldTop + dfD],
    [fieldLeft, fieldTop],
  ];
  const replacementDrainfield: PlanPoint[] = [
    [fieldLeft, fieldTop + dfD + 4],
    [fieldLeft + Math.min(dfW, w - 16), fieldTop + dfD + 4],
    [fieldLeft + Math.min(dfW, w - 16), fieldTop + dfD * 2 + 4],
    [fieldLeft, fieldTop + dfD * 2 + 4],
    [fieldLeft, fieldTop + dfD + 4],
  ];

  const septicTank: PlanPoint = [fieldLeft + 16, houseBottom + houseGap / 2];

  const powerLateral: PlanPoint[] = [
    [cx + 20, minY],
    [cx + 20, by + 10],
  ];
  const gasLateral: PlanPoint[] = [
    [cx - 22, minY],
    [cx - 22, by + 8],
  ];

  const spotGrades = [
    { pt: [minX + 15, minY + 15] as PlanPoint, elev: 4792 },
    { pt: [cx, by + bd / 2] as PlanPoint, elev: 4791 },
    { pt: [maxX - 15, maxY - 15] as PlanPoint, elev: 4790 },
  ];

  return {
    lotNumber: lot.lotNumber,
    building,
    driveway,
    setbacks,
    well,
    wellSeparationFt: TETON_HEIGHTS_PLAN_RULES.wellSeparationFt,
    septicTank,
    drainfield,
    replacementDrainfield,
    powerLateral,
    gasLateral,
    spotGrades,
    source: "recorded-plan-492361",
  };
}

export function resolveLotNumber(input: {
  address?: string;
  name?: string;
  projectId?: string;
  planHint?: number;
}): number | null {
  if (input.planHint && input.planHint >= 1 && input.planHint <= 12) return input.planHint;
  const byProject = TETON_HEIGHTS_LOTS.find((l) => l.projectId === input.projectId);
  if (byProject) return byProject.lotNumber;
  const text = `${input.address ?? ""} ${input.name ?? ""}`;
  const m = text.match(/lot\s*#?\s*(\d{1,2})/i);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 12) return n;
  }
  if (/teton\s*heights/i.test(text)) return 7;
  return null;
}

export function getLot(lotNumber: number): LotPlan | undefined {
  return TETON_HEIGHTS_LOTS.find((l) => l.lotNumber === lotNumber);
}

export function planToLatLng(pt: PlanPoint): { lat: number; lng: number } {
  const originLat = TETON_HEIGHTS_CENTER.lat - 0.00115;
  const originLng = TETON_HEIGHTS_CENTER.lng - 0.00185;
  const ftPerDegLat = 364000;
  const ftPerDegLng = 364000 * Math.cos((TETON_HEIGHTS_CENTER.lat * Math.PI) / 180);
  return {
    lat: originLat + pt[1] / ftPerDegLat,
    lng: originLng + pt[0] / ftPerDegLng,
  };
}

export function latLngToTile(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y, z };
}

export function tileUrl(z: number, x: number, y: number) {
  return JEFFERSON_GIS.aerialTiles
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

export function projectMercator(lat: number, lng: number, z: number) {
  const scale = 256 * 2 ** z;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = (Math.sin((lat * Math.PI) / 180));
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function sitePlanNarrative(lot: LotPlan, projectName?: string): string {
  const imp = defaultImprovements(lot);
  return [
    `TETON HEIGHTS DIV. 6 — RECORDED WELL & SEPTIC IMPROVEMENT PLAN`,
    `${TETON_HEIGHTS_RECORDED_PLAN.title}`,
    `Instrument No. ${TETON_HEIGHTS_RECORDED_PLAN.instrument} · ${TETON_HEIGHTS_RECORDED_PLAN.surveyor}`,
    `Lot ${lot.lotNumber} · ${lot.acres} ac · ${lot.label}`,
    projectName ? `Job: ${projectName}` : "",
    TETON_HEIGHTS_CENTER.streetRef,
    ``,
    `Domestic well (W): street frontage / 15' PUE — plan (${imp.well[0].toFixed(0)}, ${imp.well[1].toFixed(0)})`,
    `100' domestic well separation required around the well.`,
    `Septic tank: (${imp.septicTank[0].toFixed(0)}, ${imp.septicTank[1].toFixed(0)})`,
    `Primary drainfield: 90 x 38 standard rock and pipe (6-bedroom size as shown).`,
    `Replacement drainfield: 90 x 38, must stay inside the shown site.`,
    `Drainfield to basement dwelling: ${TETON_HEIGHTS_PLAN_RULES.drainfieldToBasementDwellingFt} ft (${TETON_HEIGHTS_PLAN_RULES.idapa}).`,
    `Building footprint on sheet: 68 x 61.`,
    TETON_HEIGHTS_PLAN_RULES.note,
    ``,
    `Recorded sheet: ${TETON_HEIGHTS_RECORDED_PLAN.driveUrl}`,
    `NOT A SURVEY — hire a PLS to mark the drainfield before EIPH install, per the recorded notes.`,
  ]
    .filter(Boolean)
    .join("\n");
}
