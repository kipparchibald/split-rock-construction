import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getLot,
  JEFFERSON_GIS,
  latLngToTile,
  planToLatLng,
  projectMercator,
  TETON_HEIGHTS_CENTER,
  tileUrl,
} from "@/data/teton-heights-gis";
import {
  HOLWEGE_LEGAL,
  HOLWEGE_LOT_NUMBER,
  HOLWEGE_PLAN_SET_LABEL,
  HOLWEGE_PLOT_PLAN_IMAGE_URL,
  HOLWEGE_PLOT_PLAN_PDF_URL,
  HOLWEGE_PROJECT_ID,
} from "@/lib/holwege-site";
import { cn } from "@/lib/utils";

const Z = 18;

type Props = {
  projectId?: string;
  projectName?: string;
  lotNumber?: number;
  plotPlanImageUrl?: string;
  plotPlanPdfUrl?: string;
  className?: string;
};

/** Holwege: River Bend P-8 plot plan over Jefferson County GIS aerial. No invented schematic. */
export function PlotPlanGisOverlay({
  projectId = HOLWEGE_PROJECT_ID,
  projectName = "Holwege Residence — Lot 16",
  lotNumber = HOLWEGE_LOT_NUMBER,
  plotPlanImageUrl = HOLWEGE_PLOT_PLAN_IMAGE_URL,
  plotPlanPdfUrl = HOLWEGE_PLOT_PLAN_PDF_URL,
  className,
}: Props) {
  const [plotOpacity, setPlotOpacity] = useState(0.72);
  const [showAerial, setShowAerial] = useState(true);
  const [showPlot, setShowPlot] = useState(true);

  const lot = getLot(lotNumber);
  const center = useMemo(() => {
    if (lot?.centroid) return planToLatLng(lot.centroid);
    return { lat: TETON_HEIGHTS_CENTER.lat, lng: TETON_HEIGHTS_CENTER.lng };
  }, [lot]);

  const tiles = useMemo(() => {
    const centerM = projectMercator(center.lat, center.lng, Z);
    const origin = { x: centerM.x - 320, y: centerM.y - 210 };
    const corners = [
      { lat: center.lat + 0.0011, lng: center.lng - 0.0016 },
      { lat: center.lat - 0.0011, lng: center.lng + 0.0016 },
    ];
    const t0 = latLngToTile(corners[0]!.lat, corners[0]!.lng, Z);
    const t1 = latLngToTile(corners[1]!.lat, corners[1]!.lng, Z);
    const minTx = Math.min(t0.x, t1.x) - 1;
    const maxTx = Math.max(t0.x, t1.x) + 1;
    const minTy = Math.min(t0.y, t1.y) - 1;
    const maxTy = Math.max(t0.y, t1.y) + 1;
    const scale = 256 * 2 ** Z;
    const list: { key: string; url: string; left: number; top: number }[] = [];
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        list.push({
          key: `${Z}/${tx}/${ty}`,
          url: tileUrl(Z, tx, ty),
          left: (tx / 2 ** Z) * scale - origin.x,
          top: (ty / 2 ** Z) * scale - origin.y,
        });
      }
    }
    return list;
  }, [center.lat, center.lng]);

  return (
    <div
      className={cn("overflow-hidden border border-border bg-bg-elevated", className)}
      data-testid="plot-plan-gis-overlay"
      data-project={projectId}
      data-lot={lotNumber}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.08em] text-fg-subtle">Plot plan + county aerial</p>
          <p className="mt-1 text-[13px] font-medium text-fg">{projectName} · Lot {lotNumber}</p>
          <p className="mt-0.5 text-[11px] text-fg-subtle">{HOLWEGE_LEGAL}</p>
          <p className="mt-0.5 text-[11px] text-fg-muted">{HOLWEGE_PLAN_SET_LABEL} · sheet P-8</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">River Bend P-8</Badge>
          <Badge variant="outline">No APN in SoR</Badge>
          <Button size="sm" variant="outline" asChild>
            <a href={plotPlanPdfUrl} target="_blank" rel="noopener noreferrer">
              Open plot PDF <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={JEFFERSON_GIS.portal} target="_blank" rel="noopener noreferrer">
              County GIS <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2 text-[12px]">
        <label className="flex min-h-10 items-center gap-2">
          <input type="checkbox" checked={showAerial} onChange={(e) => setShowAerial(e.target.checked)} />
          GIS aerial
        </label>
        <label className="flex min-h-10 items-center gap-2">
          <input type="checkbox" checked={showPlot} onChange={(e) => setShowPlot(e.target.checked)} />
          Plot plan overlay
        </label>
        <label className="flex min-h-10 flex-1 items-center gap-2 sm:max-w-xs">
          <span className="shrink-0 text-fg-muted">Plot opacity</span>
          <input
            type="range"
            min={15}
            max={100}
            value={Math.round(plotOpacity * 100)}
            onChange={(e) => setPlotOpacity(Number(e.target.value) / 100)}
            className="w-full"
            disabled={!showPlot}
          />
        </label>
      </div>
      <div className="relative w-full overflow-hidden bg-[#1a1f18]" style={{ aspectRatio: "16 / 10", minHeight: 280 }}>
        {showAerial ? (
          <div className="absolute inset-0">
            {tiles.map((tile) => (
              <img
                key={tile.key}
                src={tile.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{ left: tile.left, top: tile.top, width: 256, height: 256 }}
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#2a3028]" />
        )}
        {showPlot ? (
          <img
            src={plotPlanImageUrl}
            alt={`Holwege Lot ${lotNumber} plot plan P-8`}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ opacity: plotOpacity }}
            draggable={false}
          />
        ) : null}
        <div className="pointer-events-none absolute bottom-2 left-2 max-w-[92%] bg-black/55 px-2 py-1 text-[9px] leading-snug text-white/85">
          Aerial: Jefferson County GIS · Plot: River Bend P-8 (authoritative — not invented schematic).
          Confirm recorded plat / PLS before staking. No county APN in SoR.
        </div>
      </div>
    </div>
  );
}
