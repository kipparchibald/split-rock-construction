/**
 * Holwege Lot 16 — Design Center / site-plan wiring (system of record).
 * Do not invent APN/GIS PIN — none in SoR.
 */
import { HOLWEGE_PLOT_PLAN_JPG_DATA_URL } from "@/lib/holwege-plot-plan-asset";

export const HOLWEGE_PROJECT_ID = "p-holwege";
export const HOLWEGE_CLIENT_ID = "c-holwege";
export const HOLWEGE_LOT_NUMBER = 16;
export const HOLWEGE_BLOCK = 8;
export const HOLWEGE_DIVISION = "Teton Heights Division 6";
export const HOLWEGE_LEGAL =
  "Lot 16, Block 8, Teton Heights Division 6, Jefferson County, ID (Rigby)";
export const HOLWEGE_SEED_ADDRESS =
  "Lot 16 Block 8, Teton Heights Div 6, Rigby ID";
/** River Bend Drafting plan set — plot/site plan is sheet P-8 */
export const HOLWEGE_PLAN_SET_LABEL =
  "River Bend Drafting — Lauren and Cindy Holwege 9-14-2026";
/** Embedded P-8 raster (from plan-set page 8) for GIS overlay */
export const HOLWEGE_PLOT_PLAN_IMAGE_URL = HOLWEGE_PLOT_PLAN_JPG_DATA_URL;
export const HOLWEGE_PLOT_PLAN_PUBLIC_JPG = "/holwege/Holwege-Lot16-PLOT-PLAN-8.jpg";
export const HOLWEGE_PLOT_PLAN_PDF_URL = "/holwege/Holwege-Lot16-PLOT-PLAN.pdf";
export const HOLWEGE_PLAN_FILE_ID = "design-center-p-holwege";
