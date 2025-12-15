import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface RocketProps {
  position: [number, number, number];
  thrust: [number, number, number];
  velocity?: [number, number, number];
}

// Preload the model
useGLTF.preload('/models/starship.glb');

export function Rocket({ position, thrust }: RocketProps) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const innerFlameRef = useRef<THREE.Mesh>(null);

  // Load the Starship model
  const { scene } = useGLTF('/models/starship.glb');

  // Clone the scene to avoid mutation issues with multiple instances
  const model = useMemo(() => {
    const cloned = scene.clone();

    // Calculate scale to make the rocket ~50m tall
    const bbox = new THREE.Box3().setFromObject(cloned);
    const modelHeight = bbox.max.y - bbox.min.y;
    const targetHeight = 50; // meters
    const scale = targetHeight / modelHeight;

    cloned.scale.setScalar(scale);

    // Center the model
    bbox.setFromObject(cloned);
    const center = bbox.getCenter(new THREE.Vector3());
    cloned.position.sub(center);

    // Enable shadows on all meshes
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return cloned;
  }, [scene]);

  // Calculate thrust magnitude for flame size
  const thrustMagnitude = Math.sqrt(
    thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2
  );
  const maxThrust = 800000; // Reference max thrust
  const thrustRatio = Math.min(thrustMagnitude / maxThrust, 1);
  const flameScale = thrustRatio * 3 + 0.5;

  // Point rocket in thrust direction
  const thrustDir = useMemo(() => {
    if (thrustMagnitude < 0.001) return new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3(thrust[0], thrust[1], thrust[2]).normalize();
  }, [thrust, thrustMagnitude]);

  useFrame((state) => {
    if (groupRef.current) {
      // Align rocket's Y-axis with thrust direction
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(up, thrustDir);
      groupRef.current.quaternion.copy(quaternion);
    }

    // Animate flame flicker
    const time = state.clock.elapsedTime;
    if (flameRef.current && thrustMagnitude > 0.001) {
      const flicker = 0.85 + Math.sin(time * 50) * 0.1 + Math.random() * 0.15;
      flameRef.current.scale.set(
        flameScale * flicker,
        flameScale * (0.9 + Math.random() * 0.2),
        flameScale * flicker
      );
    }
    if (innerFlameRef.current && thrustMagnitude > 0.001) {
      const innerFlicker = 0.9 + Math.sin(time * 60 + 1) * 0.1;
      innerFlameRef.current.scale.setScalar(flameScale * 0.6 * innerFlicker);
    }
  });

  // Calculate flame position (bottom of the rocket)
  const flameYOffset = -28;

  return (
    <group ref={groupRef} position={position}>
      {/* Starship Model */}
      <primitive object={model} />

      {/* Raptor Engine Exhaust - realistic methalox plume */}
      {thrustMagnitude > 0.001 && (
        <group position={[0, flameYOffset, 0]}>
          {/* Shock diamonds - the bright spots in supersonic exhaust */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={`diamond-${i}`}
              position={[0, -(2 + i * 3) * flameScale * 0.4, 0]}
              scale={flameScale * Math.max(0.15, 0.5 - i * 0.08)}
            >
              <octahedronGeometry args={[1.2, 0]} />
              <meshBasicMaterial
                color={i < 2 ? '#ffffff' : '#aaccff'}
                transparent
                opacity={Math.max(0.1, 0.9 - i * 0.18)}
              />
            </mesh>
          ))}

          {/* Inner core - white hot near nozzle */}
          <mesh scale={[flameScale * 0.5, flameScale * 0.8, flameScale * 0.5]}>
            <cylinderGeometry args={[0.8, 1.5, 6, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>

          {/* Primary plume - blue-white (methalox burns blue) */}
          <mesh ref={innerFlameRef} scale={[flameScale * 0.6, flameScale, flameScale * 0.6]}>
            <cylinderGeometry args={[1.2, 2.5, 12, 16]} />
            <meshBasicMaterial color="#99ccff" transparent opacity={0.7} />
          </mesh>

          {/* Outer expansion - faint blue glow */}
          <mesh ref={flameRef} scale={[flameScale * 0.8, flameScale * 1.2, flameScale * 0.8]}>
            <cylinderGeometry args={[2, 4, 18, 16]} />
            <meshBasicMaterial color="#6699cc" transparent opacity={0.3} />
          </mesh>

          {/* Exhaust glow light - blue tinted for methalox */}
          <pointLight
            position={[0, -8, 0]}
            intensity={thrustRatio * 3}
            color="#99bbff"
            distance={150}
          />

          {/* Secondary warm glow from engine bell */}
          <pointLight
            position={[0, 2, 0]}
            intensity={thrustRatio * 1.5}
            color="#ffaa66"
            distance={50}
          />
        </group>
      )}
    </group>
  );
}
