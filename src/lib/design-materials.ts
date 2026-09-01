/**
 * Procedural finish materials for the Design Center.
 * Category-aware texture kinds + canvas generators — no committed image binaries.
 */
import type { DesignCategory, DesignOption } from "@/data/types";

export type TextureKind =
  | "paint-wall"
  | "wood-plank"
  | "carpet"
  | "tile-floor"
  | "cabinet-painted"
  | "cabinet-stained"
  | "cabinet-walnut"
  | "quartz-veined"
  | "quartz-matte"
  | "quartz-leathered"
  | "subway-tile"
  | "zellige-tile"
  | "vertical-stack-tile"
  | "slab"
  | "herringbone-tile"
  | "ceramic-tile"
  | "metal-chrome"
  | "metal-brushed"
  | "metal-black"
  | "metal-brass"
  | "appliance-stainless"
  | "lap-siding"
  | "board-batten"
  | "stone"
  | "shingle"
  | "metal-roof"
  | "wood-door"
  | "flat-color";

export interface MaterialProfile {
  kind: TextureKind;
  roughness: number;
  metalness: number;
  emissiveIntensity?: number;
}

export interface SwatchStyle {
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: string;
}

const textureCache = new Map<string, HTMLCanvasElement>();

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    clamp(Math.round(v * 255), 0, 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const f = 1 + amount;
  return rgbToHex(clamp(r * f, 0, 1), clamp(g * f, 0, 1), clamp(b * f, 0, 1));
}

function noise(x: number, y: number, seed = 1): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function fillBase(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
}

/** Map catalog option → procedural texture kind (category-aware). */
export function resolveTextureKind(
  option: DesignOption | undefined,
  category?: DesignCategory,
): TextureKind {
  const cat = category ?? option?.category;
  const id = option?.id ?? "";
  const hint = (option?.imageHint ?? "").toLowerCase();
  const finish = (option?.finish ?? "").toLowerCase();
  const tags = option?.tags ?? [];

  if (!cat) return "flat-color";

  switch (cat) {
    case "paint":
      return hint.includes("texture") || hint.includes("clay") ? "paint-wall" : "paint-wall";

    case "flooring":
      if (id.includes("carpet") || hint.includes("carpet")) return "carpet";
      if (id.includes("tile") || hint.includes("tile") || hint.includes("porcelain"))
        return "tile-floor";
      return "wood-plank";

    case "cabinets":
      if (id.includes("walnut") || option?.woodSpecies?.toLowerCase().includes("walnut"))
        return "cabinet-walnut";
      if (
        finish.includes("stain") ||
        finish.includes("veneer") ||
        option?.woodSpecies ||
        id.includes("oak") ||
        id.includes("stained")
      )
        return "cabinet-stained";
      return "cabinet-painted";

    case "countertops":
      if (finish.includes("leather")) return "quartz-leathered";
      if (finish.includes("matte") || id.includes("concrete")) return "quartz-matte";
      if (id.includes("porcelain") || hint.includes("slab")) return "slab";
      return "quartz-veined";

    case "backsplash":
      if (id.includes("zellige") || hint.includes("zellige")) return "zellige-tile";
      if (id.includes("vertical") || hint.includes("vertical")) return "vertical-stack-tile";
      if (id.includes("slab") || hint.includes("slab")) return "slab";
      return "subway-tile";

    case "tile":
      if (id.includes("herringbone") || hint.includes("herringbone")) return "herringbone-tile";
      if (id.includes("slab") || hint.includes("slab")) return "slab";
      return "ceramic-tile";

    case "fixtures":
      if (finish.includes("black") || id.includes("black")) return "metal-black";
      if (finish.includes("bronze") || finish.includes("brass") || id.includes("mixed"))
        return "metal-brass";
      if (finish.includes("brushed") || id.includes("nickel")) return "metal-brushed";
      return "metal-chrome";

    case "hardware":
      if (finish.includes("black")) return "metal-black";
      if (finish.includes("brass")) return "metal-brass";
      return "metal-brushed";

    case "lighting":
      if (finish.includes("brass")) return "metal-brass";
      if (finish.includes("black")) return "metal-black";
      return "flat-color";

    case "appliances":
      if (finish.includes("black")) return "metal-black";
      return "appliance-stainless";

    case "exterior":
      if (id.includes("stone") || hint.includes("stone")) return "stone";
      if (id.includes("board") || hint.includes("batten")) return "board-batten";
      if (id.includes("metal") || tags.includes("mountain modern")) return "metal-roof";
      return "lap-siding";

    case "roofing":
      if (id.includes("metal") || hint.includes("metal")) return "metal-roof";
      return "shingle";

    case "doors":
      if (id.includes("garage") || finish.includes("painted")) return "flat-color";
      return "wood-door";

    default:
      return "flat-color";
  }
}

