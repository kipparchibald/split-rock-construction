import { useEffect, useMemo, useState } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  defaultImprovements,
  getLot,
  JEFFERSON_GIS,
  latLngToTile,
  PLAN_LAYERS,
  type PlanLayerId,
  planToLatLng,
  projectMercator,
  resolveLotNumber,
  TETON_HEIGHTS_CENTER,
  TETON_HEIGHTS_LOTS,
  TETON_HEIGHTS_RECORDED_PLAN,
  TETON_STREET_ROW,
  UTILITY_EASEMENTS,
  DRAINAGE_EASEMENT,
  type PlanPoint,
  tileUrl,
} from "@/data/teton-heights-gis";
import {
  fetchCountyParcels,
  findParcelAt,
  PARCEL_SERVICE,
  parcelLabel,
  ringsFromFeature,
  TETON_HEIGHTS_PARCEL_BBOX,
  type ParcelCollection,
  type ParcelFeature,
} from "@/lib/county-parcels";
import { cn } from "@/lib/utils";

const Z = 18;
const VIEW_W = 640;
const VIEW_H = 420;

type Props = {
  projectId?: string;
  projectName?: string;
  address?: string;
  lotNumber?: number | null;
  className?: string;
};

function ringToSvg(ring: PlanPoint[], origin: { x: number; y: number }): string {
  return (
    ring
      .map((pt, i) => {
        const ll = planToLatLng(pt);
        const m = projectMercator(ll.lat, ll.lng, Z);
        const x = m.x - origin.x;
        const y = m.y - origin.y;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

function lineToSvg(pts: PlanPoint[], origin: { x: number; y: number }): string {
  return pts
    .map((pt, i) => {
      const ll = planToLatLng(pt);
      const m = projectMercator(ll.lat, ll.lng, Z);
      const x = m.x - origin.x;
      const y = m.y - origin.y;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function pointSvg(pt: PlanPoint, origin: { x: number; y: number }) {
  const ll = planToLatLng(pt);
  const m = projectMercator(ll.lat, ll.lng, Z);
  return { x: m.x - origin.x, y: m.y - origin.y };
}

function geoRingToSvg(ring: number[][], origin: { x: number; y: number }): string {
  if (!ring?.length) return "";
  return (
    ring
      .map((c, i) => {
        const lng = c[0]!;
        const lat = c[1]!;
        const m = projectMercator(lat, lng, Z);
        const x = m.x - origin.x;
        const y = m.y - origin.y;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

export function SitePlanAerialOverlay({
  projectId,
  projectName,
  address,
  lotNumber: forcedLot,
  className = "",
}: Props) {
  const resolved =
    forcedLot ?? resolveLotNumber({ projectId, address, name: projectName }) ?? 7;

  const [selectedLot, setSelectedLot] = useState(resolved);
  const [layers, setLayers] = useState<Record<PlanLayerId, boolean>>(() =>
    Object.fromEntries(PLAN_LAYERS.map((l) => [l.id, l.defaultOn])) as Record<
      PlanLayerId,
      boolean
    >,
  );
  const [parcels, setParcels] = useState<ParcelCollection | null>(null);
  const [parcelStatus, setParcelStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedParcel, setSelectedParcel] = useState<ParcelFeature | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);

  const lot = getLot(selectedLot) ?? TETON_HEIGHTS_LOTS[6]!;
  const imp = useMemo(() => defaultImprovements(lot), [lot]);

  useEffect(() => {
    const ac = new AbortController();
    setParcelStatus("loading");
    void fetchCountyParcels(TETON_HEIGHTS_PARCEL_BBOX, ac.signal)
      .then((fc) => {
        setParcels(fc);
        setParcelStatus("ready");
      })
      .catch(() => {
        setParcelStatus("error");
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const view = useMemo(() => {
    const centerLl = planToLatLng(lot.centroid);
    const centerM = projectMercator(centerLl.lat, centerLl.lng, Z);
    const origin = { x: centerM.x - VIEW_W / 2, y: centerM.y - VIEW_H / 2 };
    const corners = [
      { lat: centerLl.lat + 0.0012, lng: centerLl.lng - 0.0018 },
      { lat: centerLl.lat - 0.0012, lng: centerLl.lng + 0.0018 },
    ];
    const t0 = latLngToTile(corners[0]!.lat, corners[0]!.lng, Z);
    const t1 = latLngToTile(corners[1]!.lat, corners[1]!.lng, Z);
    const minTx = Math.min(t0.x, t1.x) - 1;
    const maxTx = Math.max(t0.x, t1.x) + 1;
    const minTy = Math.min(t0.y, t1.y) - 1;
    const maxTy = Math.max(t0.y, t1.y) + 1;
    const tiles: { key: string; url: string; left: number; top: number }[] = [];
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const scale = 256 * 2 ** Z;
        const tileLeft = (tx / 2 ** Z) * scale - origin.x;
        const tileTop = (ty / 2 ** Z) * scale - origin.y;
        tiles.push({
          key: `${Z}/${tx}/${ty}`,
          url: tileUrl(Z, tx, ty),
          left: tileLeft,
          top: tileTop,
        });
      }
    }
    return { origin, tiles, centerLl };
  }, [lot]);

  function toggle(id: PlanLayerId) {
    setLayers((s) => ({ ...s, [id]: !s[id] }));
  }

  function onMapClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!layers.parcels || !parcels) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = pt.matrixTransform(ctm.inverse());
    const mercX = view.origin.x + local.x;
    const mercY = view.origin.y + local.y;
    const scale = 256 * 2 ** Z;
    const lng = (mercX / scale) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * mercY) / scale;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    const hit = findParcelAt(parcels, lng, lat);
    setSelectedParcel(hit);
  }

  const parcelCount = parcels?.features.length ?? 0;
  const mapHeight = fullscreen ? "min(70dvh, 560px)" : undefined;
  const wellPx = pointSvg(imp.well, view.origin);
  const wellRingPx = pointSvg(
    [imp.well[0] + imp.wellSeparationFt, imp.well[1]],
    view.origin,
  );
  const wellRingR = Math.abs(wellRingPx.x - wellPx.x);

  const shell = (
    <div
      className={cn(
        "w-full max-w-full min-w-0 overflow-hidden border border-border bg-bg-elevated",
        fullscreen &&
          "fixed inset-0 z-50 flex flex-col overflow-y-auto border-0 bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      data-testid="site-plan-shell"
      data-fullscreen={fullscreen ? "true" : "false"}
    >
      <div className="flex w-full min-w-0 flex-wrap items-start justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="label-caps">Site plan · GIS + recorded well & septic</p>
          <p className="mt-1 text-[13px] font-medium text-fg">
            Teton Heights · Lot {lot.lotNumber}
            {projectName ? ` · ${projectName}` : ""}
          </p>
          <p className="mt-0.5 text-[11px] text-fg-subtle">
            Inst. {TETON_HEIGHTS_RECORDED_PLAN.instrument} · {lot.acres} ac
            {parcelStatus === "ready"
              ? ` · ${parcelCount} parcels (${parcels?.source === "live" ? "live GIS" : "cached GIS"})`
              : parcelStatus === "loading"
                ? " · loading Jefferson County GIS…"
                : " · GIS parcel load failed"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">County GIS</Badge>
          <Badge variant="outline">Inst. 492361</Badge>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-10"
            data-testid="site-plan-fullscreen"
            onClick={() => setFullscreen((f) => !f)}
          >
            {fullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Exit full
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                Full screen
              </>
            )}
          </Button>
          {fullscreen ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Close full screen"
              onClick={() => setFullscreen(false)}
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto border-b border-border px-3 py-2">
        <span className="mr-1 shrink-0 self-center text-[10px] uppercase tracking-[0.08em] text-fg-subtle">
          Lot
        </span>
        {TETON_HEIGHTS_LOTS.map((l) => (
          <button
            key={l.lotNumber}
            type="button"
            className={cn(
              "min-h-10 min-w-10 shrink-0 border px-2 text-[12px] font-medium",
              selectedLot === l.lotNumber
                ? "border-primary bg-primary text-primary-fg"
                : "border-border bg-bg text-fg-muted",
            )}
            onClick={() => setSelectedLot(l.lotNumber)}
          >
            {l.lotNumber}
            {l.projectId ? "*" : ""}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "grid min-w-0 gap-0",
          fullscreen ? "flex-1 lg:grid-cols-[1fr_220px]" : "lg:grid-cols-[1fr_200px]",
        )}
      >
        <div
          className="relative min-w-0 overflow-hidden bg-[#1a1f18]"
          style={{ height: mapHeight ?? VIEW_H, minHeight: fullscreen ? 280 : Math.round(VIEW_H * 0.75) }}
          data-testid="site-plan-aerial"
        >
          {layers.aerial ? (
            view.tiles.map((t) => (
              <img
                key={t.key}
                src={t.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{ left: t.left, top: t.top, width: 256, height: 256 }}
                loading="lazy"
              />
            ))
          ) : (
            <div className="absolute inset-0 bg-[#2a3028]" />
          )}

          <svg
            className="absolute inset-0 h-full w-full touch-manipulation"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid slice"
            onClick={onMapClick}
            role="img"
            aria-label="Site plan map with Jefferson County GIS parcels and recorded well septic plan"
          >
            {layers.parcels && parcels
              ? parcels.features.map((f) => {
                  const sel =
                    selectedParcel &&
                    (selectedParcel.id === f.id ||
                      selectedParcel.properties.PIN === f.properties.PIN);
                  const rings = ringsFromFeature(f);
                  return rings.map((ring, ri) => (
                    <path
                      key={`${f.id ?? f.properties.PIN}-${ri}`}
                      d={geoRingToSvg(ring, view.origin)}
                      fill={sel ? "rgba(96,165,250,0.28)" : "rgba(96,165,250,0.08)"}
                      stroke={sel ? "rgba(147,197,253,0.95)" : "rgba(96,165,250,0.65)"}
                      strokeWidth={sel ? 2 : 1}
                      className="cursor-pointer"
                    />
                  ));
                })
              : null}

            {layers.lots ? (
              <path
                d={lineToSvg(TETON_STREET_ROW, view.origin)}
                fill="none"
                stroke="rgba(245,240,230,0.55)"
                strokeWidth={10}
                strokeLinecap="square"
              />
            ) : null}

            {layers.easements ? (
              <>
                {UTILITY_EASEMENTS.map((e) => (
                  <path
                    key={e.id}
                    d={ringToSvg(e.ring, view.origin)}
                    fill="rgba(251,191,36,0.18)"
                    stroke="rgba(251,191,36,0.7)"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                ))}
                <path
                  d={ringToSvg(DRAINAGE_EASEMENT, view.origin)}
                  fill="rgba(56,189,248,0.12)"
                  stroke="rgba(56,189,248,0.55)"
                  strokeWidth={1}
                />
              </>
            ) : null}

            {layers.lots
              ? TETON_HEIGHTS_LOTS.map((l) => {
                  const active = l.lotNumber === lot.lotNumber;
                  return (
                    <g key={l.lotNumber}>
                      <path
                        d={ringToSvg(l.ring, view.origin)}
                        fill={active ? "rgba(245,240,230,0.12)" : "rgba(245,240,230,0.03)"}
                        stroke={active ? "rgba(245,240,230,0.95)" : "rgba(245,240,230,0.35)"}
                        strokeWidth={active ? 2 : 1}
                        className="cursor-pointer"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedLot(l.lotNumber);
                        }}
                      />
                      {(() => {
                        const c = pointSvg(l.centroid, view.origin);
                        return (
                          <text x={c.x} y={c.y} textAnchor="middle" fill="rgba(255,255,255,0.8)" style={{ fontSize: 11, fontWeight: 500 }}>
                            {l.lotNumber}
                          </text>
                        );
                      })()}
                    </g>
                  );
                })
              : null}

            {layers.setbacks ? (
              <path d={ringToSvg(imp.setbacks, view.origin)} fill="none" stroke="rgba(251,146,60,0.85)" strokeWidth={1.5} strokeDasharray="6 4" />
            ) : null}

            {layers.driveway ? (
              <path d={ringToSvg(imp.driveway, view.origin)} fill="rgba(196,181,160,0.55)" stroke="rgba(196,181,160,0.9)" strokeWidth={1} />
            ) : null}

            {layers.building ? (
              <path d={ringToSvg(imp.building, view.origin)} fill="rgba(248,113,113,0.45)" stroke="rgba(254,202,202,0.95)" strokeWidth={2} />
            ) : null}

            {layers.utilities ? (
              <>
                <path d={lineToSvg(imp.powerLateral, view.origin)} fill="none" stroke="rgba(56,189,248,0.95)" strokeWidth={2} />
                <path d={lineToSvg(imp.gasLateral, view.origin)} fill="none" stroke="rgba(251,146,60,0.9)" strokeWidth={2} strokeDasharray="3 2" />
              </>
            ) : null}

            {layers.septic ? (
              <>
                <path d={ringToSvg(imp.drainfield, view.origin)} fill="rgba(163,230,53,0.28)" stroke="rgba(163,230,53,0.9)" strokeWidth={1.5} />
                <path d={ringToSvg(imp.replacementDrainfield, view.origin)} fill="rgba(163,230,53,0.12)" stroke="rgba(163,230,53,0.7)" strokeWidth={1} strokeDasharray="4 3" />
                {(() => {
                  const p = pointSvg(imp.septicTank, view.origin);
                  return <circle cx={p.x} cy={p.y} r={5} fill="rgba(163,230,53,0.9)" stroke="#fff" strokeWidth={1} />;
                })()}
              </>
            ) : null}

            {layers.well ? (
              <g>
                <circle cx={wellPx.x} cy={wellPx.y} r={wellRingR} fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.55)" strokeWidth={1} strokeDasharray="5 4" />
                <circle cx={wellPx.x} cy={wellPx.y} r={7} fill="none" stroke="rgba(34,211,238,0.95)" strokeWidth={2} />
                <circle cx={wellPx.x} cy={wellPx.y} r={2.5} fill="rgba(34,211,238,0.95)" />
                <text x={wellPx.x + 10} y={wellPx.y - 8} fill="rgba(165,243,252,0.95)" style={{ fontSize: 9, fontWeight: 600 }}>
                  W 100'
                </text>
              </g>
            ) : null}

            {layers.contours
              ? imp.spotGrades.map((g, i) => {
                  const p = pointSvg(g.pt, view.origin);
                  return (
                    <text key={i} x={p.x} y={p.y} fill="rgba(255,255,255,0.7)" style={{ fontSize: 9 }}>
                      {g.elev}
                    </text>
                  );
                })
              : null}

            <g transform={`translate(${VIEW_W - 36}, 28)`}>
              <polygon points="0,-14 6,8 -6,8" fill="white" opacity={0.85} />
              <text y={18} textAnchor="middle" fill="white" style={{ fontSize: 9 }} opacity={0.85}>
                N
              </text>
            </g>
          </svg>

          <div className="pointer-events-none absolute bottom-2 left-2 max-w-[92%] bg-black/55 px-2 py-1 text-[9px] leading-snug text-white/85">
            {JEFFERSON_GIS.attribution} · {PARCEL_SERVICE.attribution}
          </div>

          <button
            type="button"
            className="absolute right-2 top-2 min-h-10 border border-border bg-bg-elevated/95 px-3 text-[11px] font-medium text-fg lg:hidden"
            onClick={() => setLayersOpen((o) => !o)}
            data-testid="site-plan-layers-toggle"
          >
            {layersOpen ? "Hide layers" : "Layers"}
          </button>
        </div>

        <div className={cn("border-t border-border p-3 lg:border-l lg:border-t-0", !layersOpen && "hidden lg:block")}>
          <p className="label-caps mb-2">GIS layers</p>
          <ul className="grid grid-cols-2 gap-1.5 lg:grid-cols-1 lg:space-y-0">
            {PLAN_LAYERS.map((l) => (
              <li key={l.id}>
                <label className="flex min-h-11 cursor-pointer items-start gap-2 border border-border px-2 py-2 text-[12px] lg:border-0 lg:px-0 lg:py-0">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={layers[l.id]} onChange={() => toggle(l.id)} />
                  <span>
                    <span className="font-medium text-fg">{l.label}</span>
                    <span className="hidden text-[10px] text-fg-subtle lg:block">{l.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          {layers.recordedPlan ? (
            <a
              href={TETON_HEIGHTS_RECORDED_PLAN.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block border border-border bg-bg p-2"
              data-testid="recorded-plan-link"
            >
              <p className="text-[11px] font-medium text-fg">Recorded well & septic sheet</p>
              <p className="mt-0.5 text-[10px] text-fg-subtle">
                Inst. {TETON_HEIGHTS_RECORDED_PLAN.instrument} · {TETON_HEIGHTS_RECORDED_PLAN.date} · open full plan
              </p>
            </a>
          ) : null}

          {selectedParcel ? (
            <div className="mt-3 border border-border bg-bg-subtle p-2.5" data-testid="parcel-detail">
              <p className="label-caps mb-1">Selected GIS parcel</p>
              <p className="text-[12px] font-medium text-fg">{parcelLabel(selectedParcel)}</p>
              <dl className="mt-1.5 space-y-1 text-[11px] text-fg-muted">
                <div className="flex justify-between gap-2">
                  <dt>PIN</dt>
                  <dd className="font-mono text-fg">{selectedParcel.properties.PIN ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>County</dt>
                  <dd>{selectedParcel.properties.COUNTY ?? "Jefferson"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Owner</dt>
                  <dd className="text-right">{selectedParcel.properties.OWNER?.trim() || "Not published"}</dd>
                </div>
              </dl>
              <button type="button" className="mt-2 min-h-10 text-[11px] text-fg-subtle underline-offset-2 hover:underline" onClick={() => setSelectedParcel(null)}>
                Clear selection
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] leading-relaxed text-fg-subtle">Tap a blue Jefferson County GIS parcel, or pick a PIN below.</p>
              {parcels && parcels.features.length > 0 ? (
                <div className="max-h-28 overflow-auto border border-border" data-testid="parcel-list">
                  {parcels.features.slice(0, 24).map((f) => (
                    <button
                      key={String(f.id ?? f.properties.PIN)}
                      type="button"
                      className="block min-h-10 w-full border-b border-border px-2 py-2 text-left font-mono text-[11px] text-fg-muted last:border-0 hover:bg-bg-subtle hover:text-fg"
                      onClick={() => setSelectedParcel(f)}
                    >
                      {parcelLabel(f)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-fg-subtle">
            GIS parcels are tax mapping. Well and septic follow Inst. 492361. Hire a PLS to mark the drainfield before EIPH install.
          </p>
          <a href={JEFFERSON_GIS.portal} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center text-[11px] text-fg-muted underline-offset-2 hover:underline">
            Jefferson County GIS portal ↗
          </a>
        </div>
      </div>
    </div>
  );

  return shell;
}
