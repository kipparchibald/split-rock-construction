/**
 * R3F mesh material driven by Design Center catalog options.
 * Physical materials + roughness / bump derived from the procedural albedo.
 */
import { useMemo } from "react";
import type { DesignCategory, DesignOption } from "@/data/types";
import {
  getMaterialProfile,
  getTextureCanvas,
  optionColor,
  resolveTextureKind,
  type TextureKind,
} from "@/lib/design-materials";
import * as THREE from "three";

function roughnessCanvasFromAlbedo(src: HTMLCanvasElement, kind: TextureKind): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  const inCtx = src.getContext("2d");
  if (!ctx || !inCtx) return src;
  const img = inCtx.getImageData(0, 0, src.width, src.height);
  const data = img.data;
  const glossy = kind.startsWith("metal") || kind.startsWith("quartz") || kind === "appliance-stainless";
  const tile = kind.includes("tile");
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) / 255;
    let v: number;
    if (glossy) v = 28 + lum * 85;
    else if (tile) v = 70 + lum * 90;
    else v = 110 + lum * 110;
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, v));
    data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

function bumpCanvasFromAlbedo(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d");
  const inCtx = src.getContext("2d");
  if (!ctx || !inCtx) return src;
  const img = inCtx.getImageData(0, 0, src.width, src.height);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
    data[i] = data[i + 1] = data[i + 2] = lum;
    data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

function makeMap(canvas: HTMLCanvasElement, colorSpace: THREE.ColorSpace) {
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  map.colorSpace = colorSpace;
  map.needsUpdate = true;
  return map;
}

export function useFinishMaps(
  option: DesignOption | undefined,
  category: DesignCategory,
  fallbackHex: string,
) {
  return useMemo(() => {
    const hex = optionColor(option, fallbackHex);
    const profile = getMaterialProfile(option, category);
    const canvas = getTextureCanvas(profile.kind, hex, 512);
    const map = canvas ? makeMap(canvas, THREE.SRGBColorSpace) : null;
    const roughnessMap =
      canvas && profile.kind !== "flat-color"
        ? makeMap(roughnessCanvasFromAlbedo(canvas, profile.kind), THREE.NoColorSpace)
        : null;
    const bumpMap =
      canvas && profile.kind !== "flat-color" && !profile.kind.startsWith("metal")
        ? makeMap(bumpCanvasFromAlbedo(canvas), THREE.NoColorSpace)
        : null;
    return { map, roughnessMap, bumpMap, profile, hex };
  }, [option, category, fallbackHex]);
}

function isPhysical(kind: TextureKind) {
  return (
    kind.startsWith("metal") ||
    kind.startsWith("quartz") ||
    kind === "slab" ||
    kind === "appliance-stainless" ||
    kind.includes("tile")
  );
}

export function FinishMaterial({
  option,
  category,
  fallbackHex = "#cccccc",
  repeat = [1, 1] as [number, number],
  emissive,
  emissiveIntensity,
  transparent,
  opacity,
}: {
  option: DesignOption | undefined;
  category: DesignCategory;
  fallbackHex?: string;
  repeat?: [number, number];
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}) {
  const { map, roughnessMap, bumpMap, profile, hex } = useFinishMaps(option, category, fallbackHex);

  if (map) map.repeat.set(repeat[0], repeat[1]);
  if (roughnessMap) roughnessMap.repeat.set(repeat[0], repeat[1]);
  if (bumpMap) bumpMap.repeat.set(repeat[0], repeat[1]);

  const shared = {
    color: (map ? "#ffffff" : hex) as string,
    map: map ?? undefined,
    roughnessMap: roughnessMap ?? undefined,
    bumpMap: bumpMap ?? undefined,
    bumpScale: bumpMap ? (profile.kind.includes("leather") || profile.kind === "stone" ? 0.08 : 0.035) : 0,
    roughness: profile.roughness,
    metalness: profile.metalness,
    emissive: emissive ?? (profile.emissiveIntensity ? hex : undefined),
    emissiveIntensity: emissiveIntensity ?? profile.emissiveIntensity ?? 0,
    transparent,
    opacity,
    envMapIntensity: isPhysical(profile.kind) ? 1.25 : 0.75,
  };

  if (isPhysical(profile.kind)) {
    const clearcoat = profile.kind.startsWith("quartz") || profile.kind.includes("tile") ? 0.62 : 0.28;
    return (
      <meshPhysicalMaterial
        {...shared}
        clearcoat={clearcoat}
        clearcoatRoughness={profile.kind.includes("leather") || profile.kind.includes("matte") ? 0.55 : 0.14}
        reflectivity={0.62}
      />
    );
  }

  return <meshStandardMaterial {...shared} />;
}

export function ShakerCabinet({
  position,
  size,
  option,
  fallbackHex = "#F7F7F5",
}: {
  position: [number, number, number];
  size: [number, number, number];
  option: DesignOption | undefined;
  fallbackHex?: string;
}) {
  const [w, h, d] = size;
  const frame = 0.06;
  const panelInset = 0.04;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <FinishMaterial option={option} category="cabinets" fallbackHex={fallbackHex} repeat={[2, 2]} />
      </mesh>
      <mesh position={[0, 0, d / 2 + 0.005]} castShadow>
        <boxGeometry args={[w - frame * 2, h - frame * 2, panelInset]} />
        <FinishMaterial
          option={option}
          category="cabinets"
          fallbackHex={fallbackHex}
          repeat={[1.5, 1.5]}
        />
      </mesh>
      <mesh position={[0, h / 2 - frame / 2, d / 2 + 0.008]}>
        <boxGeometry args={[w - frame, frame * 0.8, panelInset * 0.5]} />
        <FinishMaterial option={option} category="cabinets" fallbackHex={fallbackHex} />
      </mesh>
      <mesh position={[0, -h / 2 + frame / 2, d / 2 + 0.008]}>
        <boxGeometry args={[w - frame, frame * 0.8, panelInset * 0.5]} />
        <FinishMaterial option={option} category="cabinets" fallbackHex={fallbackHex} />
      </mesh>
      <mesh position={[-w / 2 + frame / 2, 0, d / 2 + 0.008]}>
        <boxGeometry args={[frame * 0.8, h - frame, panelInset * 0.5]} />
        <FinishMaterial option={option} category="cabinets" fallbackHex={fallbackHex} />
      </mesh>
      <mesh position={[w / 2 - frame / 2, 0, d / 2 + 0.008]}>
        <boxGeometry args={[frame * 0.8, h - frame, panelInset * 0.5]} />
        <FinishMaterial option={option} category="cabinets" fallbackHex={fallbackHex} />
      </mesh>
    </group>
  );
}

export function textureKindLabel(option: DesignOption | undefined, category: DesignCategory): string {
  return resolveTextureKind(option, category);
}
