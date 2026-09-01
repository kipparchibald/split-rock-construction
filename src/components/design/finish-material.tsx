/**
 * R3F mesh material driven by Design Center catalog options.
 * Physical materials + roughness derived from the procedural albedo.
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
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) / 255;
    const v = glossy ? 40 + lum * 90 : 110 + lum * 110;
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, v));
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
    return { map, roughnessMap, profile, hex };
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
  const { map, roughnessMap, profile, hex } = useFinishMaps(option, category, fallbackHex);

  if (map) map.repeat.set(repeat[0], repeat[1]);
  if (roughnessMap) roughnessMap.repeat.set(repeat[0], repeat[1]);

  const shared = {
    color: (map ? "#ffffff" : hex) as string,
    map: map ?? undefined,
    roughnessMap: roughnessMap ?? undefined,
    roughness: profile.roughness,
    metalness: profile.metalness,
    emissive: emissive ?? (profile.emissiveIntensity ? hex : undefined),
    emissiveIntensity: emissiveIntensity ?? profile.emissiveIntensity ?? 0,
    transparent,
    opacity,
    envMapIntensity: isPhysical(profile.kind) ? 1.15 : 0.7,
  };

  if (isPhysical(profile.kind)) {
    const clearcoat = profile.kind.startsWith("quartz") || profile.kind.includes("tile") ? 0.55 : 0.25;
    return (
      <meshPhysicalMaterial
        {...shared}
        clearcoat={clearcoat}
        clearcoatRoughness={profile.kind.includes("leather") || profile.kind.includes("matte") ? 0.55 : 0.18}
        reflectivity={0.55}
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
