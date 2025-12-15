import { useMemo } from 'react';
import * as THREE from 'three';

export function Terrain() {
  // Create a simple procedural terrain
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const positions = geo.attributes.position.array as Float32Array;

    // Add some height variation (but keep center flat for landing pad)
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const distFromCenter = Math.sqrt(x * x + y * y);

      // Keep center flat, add noise further out
      if (distFromCenter > 100) {
        const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 20;
        const noise2 = Math.sin(x * 0.05) * Math.cos(y * 0.03) * 5;
        positions[i + 2] = noise + noise2;
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        geometry={geometry}
        receiveShadow
      >
        <meshStandardMaterial
          color="#1a2a1a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Ocean/water plane (below terrain) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial
          color="#0a1a2a"
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Fog for depth */}
      <fog attach="fog" args={['#0a0a0a', 500, 2000]} />
    </group>
  );
}
