import { useMemo } from 'react';
import * as THREE from 'three';

interface RTLSPadProps {
  position?: [number, number, number];
}

export function RTLSPad({ position = [0, 0, 0] }: RTLSPadProps) {
  return (
    <group position={position}>
      {/* Main concrete pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Pad markings - outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[35, 38, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* X marking */}
      <group position={[0, 0.2, 0]}>
        <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
          <planeGeometry args={[60, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, -Math.PI / 4, 0]}>
          <planeGeometry args={[60, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Center target */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial
          color="#ff3300"
          roughness={0.6}
          emissive="#ff3300"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Flame deflector trench */}
      <mesh position={[0, -2, 60]} receiveShadow>
        <boxGeometry args={[30, 4, 40]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
      </mesh>

      {/* Blast marks (scorched concrete) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <circleGeometry args={[25, 32]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.95} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export function RTLSTerrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2000, 2000, 64, 64);
    return geo;
  }, []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#4a5a3a" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Landing pad */}
      <RTLSPad />

      {/* Launch tower */}
      <LaunchTower position={[80, 0, 0]} />

      {/* Service structures */}
      <ServiceBuilding position={[-100, 0, 50]} size={[40, 20, 30]} />
      <ServiceBuilding position={[-100, 0, -50]} size={[30, 15, 25]} />

      {/* Road to pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-100, 0.05, 0]}>
        <planeGeometry args={[150, 15]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={0.4} color="#87ceeb" />
      <directionalLight
        position={[100, 200, 100]}
        intensity={1.2}
        color="#fffaf0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Sky */}
      <mesh>
        <sphereGeometry args={[3000, 32, 32]} />
        <meshBasicMaterial color="#87ceeb" side={THREE.BackSide} />
      </mesh>

      <fog attach="fog" args={['#c0d8e8', 500, 2500]} />
    </group>
  );
}

function LaunchTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main tower structure */}
      <mesh position={[0, 50, 0]}>
        <boxGeometry args={[15, 100, 15]} />
        <meshStandardMaterial color="#cc4444" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Tower top */}
      <mesh position={[0, 105, 0]}>
        <boxGeometry args={[20, 10, 20]} />
        <meshStandardMaterial color="#aa3333" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Cross beams */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-15, 20 + i * 20, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[2, 25, 2]} />
          <meshStandardMaterial color="#888888" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}

      {/* Warning lights */}
      <pointLight position={[0, 110, 0]} intensity={1} color="#ff0000" distance={50} />
    </group>
  );
}

function ServiceBuilding({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#d0d0d0" roughness={0.8} metalness={0.2} />
    </mesh>
  );
}
