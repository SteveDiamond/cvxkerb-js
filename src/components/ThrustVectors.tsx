import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface ThrustVectorsProps {
  positions: [number, number, number][];
  thrusts: [number, number, number][];
  currentIndex: number;
}

export function ThrustVectors({ positions, thrusts, currentIndex }: ThrustVectorsProps) {
  const maxThrust = useMemo(() => {
    let max = 0;
    for (const t of thrusts) {
      const mag = Math.sqrt(t[0] ** 2 + t[1] ** 2 + t[2] ** 2);
      if (mag > max) max = mag;
    }
    return max || 1;
  }, [thrusts]);

  // Convert physics coords [x, y, z] (z=altitude) to Three.js [x, y, z] (y=up)
  const arrows = useMemo(() => {
    const result: {
      start: [number, number, number];
      end: [number, number, number];
      isPast: boolean;
      magnitude: number;
    }[] = [];

    for (let i = 0; i < thrusts.length; i++) {
      if (i % 3 !== 0) continue; // Only show every 3rd vector
      if (i > currentIndex + 10) continue; // Don't show far future

      const pos = positions[i];
      const thrust = thrusts[i];
      const magnitude = Math.sqrt(thrust[0] ** 2 + thrust[1] ** 2 + thrust[2] ** 2);
      if (magnitude < 0.001) continue;

      // Normalize and scale for visualization
      // Swap y/z for Three.js coordinate system
      const scale = (magnitude / maxThrust) * 50;
      const dir = new THREE.Vector3(thrust[0], thrust[2], thrust[1]).normalize();

      // Start position with swapped coords
      const startPos: [number, number, number] = [pos[0], pos[2], pos[1]];

      result.push({
        start: startPos,
        end: [
          startPos[0] + dir.x * scale,
          startPos[1] + dir.y * scale,
          startPos[2] + dir.z * scale,
        ],
        isPast: i <= currentIndex,
        magnitude,
      });
    }

    return result;
  }, [positions, thrusts, currentIndex, maxThrust]);

  return (
    <group>
      {arrows.map((arrow, i) => {
        const color = arrow.isPast ? '#ff3300' : '#ff9966';
        const opacity = arrow.isPast ? 0.9 : 0.4;

        return (
          <group key={i}>
            {/* Arrow shaft */}
            <Line
              points={[arrow.start, arrow.end]}
              color={color}
              lineWidth={2}
              transparent
              opacity={opacity}
            />

            {/* Arrow head */}
            <mesh position={arrow.end}>
              <coneGeometry args={[2, 6, 8]} />
              <meshBasicMaterial color={color} transparent opacity={opacity} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
