import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvironmentStore } from '../../stores/environmentStore';

interface DroneShipProps {
  position?: [number, number, number];
}

export function DroneShip({ position = [0, 0, 0] }: DroneShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { shipMotion, updateShipMotion } = useEnvironmentStore();

  // Update ship motion each frame
  useFrame((_, delta) => {
    updateShipMotion(delta);

    if (groupRef.current) {
      groupRef.current.rotation.x = shipMotion.pitch;
      groupRef.current.rotation.z = shipMotion.roll;
      groupRef.current.position.y = position[1] + shipMotion.heave;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main barge hull */}
      <mesh position={[0, -3, 0]} receiveShadow castShadow>
        <boxGeometry args={[90, 6, 50]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.3} />
      </mesh>

      {/* Deck surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <planeGeometry args={[90, 50]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.85} metalness={0.4} />
      </mesh>

      {/* Deck plates pattern */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={`deck-line-x-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[(i - 4) * 10, 0.15, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.3, 50]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`deck-line-z-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.15, (i - 2) * 10]}
          receiveShadow
        >
          <planeGeometry args={[90, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}

      {/* SpaceX X marking - large white X */}
      <group position={[0, 0.2, 0]}>
        {/* X diagonal 1 */}
        <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]}>
          <planeGeometry args={[45, 4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        {/* X diagonal 2 */}
        <mesh rotation={[-Math.PI / 2, -Math.PI / 4, 0]}>
          <planeGeometry args={[45, 4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Center target circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.25, 0]}>
        <ringGeometry args={[8, 10, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner target */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.28, 0]}>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial
          color="#ff3300"
          roughness={0.6}
          emissive="#ff3300"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Edge railings */}
      <EdgeRailings />

      {/* Corner thrusters (station-keeping) */}
      <Thruster position={[40, -2, 22]} />
      <Thruster position={[40, -2, -22]} />
      <Thruster position={[-40, -2, 22]} />
      <Thruster position={[-40, -2, -22]} />

      {/* Equipment structures */}
      <EquipmentBox position={[-35, 2.5, 18]} size={[8, 5, 6]} />
      <EquipmentBox position={[-35, 2.5, -18]} size={[8, 5, 6]} />
      <EquipmentBox position={[38, 1.5, 0]} size={[5, 3, 8]} />

      {/* Deck lights */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (i % 2 === 0 ? 1 : -1) * 35;
        const z = ((Math.floor(i / 2) - 1.5) * 15);
        return (
          <pointLight
            key={`deck-light-${i}`}
            position={[x, 3, z]}
            intensity={0.3}
            color="#ffaa00"
            distance={30}
          />
        );
      })}

      {/* Navigation lights */}
      <pointLight position={[45, 1, 0]} intensity={0.5} color="#00ff00" distance={15} />
      <pointLight position={[-45, 1, 0]} intensity={0.5} color="#ff0000" distance={15} />
    </group>
  );
}

function EdgeRailings() {
  const railHeight = 2;
  const railRadius = 0.15;
  const postSpacing = 10;

  return (
    <group>
      {/* Front and back rails */}
      {[-25, 25].map((z) => (
        <group key={`rail-${z}`}>
          {/* Top rail */}
          <mesh position={[0, railHeight, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[railRadius, railRadius, 90, 8]} />
            <meshStandardMaterial color="#666666" roughness={0.6} metalness={0.7} />
          </mesh>
          {/* Posts */}
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={`post-${z}-${i}`} position={[(i - 4.5) * postSpacing, railHeight / 2, z]}>
              <cylinderGeometry args={[railRadius, railRadius, railHeight, 8]} />
              <meshStandardMaterial color="#666666" roughness={0.6} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Side rails */}
      {[-45, 45].map((x) => (
        <group key={`rail-side-${x}`}>
          {/* Top rail */}
          <mesh position={[x, railHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[railRadius, railRadius, 50, 8]} />
            <meshStandardMaterial color="#666666" roughness={0.6} metalness={0.7} />
          </mesh>
          {/* Posts */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={`post-side-${x}-${i}`} position={[x, railHeight / 2, (i - 2.5) * postSpacing]}>
              <cylinderGeometry args={[railRadius, railRadius, railHeight, 8]} />
              <meshStandardMaterial color="#666666" roughness={0.6} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Thruster({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 2, 3, 8]} />
        <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.5} />
      </mesh>
    </group>
  );
}

function EquipmentBox({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#444444" roughness={0.8} metalness={0.3} />
    </mesh>
  );
}
