/**
 * Phase A WebGL walkthrough for Design Center.
 * Procedural ranch kitchen / living / exterior meshes driven by catalog finishes.
 */
import { Suspense, useMemo } from "react";
import { usePhone } from "@/lib/use-narrow";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  SoftShadows,
} from "@react-three/drei";
import type { DesignCategory, DesignOption } from "@/data/types";
import type { DesignRoom } from "@/lib/design-catalog";
import { ACESFilmicToneMapping, TOUCH } from "three";
import { FinishMaterial, ShakerCabinet } from "@/components/design/finish-material";
import { optionColor } from "@/lib/design-materials";

export type FinishSelections = Partial<
  Record<DesignCategory, DesignOption | undefined>
>;

function WindowLight({ position }: { position: [number, number, number] }) {
  return (
    <>
      <mesh position={position}>
        <planeGeometry args={[1.6, 1.4]} />
        <meshStandardMaterial color="#b8d4ea" transparent opacity={0.35} roughness={0.1} metalness={0.05} />
      </mesh>
      <directionalLight
        position={[position[0] + 2, position[1] + 1, position[2] + 4]}
        intensity={0.85}
        color="#fff4e0"
        castShadow
      />
    </>
  );
}

function KitchenScene({ s }: { s: FinishSelections }) {
  const wall = s.paint;
  const floor = s.flooring;
  const cab = s.cabinets;
  const ct = s.countertops;
  const splash = s.backsplash;
  const fx = s.fixtures;
  const light = s.lighting;
  const appliance = s.appliances;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <FinishMaterial option={floor} category="flooring" fallbackHex="#C4A574" repeat={[4, 3.2]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#f8f7f4" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.6, -4]} receiveShadow>
        <boxGeometry args={[10, 3.2, 0.15]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[3, 2]} />
      </mesh>
      <mesh position={[-5, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 3.2, 0.15]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[2.4, 2]} />
      </mesh>
      <mesh position={[5, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 3.2, 0.15]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[2.4, 2]} />
      </mesh>
      {[
        [0, 0.08, -3.92] as const,
        [-4.92, 0.08, 0] as const,
      ].map((pos, i) => (
        <mesh key={`bb-${i}`} position={pos} rotation={i === 1 ? [0, Math.PI / 2, 0] : undefined}>
          <boxGeometry args={i === 0 ? [10, 0.16, 0.04] : [8, 0.16, 0.04]} />
          <meshStandardMaterial color="#ebe8e0" roughness={0.7} />
        </mesh>
      ))}
      <WindowLight position={[4.9, 1.8, -1]} />
      {[-2.4, -1.2, 0, 1.2].map((x) => (
        <ShakerCabinet key={`uc-${x}`} position={[x, 2.35, -3.7]} size={[1.05, 0.85, 0.4]} option={cab} fallbackHex="#F7F7F5" />
      ))}
      <mesh position={[-0.6, 1.55, -3.84]}>
        <boxGeometry args={[4.4, 0.7, 0.04]} />
        <FinishMaterial option={splash} category="backsplash" fallbackHex="#F5F5F5" repeat={[6, 2]} />
      </mesh>
      <ShakerCabinet position={[-0.6, 0.45, -3.55]} size={[4.4, 0.9, 0.65]} option={cab} />
      <mesh position={[-0.6, 0.95, -3.55]} castShadow>
        <boxGeometry args={[4.5, 0.08, 0.7]} />
        <FinishMaterial option={ct} category="countertops" fallbackHex="#F2EFEA" repeat={[3, 1]} />
      </mesh>
      <group position={[-0.6, 1.15, -3.35]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.35, 12]} />
          <FinishMaterial option={fx} category="fixtures" fallbackHex="#C0C0C0" />
        </mesh>
        <mesh position={[0, 0.2, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.18, 10]} />
          <FinishMaterial option={fx} category="fixtures" fallbackHex="#C0C0C0" />
        </mesh>
      </group>
      <ShakerCabinet position={[1.2, 0.45, -0.4]} size={[2.2, 0.9, 1.1]} option={cab} />
      <mesh position={[1.2, 0.95, -0.4]} castShadow>
        <boxGeometry args={[2.3, 0.08, 1.2]} />
        <FinishMaterial option={ct} category="countertops" fallbackHex="#F2EFEA" repeat={[2, 1]} />
      </mesh>
      <mesh position={[2.6, 0.5, -3.5]} castShadow>
        <boxGeometry args={[0.9, 1.0, 0.7]} />
        <FinishMaterial option={appliance} category="appliances" fallbackHex="#C5C8CA" />
      </mesh>
      <mesh position={[2.6, 1.55, -3.5]} castShadow>
        <boxGeometry args={[1.0, 0.5, 0.75]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.55} metalness={0.2} />
      </mesh>
      {[0.4, 1.2, 2.0].map((x) => (
        <group key={`lt-${x}`} position={[x, 2.6, -0.4]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#333" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.2, 16]} />
            <FinishMaterial option={light} category="lighting" fallbackHex="#F5F5F5" emissive={optionColor(light, "#F5F5F5")} emissiveIntensity={0.45} />
          </mesh>
        </group>
      ))}
      <pointLight position={[1.2, 2.4, -0.4]} intensity={14} distance={8} color="#fff5e0" />
      <pointLight position={[-0.6, 2.5, -2]} intensity={10} distance={7} color="#ffffff" />
      <hemisphereLight args={["#fff8f0", "#8a8078", 0.35]} />
    </group>
  );
}

