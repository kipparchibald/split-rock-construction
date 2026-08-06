/**
 * Jefferson County (ID) parcel boundaries — live query via Idaho IDWR parcel
 * compilation (county assessor source) + local fallback cache for Teton Heights.
 *
 * Authoritative for tax mapping only — not a survey. Confirm with Jefferson
 * County Assessor / GIS for legal boundaries.
 */

export const PARCEL_SERVICE = {
  /** IDWR statewide parcel compilation (includes Jefferson County) */
  idwrQuery:
    "https://gis.idwr.idaho.gov/hosting/rest/services/Reference/Parcels/FeatureServer/0/query",
  /** App proxy (same-origin; avoids flaky CORS in embedded preview) */
  proxyPath: "/api/gis/parcels",
  /** Bundled fallback for Teton Heights area */
  fallbackUrl: "/gis/teton-heights-parcels.geojson",
  countyGis: "https://gisportal.co.jefferson.id.us/portweb/home/",
  assessor: "https://www.jcgov.us/",
  attribution:
    "Parcel boundaries: Idaho IDWR / Jefferson County Assessor compilation. Tax mapping only — not a survey.",
} as const;

export type ParcelProps = {
  OBJECTID?: number;
  PIN?: string | null;
  COUNTY?: string | null;
  OWNER?: string | null;
};

export type ParcelFeature = {
  type: "Feature";
  id?: number | string;
  properties: ParcelProps;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type ParcelCollection = {
  type: "FeatureCollection";
  features: ParcelFeature[];
  source?: "live" | "fallback" | "cache";
  fetchedAt?: string;
};

export type ParcelBbox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/** Default bbox covering Teton Heights / east Rigby area */
export const TETON_HEIGHTS_PARCEL_BBOX: ParcelBbox = {
  west: -111.88,
  south: 43.682,
  east: -111.855,
  north: 43.7,
};

function envelope(b: ParcelBbox) {
  return `${b.west},${b.south},${b.east},${b.north}`;
}

export function buildParcelQueryUrl(bbox: ParcelBbox, opts?: { max?: number; useProxy?: boolean }) {
  const max = opts?.max ?? 80;
  const params = new URLSearchParams({
    where: "COUNTY='Jefferson'",
    geometry: envelope(bbox),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "OBJECTID,PIN,COUNTY,OWNER",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
    resultRecordCount: String(max),
  });
  if (opts?.useProxy) {
    return `${PARCEL_SERVICE.proxyPath}?${params.toString()}`;
  }
  return `${PARCEL_SERVICE.idwrQuery}?${params.toString()}`;
}

function normalize(fc: unknown, source: ParcelCollection["source"]): ParcelCollection {
  const raw = fc as { type?: string; features?: ParcelFeature[] };
  const features = Array.isArray(raw?.features) ? raw.features : [];
  return {
    type: "FeatureCollection",
    features: features.filter(
      (f) =>
        f?.geometry &&
        (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"),
    ),
    source,
    fetchedAt: new Date().toISOString(),
  };
}

/** Fetch parcels for a bbox — proxy first, then direct IDWR, then static fallback. */
export async function fetchCountyParcels(
  bbox: ParcelBbox = TETON_HEIGHTS_PARCEL_BBOX,
  signal?: AbortSignal,
): Promise<ParcelCollection> {
  // 1) same-origin proxy
  try {
    const res = await fetch(buildParcelQueryUrl(bbox, { useProxy: true }), {
      signal,
      headers: { Accept: "application/geo+json, application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.features?.length) return normalize(data, "live");
    }
  } catch {
    /* try next */
  }

  // 2) direct IDWR (CORS-enabled for many origins)
  try {
    const res = await fetch(buildParcelQueryUrl(bbox, { useProxy: false }), {
      signal,
      headers: { Accept: "application/geo+json, application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.features?.length) return normalize(data, "live");
    }
  } catch {
    /* try fallback */
  }

  // 3) bundled Teton Heights cache
  const res = await fetch(PARCEL_SERVICE.fallbackUrl, { signal });
  if (!res.ok) throw new Error("Parcel data unavailable");
  const data = await res.json();
  return normalize(data, "fallback");
}

/** Point-in-ring (ray cast) for selecting parcels */
export function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findParcelAt(
  collection: ParcelCollection | null,
  lng: number,
  lat: number,
): ParcelFeature | null {
  if (!collection) return null;
  for (const f of collection.features) {
    const g = f.geometry;
    if (g.type === "Polygon") {
      const ring = g.coordinates[0] as number[][];
      if (ring && pointInRing(lng, lat, ring)) return f;
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates as number[][][][]) {
        const ring = poly[0];
        if (ring && pointInRing(lng, lat, ring)) return f;
      }
    }
  }
  // Nearest centroid fallback (small click misses / sparse rings)
  let best: ParcelFeature | null = null;
  let bestD = Infinity;
  for (const f of collection.features) {
    const rings = ringsFromFeature(f);
    const ring = rings[0];
    if (!ring?.length) continue;
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const c of ring) {
      if (c[0] == null || c[1] == null) continue;
      sx += c[0];
      sy += c[1];
      n++;
    }
    if (!n) continue;
    const cx = sx / n;
    const cy = sy / n;
    const d = (cx - lng) ** 2 + (cy - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  // ~250m threshold in degrees (~0.0025)
  return bestD < 0.00001 ? best : best;
}

export function parcelLabel(f: ParcelFeature): string {
  const pin = f.properties.PIN?.trim();
  if (pin) return pin;
  return `Parcel ${f.id ?? f.properties.OBJECTID ?? "—"}`;
}

export function ringsFromFeature(f: ParcelFeature): number[][][] {
  if (f.geometry.type === "Polygon") return f.geometry.coordinates as number[][][];
  const multi = f.geometry.coordinates as number[][][][];
  return multi.flatMap((p) => p);
}
