import { describe, expect, it } from "vitest";
import {
  buildParcelQueryUrl,
  pointInRing,
  TETON_HEIGHTS_PARCEL_BBOX,
} from "./county-parcels";

describe("county-parcels", () => {
  it("builds proxy and direct query URLs for Jefferson County", () => {
    const proxy = buildParcelQueryUrl(TETON_HEIGHTS_PARCEL_BBOX, { useProxy: true });
    expect(proxy).toContain("/api/gis/parcels");
    expect(proxy).toContain("COUNTY");
    expect(proxy).toContain("geojson");
    const direct = buildParcelQueryUrl(TETON_HEIGHTS_PARCEL_BBOX, { useProxy: false });
    expect(direct).toContain("gis.idwr.idaho.gov");
  });

  it("point-in-ring works for simple square", () => {
    const ring = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ];
    expect(pointInRing(1, 1, ring)).toBe(true);
    expect(pointInRing(3, 3, ring)).toBe(false);
  });
});
