/** River Bend P-8 plot plan raster (Lot 16) — assembled from chunk modules. */
import { HOLWEGE_PLOT_P0 } from "@/lib/holwege-plot-plan-asset-p0";
import { HOLWEGE_PLOT_P1 } from "@/lib/holwege-plot-plan-asset-p1";
import { HOLWEGE_PLOT_P2 } from "@/lib/holwege-plot-plan-asset-p2";

export const HOLWEGE_PLOT_PLAN_JPG_DATA_URL =
  ("data:image/jpeg;base64," + HOLWEGE_PLOT_P0 + HOLWEGE_PLOT_P1 + HOLWEGE_PLOT_P2) as string;