export function getMaterialProfile(
  option: DesignOption | undefined,
  category?: DesignCategory,
): MaterialProfile {
  const kind = resolveTextureKind(option, category);
  switch (kind) {
    case "metal-chrome":
      return { kind, roughness: 0.18, metalness: 0.92 };
    case "metal-brushed":
      return { kind, roughness: 0.38, metalness: 0.78 };
    case "metal-black":
      return { kind, roughness: 0.42, metalness: 0.65 };
    case "metal-brass":
      return { kind, roughness: 0.35, metalness: 0.82 };
    case "appliance-stainless":
      return { kind, roughness: 0.28, metalness: 0.72 };
    case "quartz-veined":
      return { kind, roughness: 0.22, metalness: 0.08 };
    case "quartz-matte":
      return { kind, roughness: 0.55, metalness: 0.04 };
    case "quartz-leathered":
      return { kind, roughness: 0.72, metalness: 0.06 };
    case "slab":
      return { kind, roughness: 0.3, metalness: 0.05 };
    case "wood-plank":
    case "cabinet-stained":
    case "cabinet-walnut":
    case "wood-door":
      return { kind, roughness: 0.48, metalness: 0.02 };
    case "cabinet-painted":
      return { kind, roughness: 0.42, metalness: 0.03 };
    case "carpet":
      return { kind, roughness: 0.95, metalness: 0 };
    case "subway-tile":
    case "zellige-tile":
    case "vertical-stack-tile":
    case "herringbone-tile":
    case "ceramic-tile":
    case "tile-floor":
      return { kind, roughness: 0.38, metalness: 0.02 };
    case "lap-siding":
    case "board-batten":
      return { kind, roughness: 0.72, metalness: 0.02 };
    case "stone":
      return { kind, roughness: 0.88, metalness: 0.01 };
    case "shingle":
      return { kind, roughness: 0.82, metalness: 0.04 };
    case "metal-roof":
      return { kind, roughness: 0.35, metalness: 0.55 };
    case "paint-wall":
      return { kind, roughness: 0.88, metalness: 0 };
    default:
      return { kind, roughness: 0.65, metalness: 0.05 };
  }
}

