/**
 * R3F mesh material driven by Design Center catalog options.
 */
import { useMemo } from "react";
import type { DesignCategory, DesignOption } from "@/data/types";
import {
  getMaterialProfile,
  getTextureCanvas,
  optionColor,
  resolveTextureKind,
} from "@/lib/design-materials";
import * as THREE from "three";

export function useFinishMaps(
  option: DesignOption | undefined,
  category: DesignCategory,
  fallbackHex: string,
) {
  return useMemo(() => {
    const hex = optionColor(option, fallbackHex);
    const profile = getMaterialProfile(option, category);
    const canvas = getTextureCanvas(profile.kind, hex);
    const map = canvas ? new THREE.CanvasTexture(canvas) : null;
    if (map) {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.colorSpace = THREE.SRGBColorSpace;
      map.needsUpdate = true;
    }
    return { map, profile, hex };
  }, [option, category, fallbackHex]);
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
  const { map, profile, hex } = useFinishMaps(option, category, fallbackHex);

  if (map) {
    map.repeat.set(repeat[0], repeat[1]);
  }

  return (
    <meshStandardMaterial
      color={map ? "#ffffff" : hex}
      map={map ?? undefined}
      roughness={profile.roughness}
      metalness={profile.metalness}
      emissive={emissive ?? (profile.emissiveIntensity ? hex : undefined)}
      emissiveIntensity={emissiveIntensity ?? profile.emissiveIntensity ?? 0}
      transparent={transparent}
      opacity={opacity}
    />
  );
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
