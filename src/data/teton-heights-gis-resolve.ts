/** Lot resolution + map projection helpers. */
import type { LotPlan, PlanPoint } from "./teton-heights-gis-meta";
import {
  JEFFERSON_GIS,
  TETON_HEIGHTS_CENTER,
  TETON_HEIGHTS_PLAN_RULES,
  TETON_HEIGHTS_RECORDED_PLAN,
} from "./teton-heights-gis-meta";
import { TETON_HEIGHTS_LOTS } from "./teton-heights-gis-lots";
import { defaultImprovements } from "./teton-heights-gis-improvements";

/** True when `n` exists in the GIS catalog (lots 1–12 plus schematic Lot 16). */
export function isCatalogLotNumber(n: number): boolean {
  return Number.isFinite(n) && TETON_HEIGHTS_LOTS.some((l) => l.lotNumber === n);
}

/**
 * Parse a lot query/param into a catalog lot number.
 * Returns null when missing or not in the catalog (does not invent a default).
 */
export function parseLot(raw?: string | number | null): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return isCatalogLotNumber(i) ? i : null;
}

export function resolveLotNumber(input: {
  address?: string;
  name?: string;
  projectId?: string;
  planHint?: number;
}): number | null {
  if (input.planHint != null && isCatalogLotNumber(input.planHint)) return input.planHint;

  if (input.projectId) {
    const byProject = TETON_HEIGHTS_LOTS.find((l) => l.projectId === input.projectId);
    if (byProject) return byProject.lotNumber;
  }

  const hay = `${input.address ?? ""} ${input.name ?? ""}`;
  const isHolwege = input.projectId === "p-holwege" || /holwege/i.test(hay);

  const m = hay.match(/lot\s*#?\s*(\d{1,2})\b/i);
  if (m) {
    const n = Number(m[1]);
    if (isCatalogLotNumber(n)) return n;
  }

  // Holwege must never fall back to Lot 7 (Cole Spec on p4).
  if (isHolwege) {
    const holwegeLot = TETON_HEIGHTS_LOTS.find((l) => l.projectId === "p-holwege");
    return holwegeLot?.lotNumber ?? 16;
  }

  if (/teton\s*heights/i.test(hay)) return 7;
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
