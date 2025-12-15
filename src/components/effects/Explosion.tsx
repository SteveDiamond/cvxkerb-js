import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  impactVelocity?: number;
}

export function Explosion({ position, impactVelocity = 50 }: ExplosionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fireballRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());

  // Scale explosion based on impact velocity
  const explosionScale = Math.min(1 + impactVelocity / 100, 3);

  // Particle system for debris
  const particleCount = 300;
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities: [number, number, number][] = [];
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Start at explosion center
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random outward velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.8; // Bias upward
      const speed = (30 + Math.random() * 80) * explosionScale;
      velocities.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed * 0.7 + 20, // Bias upward
      ]);

      // Orange/red/yellow colors
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        // Orange
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.4;
        colors[i * 3 + 2] = 0;
      } else if (colorChoice < 0.7) {
        // Red
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.1;
        colors[i * 3 + 2] = 0;
      } else {
        // Yellow
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.2;
      }
    }

    return { positions, velocities, colors };
  }, [explosionScale]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;

    // Expand and fade fireball
    if (fireballRef.current) {
      const scale = Math.min(elapsed * 40 * explosionScale, 30 * explosionScale);
      fireballRef.current.scale.setScalar(scale);
      (fireballRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - elapsed / 2);
    }

    // Core shrinks faster
    if (coreRef.current) {
      const scale = Math.max(0, (1 - elapsed * 2) * 15 * explosionScale);
      coreRef.current.scale.setScalar(scale);
      (coreRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - elapsed);
    }

    // Update debris particles
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        // Update position
        posArray[i * 3] += velocities[i][0] * 0.016;
        posArray[i * 3 + 1] += velocities[i][1] * 0.016;
        posArray[i * 3 + 2] += velocities[i][2] * 0.016;

        // Apply gravity
        velocities[i][2] -= 3.72 * 0.016;

        // Ground collision
        if (posArray[i * 3 + 2] < 0) {
          posArray[i * 3 + 2] = 0;
          velocities[i][2] *= -0.3; // Bounce with damping
          velocities[i][0] *= 0.8;
          velocities[i][1] *= 0.8;
        }
      }

      pointsRef.current.geometry.attributes.position.needsUpdate = true;

      // Fade particles
      (pointsRef.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - elapsed / 4);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main fireball */}
      <mesh ref={fireballRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff4400"
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Inner bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffff00"
          transparent
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Debris particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={3}
          transparent
          opacity={1}
          sizeAttenuation
          vertexColors
          depthWrite={false}
        />
      </points>

      {/* Explosion light */}
      <pointLight
        intensity={10 * explosionScale}
        color="#ff6600"
        distance={500}
        decay={2}
      />
    </group>
  );
}
