/**
 * Phase A WebGL walkthrough for Design Center.
 * Procedural ranch kitchen / living / exterior meshes driven by catalog colors.
 * Swap in plan-specific GLB later via optional modelUrl without changing the API.
 */
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import type { DesignCategory, DesignOption } from "@/data/types";
import type { DesignRoom } from "@/lib/design-catalog";

export type FinishSelections = Partial<
  Record<DesignCategory, DesignOption | undefined>
>;

function hex(opt: DesignOption | undefined, fallback: string) {
  return opt?.colorHex ?? fallback;
}

function KitchenScene({ s }: { s: FinishSelections }) {
  const wall = hex(s.paint, "#F0EDE4");
  const floor = hex(s.flooring, "#C4A574");
  const cab = hex(s.cabinets, "#F7F7F5");
  const ct = hex(s.countertops, "#F2EFEA");
  const splash = hex(s.backsplash, "#F5F5F5");
  const fx = hex(s.fixtures, "#C0C0C0");
  const light = hex(s.lighting, "#F5F5F5");
  const appliance = hex(s.appliances, "#C5C8CA");

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color={floor} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.2, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#f8f7f4" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, -4]} receiveShadow>
        <boxGeometry args={[10, 3.2, 0.15]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[-5, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[8, 3.2, 0.15]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[5, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[8, 3.2, 0.15]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[4.9, 1.8, -1]}>
        <boxGeometry args={[0.08, 1.4, 1.6]} />
        <meshStandardMaterial color="#9ec5e0" transparent opacity={0.45} />
      </mesh>

      {[-2.4, -1.2, 0, 1.2].map((x) => (
        <mesh key={`uc-${x}`} position={[x, 2.35, -3.7]} castShadow>
          <boxGeometry args={[1.05, 0.85, 0.4]} />
          <meshStandardMaterial color={cab} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[-0.6, 1.55, -3.85]}>
        <boxGeometry args={[4.4, 0.7, 0.06]} />
        <meshStandardMaterial color={splash} roughness={0.4} />
      </mesh>
      <mesh position={[-0.6, 0.45, -3.55]} castShadow>
        <boxGeometry args={[4.4, 0.9, 0.65]} />
        <meshStandardMaterial color={cab} roughness={0.45} />
      </mesh>
      <mesh position={[-0.6, 0.95, -3.55]} castShadow>
        <boxGeometry args={[4.5, 0.08, 0.7]} />
        <meshStandardMaterial color={ct} roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh position={[-0.6, 1.15, -3.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 12]} />
        <meshStandardMaterial color={fx} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[1.2, 0.45, -0.4]} castShadow>
        <boxGeometry args={[2.2, 0.9, 1.1]} />
        <meshStandardMaterial color={cab} roughness={0.45} />
      </mesh>
      <mesh position={[1.2, 0.95, -0.4]} castShadow>
        <boxGeometry args={[2.3, 0.08, 1.2]} />
        <meshStandardMaterial color={ct} roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh position={[2.6, 0.5, -3.5]} castShadow>
        <boxGeometry args={[0.9, 1.0, 0.7]} />
        <meshStandardMaterial color={appliance} metalness={0.55} roughness={0.3} />
      </mesh>
      {[0.4, 1.2, 2.0].map((x) => (
        <group key={`lt-${x}`} position={[x, 2.6, -0.4]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.2, 16]} />
            <meshStandardMaterial
              color={light}
              roughness={0.4}
              emissive={light}
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      ))}
      <pointLight position={[1.2, 2.4, -0.4]} intensity={12} distance={8} color="#fff5e0" />
      <pointLight position={[-0.6, 2.5, -2]} intensity={8} distance={7} color="#ffffff" />
    </group>
  );
}

function LivingScene({ s }: { s: FinishSelections }) {
  const wall = hex(s.paint, "#F0EDE4");
  const floor = hex(s.flooring, "#C4A574");
  const light = hex(s.lighting, "#F5F5F5");

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color={floor} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.7, -5]}>
        <boxGeometry args={[12, 3.4, 0.15]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[-6, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[10, 3.4, 0.15]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[6, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[10, 3.4, 0.15]} />
        <meshStandardMaterial color={wall} roughness={0.85} />
      </mesh>
      <mesh position={[-1.5, 0.4, 0.5]} castShadow>
        <boxGeometry args={[3.2, 0.8, 1.4]} />
        <meshStandardMaterial color="#6b5b4a" roughness={0.7} />
      </mesh>
      <mesh position={[-1.5, 0.85, 0.1]} castShadow>
        <boxGeometry args={[3.2, 0.55, 0.35]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
      </mesh>
      <mesh position={[-1.2, 0.25, 2.2]} castShadow>
        <boxGeometry args={[1.4, 0.5, 0.8]} />
        <meshStandardMaterial color={floor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.9, -1]}>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 24]} />
        <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.4} />
      </mesh>
      <pointLight position={[0, 2.7, -1]} intensity={14} distance={10} color="#fff8e8" />
    </group>
  );
}