function drawWoodPlank(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  const plankH = size / 6;
  for (let row = 0; row < 6; row++) {
    const y = row * plankH;
    const offset = row % 2 === 0 ? 0 : size * 0.28;
    ctx.fillStyle = shade(hex, row % 2 ? -0.05 : 0.04);
    ctx.fillRect(0, y, size, plankH - 1);
    ctx.strokeStyle = "rgba(40,28,16,0.28)";
    ctx.lineWidth = Math.max(1, size / 256);
    ctx.beginPath();
    ctx.moveTo(0, y + plankH - 0.5);
    ctx.lineTo(size, y + plankH - 0.5);
    ctx.stroke();
    const joint = ((offset + row * 37) % size);
    ctx.strokeStyle = "rgba(40,28,16,0.22)";
    ctx.beginPath();
    ctx.moveTo(joint, y);
    ctx.lineTo(joint, y + plankH);
    ctx.stroke();
    for (let gx = 0; gx < size; gx += 2) {
      const n = noise(gx * 0.06, y * 0.04, row + 2);
      const grain = 0.015 + n * 0.05;
      ctx.fillStyle = `rgba(30,18,8,${grain})`;
      const gy = y + 2 + noise(gx, row) * (plankH - 4);
      ctx.fillRect(gx, gy, 2, Math.max(1, plankH * 0.12));
    }
    if (noise(row, 9) > 0.82) {
      const kx = noise(row, 11) * size;
      const ky = y + plankH * 0.45;
      ctx.fillStyle = "rgba(40,24,12,0.28)";
      ctx.beginPath();
      ctx.ellipse(kx, ky, plankH * 0.18, plankH * 0.1, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCarpet(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = noise(x * 0.15, y * 0.15);
      ctx.fillStyle = n > 0.5 ? shade(hex, 0.03) : shade(hex, -0.03);
      ctx.fillRect(x, y, 2, 2);
    }
  }
}

function drawTileGrid(
  ctx: CanvasRenderingContext2D,
  size: number,
  hex: string,
  tileW: number,
  tileH: number,
  grout = "#d8d5d0",
) {
  fillBase(ctx, size, grout);
  for (let y = 0; y < size; y += tileH) {
    for (let x = 0; x < size; x += tileW) {
      const n = noise(x, y);
      ctx.fillStyle = shade(hex, (n - 0.5) * 0.08);
      ctx.fillRect(x + 2, y + 2, tileW - 3, tileH - 3);
    }
  }
}

function drawQuartzVeined(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = noise(x * 0.07, y * 0.07, 3);
      if (n > 0.62) {
        ctx.fillStyle = `rgba(255,255,255,${(n - 0.62) * 0.18})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
  const scale = size / 256;
  for (let i = 0; i < 18; i++) {
    const y0 = noise(i, 1) * size;
    ctx.strokeStyle = `rgba(110,105,98,${0.12 + noise(i, 7) * 0.18})`;
    ctx.lineWidth = (0.8 + noise(i, 8) * 2.2) * scale;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= size; x += 6) {
      ctx.lineTo(x, y0 + Math.sin(x * 0.035 + i) * 14 * scale + (noise(x * 0.2, i) - 0.5) * 16 * scale);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(220,214,205,0.22)";
  ctx.lineWidth = 1.1 * scale;
  for (let i = 0; i < 10; i++) {
    const x0 = noise(i, 3) * size;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    for (let y = 0; y <= size; y += 10) {
      ctx.lineTo(x0 + Math.sin(y * 0.03 + i) * 18 * scale, y);
    }
    ctx.stroke();
  }
}

function drawSubway(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  const tw = size / 4;
  const th = size / 8;
  fillBase(ctx, size, "#e8e6e1");
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 === 0 ? 0 : tw / 2;
    for (let col = -1; col < 5; col++) {
      const x = col * tw + offset;
      const y = row * th;
      ctx.fillStyle = shade(hex, noise(col, row) * 0.06 - 0.02);
      ctx.fillRect(x + 1, y + 1, tw - 2, th - 2);
    }
  }
}

function drawZellige(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, "#e5e2dc");
  const cell = size / 5;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const jitter = (noise(col, row) - 0.5) * 6;
      ctx.fillStyle = shade(hex, noise(row, col) * 0.1 - 0.04);
      ctx.beginPath();
      ctx.roundRect(col * cell + jitter, row * cell + jitter, cell - 3, cell - 3, 3);
      ctx.fill();
    }
  }
}

function drawHerringbone(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, "#ebe7e0");
  const w = size / 8;
  const h = size / 16;
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 8; col++) {
      const flip = (row + col) % 2 === 0;
      ctx.save();
      ctx.translate(col * w + w / 2, row * h + h / 2);
      ctx.rotate(flip ? Math.PI / 4 : -Math.PI / 4);
      ctx.fillStyle = shade(hex, noise(col, row) * 0.08 - 0.02);
      ctx.fillRect(-w / 2, -h, w, h * 2);
      ctx.restore();
    }
  }
}

function drawLapSiding(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  const lap = size / 10;
  for (let i = 0; i < 10; i++) {
    const y = i * lap;
    ctx.fillStyle = shade(hex, i % 2 ? -0.03 : 0.02);
    ctx.fillRect(0, y, size, lap - 1);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath();
    ctx.moveTo(0, y + lap - 1);
    ctx.lineTo(size, y + lap - 1);
    ctx.stroke();
  }
}

function drawBoardBatten(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  const boardW = size / 4;
  for (let i = 1; i < 4; i++) {
    const x = i * boardW;
    ctx.fillStyle = shade(hex, -0.08);
    ctx.fillRect(x - 3, 0, 6, size);
  }
}

function drawShingle(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, shade(hex, -0.05));
  const rowH = size / 12;
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * (size / 8) + (row % 2 ? size / 16 : 0);
      const y = row * rowH;
      ctx.fillStyle = shade(hex, noise(col, row) * 0.1 - 0.03);
      ctx.beginPath();
      ctx.moveTo(x, y + rowH);
      ctx.lineTo(x + size / 16, y);
      ctx.lineTo(x + size / 8, y + rowH);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawMetalSeam(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  const seam = size / 6;
  for (let i = 1; i < 6; i++) {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(i * seam - 1, 0, 2, size);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(i * seam + 1, 0, 1, size);
  }
}

function drawStone(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  for (let i = 0; i < 40; i++) {
    const x = noise(i, 1) * size * 0.9;
    const y = noise(i, 2) * size * 0.9;
    const w = 12 + noise(i, 3) * 28;
    const h = 10 + noise(i, 4) * 22;
    ctx.fillStyle = shade(hex, noise(i, 5) * 0.16 - 0.08);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.stroke();
  }
}

function drawPaintWall(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      const n = noise(x * 0.2, y * 0.2);
      ctx.fillStyle = `rgba(0,0,0,${0.008 + n * 0.012})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }
}

function drawMetalBrushed(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  for (let y = 0; y < size; y++) {
    const n = noise(0, y * 0.3);
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + n * 0.06})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
}

function drawLeathered(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      const n = noise(x * 0.25, y * 0.25);
      ctx.fillStyle = `rgba(255,255,255,${0.02 + n * 0.04})`;
      ctx.fillRect(x, y, 3, 3);
    }
  }
}