function LivingScene({ s }: { s: FinishSelections }) {
  const wall = s.paint;
  const floor = s.flooring;
  const light = s.lighting;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <FinishMaterial option={floor} category="flooring" fallbackHex="#C4A574" repeat={[5, 4]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.4, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#f8f7f4" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.7, -5]} receiveShadow>
        <boxGeometry args={[12, 3.4, 0.15]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[4, 2]} />
      </mesh>
      <mesh position={[-6, 1.7, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3.4, 0.15]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[3, 2]} />
      </mesh>
      <mesh position={[6, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3.4, 0.15]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[3, 2]} />
      </mesh>
      <WindowLight position={[5.9, 1.9, -1.5]} />
      <mesh position={[-1.5, 0.4, 0.5]} castShadow>
        <boxGeometry args={[3.2, 0.8, 1.4]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.82} />
      </mesh>
      <mesh position={[-1.5, 0.85, 0.1]} castShadow>
        <boxGeometry args={[3.2, 0.55, 0.35]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.78} />
      </mesh>
      <mesh position={[-1.2, 0.25, 2.2]} castShadow>
        <boxGeometry args={[1.4, 0.5, 0.8]} />
        <FinishMaterial option={floor} category="flooring" fallbackHex="#C4A574" repeat={[1.5, 1]} />
      </mesh>
      <mesh position={[0.2, 0.22, 1.2]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.9]} />
        <meshStandardMaterial color="#4a3f35" roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh position={[0, 2.9, -1]}>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 24]} />
        <FinishMaterial option={light} category="lighting" fallbackHex="#F5F5F5" emissive={optionColor(light, "#F5F5F5")} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 2.7, -1]} intensity={16} distance={10} color="#fff8e8" />
      <hemisphereLight args={["#fff6ee", "#7a7268", 0.4]} />
    </group>
  );
}

function BathScene({ s }: { s: FinishSelections }) {
  const wall = s.paint;
  const floor = s.flooring;
  const tile = s.tile;
  const cab = s.cabinets;
  const ct = s.countertops;
  const fx = s.fixtures;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <FinishMaterial option={floor} category="flooring" fallbackHex="#C4A574" repeat={[3, 2.5]} />
      </mesh>
      <mesh position={[0, 1.5, -2.5]} receiveShadow>
        <boxGeometry args={[6, 3, 0.12]} />
        <FinishMaterial option={wall} category="paint" fallbackHex="#F0EDE4" repeat={[2, 2]} />
      </mesh>
      <ShakerCabinet position={[-1.2, 0.4, -2.2]} size={[1.6, 0.8, 0.55]} option={cab} />
      <mesh position={[-1.2, 0.85, -2.2]}>
        <boxGeometry args={[1.65, 0.06, 0.58]} />
        <FinishMaterial option={ct} category="countertops" fallbackHex="#F2EFEA" repeat={[1.5, 1]} />
      </mesh>
      <group position={[-1.2, 1.05, -2.05]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.3, 10]} />
          <FinishMaterial option={fx} category="fixtures" fallbackHex="#C0C0C0" />
        </mesh>
      </group>
      <mesh position={[1.4, 1.1, -1.6]}>
        <boxGeometry args={[1.5, 2.2, 1.4]} />
        <FinishMaterial option={tile} category="tile" fallbackHex="#E8E6E1" repeat={[3, 4]} />
      </mesh>
      <mesh position={[-1.8, 0.35, 0.8]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.7]} />
        <FinishMaterial option={ct} category="countertops" fallbackHex="#F2EFEA" repeat={[1, 1]} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} intensity={12} distance={6} color="#fffaf5" />
      <hemisphereLight args={["#ffffff", "#9a9088", 0.3]} />
    </group>
  );
}

