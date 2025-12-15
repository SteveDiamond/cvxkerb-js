import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RocketProps {
  position: [number, number, number];
  thrust: [number, number, number];
}

export function Rocket({ position, thrust }: RocketProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);

  // Calculate thrust magnitude for flame size
  const thrustMagnitude = Math.sqrt(
    thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2
  );
  const maxThrust = 800000; // Reference max thrust
  const flameScale = Math.min(thrustMagnitude / maxThrust, 1) * 3 + 0.5;

  // Point rocket in thrust direction (opposite of thrust vector for orientation)
  const thrustDir = useMemo(() => {
    if (thrustMagnitude < 0.001) return new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3(thrust[0], thrust[1], thrust[2]).normalize();
  }, [thrust, thrustMagnitude]);

  useFrame(() => {
    if (groupRef.current) {
      // Look in the direction of thrust (rocket nose points opposite to thrust)
      const lookAt = new THREE.Vector3(
        position[0] + thrustDir.x,
        position[1] + thrustDir.y,
        position[2] + thrustDir.z
      );
      groupRef.current.lookAt(lookAt);
    }

    // Animate flame flicker
    if (flameRef.current && thrustMagnitude > 0.001) {
      const flicker = 0.9 + Math.random() * 0.2;
      flameRef.current.scale.setScalar(flameScale * flicker);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Rocket body - Falcon 9 style */}
      <mesh castShadow>
        <cylinderGeometry args={[3, 3, 40, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 25, 0]} castShadow>
        <coneGeometry args={[3, 10, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Grid fins */}
      {[0, 90, 180, 270].map((angle) => (
        <mesh
          key={angle}
          position={[
            Math.cos((angle * Math.PI) / 180) * 4,
            -12,
            Math.sin((angle * Math.PI) / 180) * 4,
          ]}
          rotation={[0, (angle * Math.PI) / 180, 0]}
          castShadow
        >
          <boxGeometry args={[0.3, 6, 4]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Landing legs (deployed) */}
      {[0, 120, 240].map((angle) => (
        <mesh
          key={`leg-${angle}`}
          position={[
            Math.cos((angle * Math.PI) / 180) * 5,
            -22,
            Math.sin((angle * Math.PI) / 180) * 5,
          ]}
          rotation={[
            Math.PI / 6,
            (angle * Math.PI) / 180,
            0,
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.3, 0.5, 12, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Engine bell */}
      <mesh position={[0, -22, 0]}>
        <cylinderGeometry args={[2, 2.5, 4, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engine flame */}
      {thrustMagnitude > 0.001 && (
        <mesh ref={flameRef} position={[0, -26, 0]} scale={flameScale}>
          <coneGeometry args={[2, 8, 16]} />
          <meshBasicMaterial
            color="#ff6600"
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Inner flame (brighter) */}
      {thrustMagnitude > 0.001 && (
        <mesh position={[0, -25, 0]} scale={flameScale * 0.6}>
          <coneGeometry args={[1.2, 6, 16]} />
          <meshBasicMaterial
            color="#ffcc00"
            transparent
            opacity={0.95}
          />
        </mesh>
      )}
    </group>
  );
}
