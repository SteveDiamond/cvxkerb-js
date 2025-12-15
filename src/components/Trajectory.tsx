import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface TrajectoryProps {
  positions: [number, number, number][];
  currentIndex: number;
}

export function Trajectory({ positions, currentIndex }: TrajectoryProps) {
  // Create gradient colors based on progress
  const { pastPoints, futurePoints, pastColors, futureColors } = useMemo(() => {
    const past: THREE.Vector3[] = [];
    const future: THREE.Vector3[] = [];
    const pastCols: THREE.Color[] = [];
    const futureCols: THREE.Color[] = [];

    for (let i = 0; i < positions.length; i++) {
      const point = new THREE.Vector3(...positions[i]);
      const progress = i / (positions.length - 1);

      if (i <= currentIndex) {
        past.push(point);
        // Orange to red for past trajectory
        pastCols.push(new THREE.Color().setHSL(0.08 - progress * 0.08, 1, 0.5));
      } else {
        future.push(point);
        // Blue to cyan for future trajectory
        futureCols.push(new THREE.Color().setHSL(0.5 + progress * 0.1, 0.8, 0.6));
      }
    }

    // Add overlap point
    if (currentIndex < positions.length - 1 && past.length > 0) {
      future.unshift(past[past.length - 1]);
      futureCols.unshift(new THREE.Color().setHSL(0.5, 0.8, 0.6));
    }

    return {
      pastPoints: past.map((p) => [p.x, p.y, p.z] as [number, number, number]),
      futurePoints: future.map((p) => [p.x, p.y, p.z] as [number, number, number]),
      pastColors: pastCols,
      futureColors: futureCols,
    };
  }, [positions, currentIndex]);

  return (
    <group>
      {/* Past trajectory (solid) */}
      {pastPoints.length >= 2 && (
        <Line
          points={pastPoints}
          color="#ff6600"
          lineWidth={3}
          vertexColors={pastColors.map((c) => [c.r, c.g, c.b] as [number, number, number])}
        />
      )}

      {/* Future trajectory (dashed) */}
      {futurePoints.length >= 2 && (
        <Line
          points={futurePoints}
          color="#66ccff"
          lineWidth={2}
          dashed
          dashSize={10}
          gapSize={5}
          vertexColors={futureColors.map((c) => [c.r, c.g, c.b] as [number, number, number])}
        />
      )}

      {/* Position markers */}
      {positions.map((pos, i) => {
        if (i % 5 !== 0) return null; // Only show every 5th marker
        const isPast = i <= currentIndex;
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshBasicMaterial
              color={isPast ? '#ff6600' : '#66ccff'}
              transparent
              opacity={isPast ? 0.8 : 0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}
