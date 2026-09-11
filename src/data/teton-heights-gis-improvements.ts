/** Recorded-plan-style well/septic placement helpers. */
import type { LotPlan, PlanPoint } from "./teton-heights-gis-meta";
import { TETON_HEIGHTS_PLAN_RULES } from "./teton-heights-gis-meta";

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

/** Place well/septic/drainfields per Inst. 492361 schematic pattern. */
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