function drawCabinetGrain(ctx: CanvasRenderingContext2D, size: number, hex: string, dark = false) {
  fillBase(ctx, size, hex);
  for (let y = 0; y < size; y += 2) {
    const n = noise(y * 0.1, 1);
    ctx.strokeStyle = dark ? `rgba(0,0,0,${0.06 + n * 0.08})` : `rgba(0,0,0,${0.03 + n * 0.05})`;
    ctx.beginPath();
    ctx.moveTo(0, y + n * 2);
    ctx.bezierCurveTo(size * 0.3, y + n * 4, size * 0.7, y - n * 2, size, y + n);
    ctx.stroke();
  }
}

function drawCabinetPainted(ctx: CanvasRenderingContext2D, size: number, hex: string) {
  fillBase(ctx, size, hex);
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.strokeRect(size * 0.12, size * 0.1, size * 0.76, size * 0.8);
  ctx.strokeRect(size * 0.18, size * 0.16, size * 0.64, size * 0.68);
}

export function paintTexture(
  ctx: CanvasRenderingContext2D,
  size: number,
  kind: TextureKind,
  hex: string,
) {
  switch (kind) {
    case "wood-plank":
    case "wood-door":
      drawWoodPlank(ctx, size, hex);
      break;
    case "carpet":
      drawCarpet(ctx, size, hex);
      break;
    case "tile-floor":
      drawTileGrid(ctx, size, hex, size / 3, size / 3);
      break;
    case "paint-wall":
      drawPaintWall(ctx, size, hex);
      break;
    case "quartz-veined":
      drawQuartzVeined(ctx, size, hex);
      break;
    case "quartz-matte":
      drawQuartzVeined(ctx, size, hex);
      drawLeathered(ctx, size, hex);
      break;
    case "quartz-leathered":
      drawLeathered(ctx, size, hex);
      break;
    case "subway-tile":
      drawSubway(ctx, size, hex);
      break;
    case "zellige-tile":
      drawZellige(ctx, size, hex);
      break;
    case "vertical-stack-tile":
      drawTileGrid(ctx, size, hex, size / 6, size / 3);
      break;
    case "herringbone-tile":
      drawHerringbone(ctx, size, hex);
      break;
    case "ceramic-tile":
      drawTileGrid(ctx, size, hex, size / 4, size / 4);
      break;
    case "slab":
      drawQuartzVeined(ctx, size, hex);
      break;
    case "cabinet-stained":
      drawCabinetGrain(ctx, size, hex, false);
      break;
    case "cabinet-walnut":
      drawCabinetGrain(ctx, size, hex, true);
      break;
    case "cabinet-painted":
      drawCabinetPainted(ctx, size, hex);
      break;
    case "metal-chrome":
      fillBase(ctx, size, hex);
      break;
    case "metal-brushed":
      drawMetalBrushed(ctx, size, hex);
      break;
    case "metal-black":
      drawLeathered(ctx, size, hex);
      break;
    case "metal-brass":
      drawMetalBrushed(ctx, size, hex);
      break;
    case "appliance-stainless":
      drawMetalBrushed(ctx, size, hex);
      break;
    case "lap-siding":
      drawLapSiding(ctx, size, hex);
      break;
    case "board-batten":
      drawBoardBatten(ctx, size, hex);
      break;
    case "stone":
      drawStone(ctx, size, hex);
      break;
    case "shingle":
      drawShingle(ctx, size, hex);
      break;
    case "metal-roof":
      drawMetalSeam(ctx, size, hex);
      break;
    default:
      fillBase(ctx, size, hex);
  }
}

