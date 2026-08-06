import { createFileRoute } from "@tanstack/react-router";
import { PARCEL_SERVICE } from "@/lib/county-parcels";

/**
 * Same-origin proxy for Jefferson County parcels (IDWR FeatureServer).
 * Keeps browser CSP/CORS simple and lets the preview always reach the service.
 */
export const Route = createFileRoute("/api/gis/parcels")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const upstream = new URL(PARCEL_SERVICE.idwrQuery);

        // Forward only known query params
        const allow = [
          "where",
          "geometry",
          "geometryType",
          "inSR",
          "spatialRel",
          "outFields",
          "returnGeometry",
          "outSR",
          "f",
          "resultRecordCount",
          "objectIds",
          "orderByFields",
        ] as const;
        for (const key of allow) {
          const v = url.searchParams.get(key);
          if (v != null && v !== "") upstream.searchParams.set(key, v);
        }
        if (!upstream.searchParams.has("f")) upstream.searchParams.set("f", "geojson");
        if (!upstream.searchParams.has("where")) {
          upstream.searchParams.set("where", "COUNTY='Jefferson'");
        }
        if (!upstream.searchParams.has("outSR")) upstream.searchParams.set("outSR", "4326");

        try {
          const res = await fetch(upstream.toString(), {
            headers: { Accept: "application/geo+json, application/json" },
            signal: AbortSignal.timeout(20_000),
          });
          const body = await res.text();
          return new Response(body, {
            status: res.status,
            headers: {
              "Content-Type": res.headers.get("Content-Type") ?? "application/geo+json",
              "Cache-Control": "public, max-age=300",
              "X-Parcel-Source": "idwr-proxy",
            },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Parcel proxy failed";
          return new Response(JSON.stringify({ error: msg, features: [] }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
