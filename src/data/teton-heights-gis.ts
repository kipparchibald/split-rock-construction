/**
 * Teton Heights (Rigby / Jefferson County, ID) — operational GIS + improvement-plan
 * dataset for site-plan aerial overlays.
 *
 * Geometry is approximate for field/demo use (not a recorded survey). Aligns with
 * public Jefferson County GIS intent and typical Teton Heights improvement-plan
 * elements (ROW, utilities, well/septic). Confirm parcels on:
 *   https://gisportal.co.jefferson.id.us/portweb/home/
 *   https://www.jcgov.us/224/Geographic-Information-Systems-GIS-Mappi
 *
 * Live county parcel polygons load separately via `@/lib/county-parcels` (IDWR).
 */

export const JEFFERSON_GIS = {
  portal: "https://gisportal.co.jefferson.id.us/portweb/home/",
  countyPage: "https://www.jcgov.us/224/Geographic-Information-Systems-GIS-Mappi",
  dataFiles: "https://www.jcgov.us/479/Data-Files",
  aerialTiles:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Esri World Imagery · Jefferson County GIS (reference) · Teton Heights improvement plan overlay (approximate)",
} as const;

export const TETON_HEIGHTS_CENTER = {
  lat: 43.6892,
  lng: -111.8685,
  streetRef: "N 3950 E / Teton Heights, Rigby, ID 83442",
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
  | "contours";

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
    id: "parcels",
    label: "County parcels",
    description: "Jefferson County assessor boundaries (IDWR)",
    defaultOn: true,
    color: "#60a5fa",
  },
  {
    id: "lots",
    label: "Lot lines (plat)",
    description: "Teton Heights Div. #6 lot boundaries",
    defaultOn: true,
    color: "#f5f0e6",
  },
  {
    id: "easements",
    label: "Utility / drainage easements",
    description: "Improvement-plan easement corridors",
    defaultOn: true,
    color: "#fbbf24",
  },
  {
    id: "utilities",
    label: "Power / gas routes",
    description: "Proposed service laterals from ROW",
    defaultOn: true,
    color: "#38bdf8",
  },
  {
    id: "well",
    label: "Pre-approved well sites",
    description: "Plat-designated private well locations",
    defaultOn: true,
    color: "#22d3ee",
  },
  {
    id: "septic",
    label: "Septic / drainfield zones",
    description: "EIPH-oriented placement envelopes",
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
    description: "Proposed home footprint on selected lot",
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
    label: "Spot grades (improve. plan)",
    description: "Illustrative elevation spots — flat buildable lots",
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
    acres: 0.62,
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
    acres: 0.62,
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
    acres: 0.62,
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
    acres: 0.62,
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
    acres: 0.62,
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
    acres: 0.68,
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
    acres: 0.68,
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
    acres: 0.68,
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
    acres: 0.68,
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
    acres: 0.68,
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
    id: "ue-south",
    ring: [
      [40, 260],
      [980, 260],
      [980, 280],
      [40, 280],
      [40, 260],
    ],
  },
  {
    id: "ue-mid",
    ring: [
      [40, 480],
      [980, 480],
      [980, 500],
      [40, 500],
      [40, 480],
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
  septicTank: PlanPoint;
  drainfield: PlanPoint[];
  powerLateral: PlanPoint[];
  gasLateral: PlanPoint[];
  spotGrades: { pt: PlanPoint; elev: number }[];
}

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

  const setbacks: PlanPoint[] = [
    [minX + 10, minY + 30],
    [maxX - 10, minY + 30],
    [maxX - 10, maxY - 20],
    [minX + 10, maxY - 20],
    [minX + 10, minY + 30],
  ];

  const bw = Math.min(48, w * 0.35);
  const bd = Math.min(56, d * 0.32);
  const bx = cx - bw / 2;
  const by = minY + 45;
  const building: PlanPoint[] = [
    [bx, by],
    [bx + bw, by],
    [bx + bw, by + bd],
    [bx, by + bd],
    [bx, by],
  ];

  const driveway: PlanPoint[] = [
    [cx - 8, minY],
    [cx + 8, minY],
    [cx + 8, by],
    [cx - 8, by],
    [cx - 8, minY],
  ];

  const well: PlanPoint = [minX + w * 0.18, maxY - 35];
  const septicTank: PlanPoint = [maxX - w * 0.22, by + bd + 25];
  const drainfield: PlanPoint[] = [
    [maxX - w * 0.42, by + bd + 40],
    [maxX - w * 0.1, by + bd + 40],
    [maxX - w * 0.1, by + bd + 85],
    [maxX - w * 0.42, by + bd + 85],
    [maxX - w * 0.42, by + bd + 40],
  ];

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
    septicTank,
    drainfield,
    powerLateral,
    gasLateral,
    spotGrades,
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
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function sitePlanNarrative(lot: LotPlan, projectName?: string): string {
  const imp = defaultImprovements(lot);
  return [
    `TETON HEIGHTS — SITE PLAN AERIAL OVERLAY (COUNTY PARCELS + IMPROVEMENT PLAN)`,
    `Lot ${lot.lotNumber} · ${lot.acres} ac · ${lot.label}`,
    projectName ? `Job: ${projectName}` : "",
    `Plat reference: Division #6 (schematic) · ${TETON_HEIGHTS_CENTER.streetRef}`,
    ``,
    `Basemap: Esri World Imagery`,
    `County parcels: Idaho IDWR / Jefferson County Assessor (live or cached)`,
    `County GIS portal: ${JEFFERSON_GIS.portal}`,
    ``,
    `Layers: county parcel polygons, lot lines, setbacks, building footprint, driveway,`,
    `utility laterals, pre-approved well, septic tank + drainfield envelope, easements.`,
    ``,
    `Building footprint (plan ft, local): ${imp.building
      .slice(0, 4)
      .map((p) => `(${p[0].toFixed(0)},${p[1].toFixed(0)})`)
      .join(" → ")}`,
    `Well site: (${imp.well[0].toFixed(0)}, ${imp.well[1].toFixed(0)}) plan ft`,
    `Septic tank: (${imp.septicTank[0].toFixed(0)}, ${imp.septicTank[1].toFixed(0)}) plan ft`,
    ``,
    `NOT A SURVEY — Parcel lines are tax mapping only. Confirm bearings, setbacks, and`,
    `easements on recorded plat + Jefferson County GIS before filing.`,
  ]
    .filter(Boolean)
    .join("\n");
}
