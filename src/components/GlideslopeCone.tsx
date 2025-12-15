import { useMemo } from 'react';
import * as THREE from 'three';

interface GlideslopeConeProps {
  targetPosition: [number, number, number];
  maxAltitude: number;
  alpha: number; // Glide slope angle in radians
}

export function GlideslopeCone({ targetPosition, maxAltitude, alpha }: GlideslopeConeProps) {
  // The glide slope constraint is: z >= tan(alpha) * sqrt(x^2 + y^2)
  // This forms an inverted cone with apex at the landing target
  // The cone radius at maxAltitude = maxAltitude / tan(alpha)

  const coneGeometry = useMemo(() => {
    const radius = maxAltitude / Math.tan(alpha);
    // ConeGeometry: (radius, height, radialSegments, heightSegments, openEnded)
    const geo = new THREE.ConeGeometry(radius, maxAltitude, 64, 1, true);
    return geo;
  }, [maxAltitude, alpha]);

  // Wireframe rings at different altitudes for better visualization
  const rings = useMemo(() => {
    const altitudes = [0.2, 0.4, 0.6, 0.8, 1.0];
    return altitudes.map((frac) => {
      const altitude = maxAltitude * frac;
      const radius = altitude / Math.tan(alpha);
      return { altitude, radius };
    });
  }, [maxAltitude, alpha]);

  return (
    <group position={[targetPosition[0], targetPosition[1], targetPosition[2]]}>
      {/* Semi-transparent cone surface */}
      <mesh
        position={[0, 0, maxAltitude / 2]}
        rotation={[0, 0, 0]}
        geometry={coneGeometry}
      >
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe version for edges */}
      <mesh
        position={[0, 0, maxAltitude / 2]}
        rotation={[0, 0, 0]}
        geometry={coneGeometry}
      >
        <meshBasicMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Altitude rings for visual reference */}
      {rings.map(({ altitude, radius }, i) => (
        <mesh key={i} position={[0, 0, altitude]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 2, radius + 2, 64]} />
          <meshBasicMaterial
            color="#00ff88"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Apex marker at landing target */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