function BathScene({ s }: { s: FinishSelections }) {
  const wall = hex(s.paint, "#F0EDE4");
  const floor = hex(s.flooring, "#C4A574");
  const tile = hex(s.tile, "#E8E6E1");
  const cab = hex(s.cabinets, "#F7F7F5");
  const ct = hex(s.countertops, "#F2EFEA");
  const fx = hex(s.fixtures, "#C0C0C0");

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color={floor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.5, -2.5]}>
        <boxGeometry args={[6, 3, 0.12]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[-1.2, 0.4, -2.2]} castShadow>
        <boxGeometry args={[1.6, 0.8, 0.55]} />
        <meshStandardMaterial color={cab} />
      </mesh>
      <mesh position={[-1.2, 0.85, -2.2]}>
        <boxGeometry args={[1.65, 0.06, 0.58]} />
        <meshStandardMaterial color={ct} roughness={0.25} />
      </mesh>
      <mesh position={[-1.2, 1.05, -2.05]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 10]} />
        <meshStandardMaterial color={fx} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.4, 1.1, -1.6]}>
        <boxGeometry args={[1.5, 2.2, 1.4]} />
        <meshStandardMaterial color={tile} roughness={0.35} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} intensity={10} distance={6} />
    </group>
  );
}

function ExteriorScene({ s }: { s: FinishSelections }) {
  const ext = hex(s.exterior, "#F4F1EA");
  const roof = hex(s.roofing, "#4A4A4A");
  const door = hex(s.doors, "#3d2c1e");
  const stone = s.exterior?.id?.includes("stone");

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#5a6b3a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[10, 3, 7]} />
        <meshStandardMaterial color={ext} roughness={0.7} />
      </mesh>
      {stone ? (
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[10.1, 0.9, 7.1]} />
          <meshStandardMaterial color="#8B7D6B" roughness={0.9} />
        </mesh>
      ) : null}
      <mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[7.2, 2.2, 4]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 3.55]}>
        <boxGeometry args={[1.1, 2.0, 0.12]} />
        <meshStandardMaterial color={door} roughness={0.5} />
      </mesh>
      <mesh position={[-2.8, 1.7, 3.55]}>
        <boxGeometry args={[1.4, 1.2, 0.08]} />
        <meshStandardMaterial color="#9ec5e0" transparent opacity={0.55} />
      </mesh>
      <mesh position={[2.8, 1.7, 3.55]}>
        <boxGeometry args={[1.4, 1.2, 0.08]} />
        <meshStandardMaterial color="#9ec5e0" transparent opacity={0.55} />
      </mesh>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.4} castShadow />
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
  const isExterior = room === "exterior" || room === "garage_front";
  const cameraPos = useMemo(
    (): [number, number, number] => (isExterior ? [12, 6, 12] : [4.5, 2.4, 5.5]),
    [isExterior],
  );

  return (
    <div className={className ?? "relative aspect-[16/10] w-full bg-[#1a1c1e]"}>
      <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={[isExterior ? "#8eabbf" : "#2a2c2e"]} />
        <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
        <ambientLight intensity={isExterior ? 0.4 : 0.35} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.15}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Suspense fallback={null}>
          <RoomModel room={room} selections={selections} />
          {!isExterior ? <Environment preset="apartment" environmentIntensity={0.35} /> : null}
          <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={20} blur={2.5} far={8} />
        </Suspense>
        <OrbitControls
          makeDefault
          target={isExterior ? [0, 1.5, 0] : [0, 1.2, -1]}
          minDistance={2}
          maxDistance={28}
          maxPolarAngle={Math.PI / 2.05}
          enablePan
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-white/70">
        WebGL walkthrough · drag to orbit · scroll to zoom · finishes update live
      </p>
    </div>
  );
}