function ExteriorScene({ s }: { s: FinishSelections }) {
  const ext = s.exterior;
  const roof = s.roofing;
  const door = s.doors;
  const stone = s.exterior?.id?.includes("stone");
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#5a6b3a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 7]} />
        <FinishMaterial option={ext} category="exterior" fallbackHex="#F4F1EA" repeat={[4, 3]} />
      </mesh>
      {stone ? (
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[10.1, 0.9, 7.1]} />
          <FinishMaterial option={s.exterior} category="exterior" fallbackHex="#8B7D6B" repeat={[3, 1]} />
        </mesh>
      ) : null}
      <mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[7.2, 2.2, 4]} />
        <FinishMaterial option={roof} category="roofing" fallbackHex="#4A4A4A" repeat={[6, 4]} />
      </mesh>
      <mesh position={[0, 1.0, 3.55]} castShadow>
        <boxGeometry args={[1.1, 2.0, 0.12]} />
        <FinishMaterial option={door} category="doors" fallbackHex="#5C4033" repeat={[1, 2]} />
      </mesh>
      <mesh position={[-2.8, 1.7, 3.55]}>
        <boxGeometry args={[1.4, 1.2, 0.08]} />
        <meshStandardMaterial color="#9ec5e0" transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <mesh position={[2.8, 1.7, 3.55]}>
        <boxGeometry args={[1.4, 1.2, 0.08]} />
        <meshStandardMaterial color="#9ec5e0" transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <mesh position={[0, 2.2, 3.2]} castShadow>
        <boxGeometry args={[8, 0.2, 0.25]} />
        <meshStandardMaterial color="#e8e2d8" roughness={0.75} />
      </mesh>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.5} castShadow color="#fff8f0" />
      <hemisphereLight args={["#c8dff0", "#4a5a38", 0.45]} />
    </group>
  );
}

function RoomModel({ room, selections }: { room: DesignRoom; selections: FinishSelections }) {
  if (room === "kitchen" || room === "laundry") return <KitchenScene s={selections} />;
  if (room === "primary_bath" || room === "hall_bath") return <BathScene s={selections} />;
  if (room === "exterior" || room === "garage_front") return <ExteriorScene s={selections} />;
  return <LivingScene s={selections} />;
}

export function WebGLWalkthrough({
  room,
  selections,
  className,
}: {
  room: DesignRoom;
  selections: FinishSelections;
  className?: string;
}) {
  const phone = usePhone();
  const isExterior = room === "exterior" || room === "garage_front";
  const cameraPos = useMemo(
    (): [number, number, number] => (isExterior ? [12, 6, 12] : [4.5, 2.4, 5.5]),
    [isExterior],
  );
  const shadowSize = phone ? 512 : 1024;

  return (
    <div
      className={
        className ??
        "relative aspect-[4/3] min-h-[13.5rem] w-full min-w-0 max-w-full overflow-hidden touch-none bg-[#1a1c1e] sm:aspect-[16/10] sm:min-h-0"
      }
      data-testid="design-webgl"
    >
      <Canvas
        shadows={!phone}
        dpr={phone ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !phone, alpha: false, powerPreference: phone ? "low-power" : "high-performance", toneMapping: ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <color attach="background" args={[isExterior ? "#8eabbf" : "#3a3835"]} />
        {!phone ? <fog attach="fog" args={[isExterior ? "#8eabbf" : "#3a3835", 12, 28]} /> : null}
        <PerspectiveCamera makeDefault position={cameraPos} fov={phone ? 48 : 42} />
        <ambientLight intensity={isExterior ? 0.45 : phone ? 0.4 : 0.28} color="#fff8f2" />
        <directionalLight
          position={[6, 10, 4]}
          intensity={isExterior ? 1.2 : 0.95}
          castShadow={!phone}
          shadow-mapSize-width={shadowSize}
          shadow-mapSize-height={shadowSize}
          color="#fff6eb"
        />
        <Suspense fallback={null}>
          <RoomModel room={room} selections={selections} />
          {!phone ? (
            !isExterior ? (
              <Environment preset="apartment" environmentIntensity={0.72} />
            ) : (
              <Environment preset="sunset" environmentIntensity={0.55} />
            )
          ) : (
            <hemisphereLight args={["#efe8dc", "#3d3a36", 0.55]} />
          )}
          {!phone ? (
            <>
              <ContactShadows position={[0, 0.01, 0]} opacity={0.42} scale={22} blur={2.8} far={9} color="#1a1816" />
              <SoftShadows size={12} samples={8} focus={0.5} />
            </>
          ) : (
            <ContactShadows position={[0, 0.01, 0]} opacity={0.28} scale={18} blur={1.6} far={6} color="#1a1816" />
          )}
        </Suspense>
        <OrbitControls
          makeDefault
          target={isExterior ? [0, 1.5, 0] : [0, 1.2, -1]}
          minDistance={2}
          maxDistance={phone ? 18 : 28}
          maxPolarAngle={Math.PI / 2.05}
          enablePan={!phone}
          enableDamping
          dampingFactor={0.08}
          touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
          rotateSpeed={phone ? 0.72 : 1}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-3 right-3 text-[10px] leading-snug text-white/70">
        {phone
          ? "Drag to orbit · pinch to zoom · finishes update live"
          : "WebGL walkthrough · drag to orbit · scroll to zoom · finishes update live"}
      </p>
    </div>
  );
}
