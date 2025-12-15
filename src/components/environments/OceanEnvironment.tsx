import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function OceanEnvironment() {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Create ocean geometry with enough vertices for wave animation
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(4000, 4000, 128, 128);
    return geo;
  }, []);

  // Animate waves using Gerstner wave approximation
  useFrame((_, delta) => {
    timeRef.current += delta;

    if (meshRef.current) {
      const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
      const time = timeRef.current;

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];

        // Skip center area (where drone ship is)
        const distFromCenter = Math.sqrt(x * x + y * y);
        if (distFromCenter < 60) {
          positions[i + 2] = 0;
          continue;
        }

        // Multiple wave frequencies for realism
        const wave1 = Math.sin(x * 0.02 + time * 0.8) * Math.cos(y * 0.015 + time * 0.5) * 3;
        const wave2 = Math.sin(x * 0.04 + y * 0.03 + time * 1.2) * 1.5;
        const wave3 = Math.sin(x * 0.08 - time * 2) * Math.cos(y * 0.06 + time * 1.5) * 0.8;

        // Reduce waves near ship
        const falloff = Math.min(1, (distFromCenter - 60) / 100);
        positions[i + 2] = (wave1 + wave2 + wave3) * falloff;
      }

      meshRef.current.geometry.attributes.position.needsUpdate = true;
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group>
      {/* Main ocean surface */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0a3d5c"
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Deep ocean layer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -50, 0]}>
        <planeGeometry args={[10000, 10000]} />
        <meshStandardMaterial color="#041525" roughness={1} />
      </mesh>

      {/* Horizon fog */}
      <fog attach="fog" args={['#0a1520', 500, 3000]} />

      {/* Sky gradient (simple dome) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[3500, 32, 32]} />
        <meshBasicMaterial color="#0a1525" side={THREE.BackSide} />
      </mesh>

      {/* Atmospheric lighting */}
      <ambientLight intensity={0.2} color="#4a6080" />
      <directionalLight
        position={[200, 150, 100]}
        intensity={0.8}
        color="#ffeedd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={1000}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* Moon/sun reflection simulation */}
      <pointLight position={[500, 100, 500]} intensity={0.5} color="#aaccff" distance={2000} />
    </group>
  );
}
