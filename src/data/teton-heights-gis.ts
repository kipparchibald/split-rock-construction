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