export function textureCacheKey(kind: TextureKind, hex: string, size = 256): string {
  return `${kind}:${hex.toLowerCase()}:${size}`;
}

/** Create or reuse a canvas for WebGL / swatch export (browser only). */
export function getTextureCanvas(
  kind: TextureKind,
  hex: string,
  size = 256,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const key = textureCacheKey(kind, hex, size);
  const cached = textureCache.get(key);
  if (cached && cached.width >= size) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  paintTexture(ctx, size, kind, hex);
  textureCache.set(key, canvas);
  return canvas;
}

export function getTextureDataUrl(kind: TextureKind, hex: string, size = 128): string | null {
  const canvas = getTextureCanvas(kind, hex, size);
  return canvas?.toDataURL("image/png") ?? null;
}

/** CSS swatch for catalog chips — mirrors WebGL texture kind. */
export function buildSwatchStyle(option: DesignOption): SwatchStyle {
  const hex = option.colorHex ?? "#cccccc";
  const kind = resolveTextureKind(option);
  const dataUrl = getTextureDataUrl(kind, hex, 96);

  if (dataUrl && kind !== "flat-color") {
    return {
      backgroundColor: hex,
      backgroundImage: `url(${dataUrl})`,
      backgroundSize: "cover",
    };
  }

  return { backgroundColor: hex };
}

export function optionColor(option: DesignOption | undefined, fallback: string): string {
  return option?.colorHex ?? fallback;
}

export function isStainedCabinet(option: DesignOption | undefined): boolean {
  const kind = resolveTextureKind(option, "cabinets");
  return kind === "cabinet-stained" || kind === "cabinet-walnut";
}

export function isFlatPanelCabinet(option: DesignOption | undefined): boolean {
  return Boolean(option?.id?.includes("flat-panel") || option?.id?.includes("walnut"));
}
