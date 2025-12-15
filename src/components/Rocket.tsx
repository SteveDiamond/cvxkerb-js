import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RocketProps {
  position: [number, number, number];
  thrust: [number, number, number];
  velocity?: [number, number, number];
}

export function Rocket({ position, thrust, velocity = [0, 0, 0] }: RocketProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);

  // Landing leg deployment (0 = stowed, 1 = deployed)
  const [legDeployment, setLegDeployment] = useState(0);

  // Grid fin deflection angles
  const [gridFinDeflections, setGridFinDeflections] = useState([0, 0, 0, 0]);

  // Calculate thrust magnitude for flame size
  const thrustMagnitude = Math.sqrt(
    thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2
  );
  const maxThrust = 800000; // Reference max thrust
  const thrustRatio = Math.min(thrustMagnitude / maxThrust, 1);
  const flameScale = thrustRatio * 3 + 0.5;

  // Calculate velocity magnitude
  const velocityMagnitude = Math.sqrt(
    velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2
  );

  // Point rocket in thrust direction (opposite of thrust vector for orientation)
  const thrustDir = useMemo(() => {
    if (thrustMagnitude < 0.001) return new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3(thrust[0], thrust[1], thrust[2]).normalize();
  }, [thrust, thrustMagnitude]);

  useFrame((state, delta) => {
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
    const time = state.clock.elapsedTime;
    if (flameRef.current && thrustMagnitude > 0.001) {
      const flicker = 0.85 + Math.sin(time * 50) * 0.1 + Math.random() * 0.15;
      flameRef.current.scale.set(flameScale * flicker, flameScale * (0.9 + Math.random() * 0.2), flameScale * flicker);
    }
    if (innerFlameRef.current && thrustMagnitude > 0.001) {
      const innerFlicker = 0.9 + Math.sin(time * 60 + 1) * 0.1;
      innerFlameRef.current.scale.setScalar(flameScale * 0.6 * innerFlicker);
    }

    // Deploy landing legs based on altitude (deploy below 500m)
    const altitude = position[2];
    const targetDeployment = altitude < 500 ? 1 : 0;
    const deploySpeed = 0.8; // Deployment speed
    setLegDeployment((prev) => {
      if (Math.abs(prev - targetDeployment) < 0.01) return targetDeployment;
      return prev + (targetDeployment - prev) * deploySpeed * delta * 3;
    });

    // Animate grid fins based on velocity direction (simulate steering)
    if (velocityMagnitude > 1) {
      const vx = velocity[0] / velocityMagnitude;
      const vy = velocity[1] / velocityMagnitude;
      // Calculate fin deflections based on steering needs
      const maxDeflection = 0.4; // radians
      setGridFinDeflections([
        vx * maxDeflection + Math.sin(time * 3) * 0.05,
        vy * maxDeflection + Math.sin(time * 3.5) * 0.05,
        -vx * maxDeflection + Math.sin(time * 4) * 0.05,
        -vy * maxDeflection + Math.sin(time * 4.5) * 0.05,
      ]);
    }
  });

  // Calculate leg positions based on deployment
  const getLegTransform = (angle: number, deployment: number) => {
    const rad = (angle * Math.PI) / 180;
    const deployAngle = Math.PI / 6 + (Math.PI / 4) * deployment; // More angled when deployed
    const radius = 3 + deployment * 3; // Extends outward
    const yOffset = -18 - deployment * 4; // Moves down when deployed

    return {
      position: [
        Math.cos(rad) * radius,
        yOffset,
        Math.sin(rad) * radius,
      ] as [number, number, number],
      rotation: [
        deployAngle,
        rad,
        0,
      ] as [number, number, number],
    };
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Rocket body - Falcon 9 style */}
      <mesh castShadow>
        <cylinderGeometry args={[3, 3, 40, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Body details - interstage line */}
      <mesh position={[0, -10, 0]}>
        <cylinderGeometry args={[3.1, 3.1, 0.5, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 25, 0]} castShadow>
        <coneGeometry args={[3, 10, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Grid fins - animated */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group
          key={angle}
          position={[
            Math.cos((angle * Math.PI) / 180) * 4,
            -12,
            Math.sin((angle * Math.PI) / 180) * 4,
          ]}
          rotation={[gridFinDeflections[i], (angle * Math.PI) / 180, 0]}
        >
          {/* Fin structure */}
          <mesh castShadow>
            <boxGeometry args={[0.3, 6, 4]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Grid pattern */}
          {[-1.2, 0, 1.2].map((offset) => (
            <mesh key={offset} position={[0.2, 0, offset]}>
              <boxGeometry args={[0.1, 5.5, 0.2]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Landing legs - animated deployment */}
      {[0, 120, 240].map((angle) => {
        const transform = getLegTransform(angle, legDeployment);
        return (
          <group key={`leg-${angle}`}>
            {/* Main leg strut */}
            <mesh
              position={transform.position}
              rotation={transform.rotation}
              castShadow
            >
              <cylinderGeometry args={[0.25, 0.4, 12, 8]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Leg foot */}
            <mesh
              position={[
                transform.position[0] + Math.cos((angle * Math.PI) / 180) * legDeployment * 4,
                transform.position[1] - 5 - legDeployment * 2,
                transform.position[2] + Math.sin((angle * Math.PI) / 180) * legDeployment * 4,
              ]}
            >
              <cylinderGeometry args={[0.8, 1, 0.5, 8]} />
              <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* Engine section */}
      <group position={[0, -20, 0]}>
        {/* Engine bell */}
        <mesh position={[0, -2, 0]}>
          <cylinderGeometry args={[2, 3, 4, 16]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Engine nozzle detail */}
        <mesh position={[0, -4.5, 0]}>
          <cylinderGeometry args={[2.8, 2.5, 1, 16]} />
          <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Engine exhaust */}
      {thrustMagnitude > 0.001 && (
        <group position={[0, -26, 0]}>
          {/* Outer flame - orange */}
          <mesh ref={flameRef} scale={flameScale}>
            <coneGeometry args={[2.5, 10, 16]} />
            <meshBasicMaterial color="#ff5500" transparent opacity={0.85} />
          </mesh>

          {/* Middle flame - yellow */}
          <mesh ref={innerFlameRef} scale={flameScale * 0.7}>
            <coneGeometry args={[1.8, 8, 16]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.9} />
          </mesh>

          {/* Inner core - white hot */}
          <mesh scale={flameScale * 0.4}>
            <coneGeometry args={[1, 5, 16]} />
            <meshBasicMaterial color="#ffffcc" transparent opacity={0.95} />
          </mesh>

          {/* Mach diamonds effect */}
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, -(3 + i * 2.5) * flameScale * 0.3, 0]} scale={flameScale * (0.4 - i * 0.1)}>
              <octahedronGeometry args={[0.8, 0]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7 - i * 0.2} />
            </mesh>
          ))}

          {/* Exhaust glow */}
          <pointLight
            position={[0, -5, 0]}
            intensity={thrustRatio * 2}
            color="#ff6600"
            distance={100}
          />
        </group>
      )}
    </group>
  );
}
