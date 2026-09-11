/** Lot rings + easements — schematic working grid (Lot 16 = Holwege p-holwege). */
import type { LotPlan, PlanPoint } from "./teton-heights-gis-meta";

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
  {
    lotNumber: 16,
    label: "Lot 16 · Block 8",
    ring: [
      [800, 520],
      [980, 520],
      [980, 700],
      [800, 700],
      [800, 520],
    ],
    centroid: [890, 610],
    acres: 0.6,
    projectId: "p-holwege",
    notes:
      "Holwege Residence — Div 6 Block 8. Schematic working-grid overlay only (no recorded plan-ft coords in catalog). Confirm bearings/pins on recorded plat + PLS before staking. Well/septic pattern follows Inst. 492361 schematically.",
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
