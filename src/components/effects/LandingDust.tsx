import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvironmentStore } from '../../stores/environmentStore';

interface LandingDustProps {
  rocketPosition: [number, number, number];
  thrustMagnitude: number;
  maxThrust?: number;
}

export function LandingDust({
  rocketPosition,
  thrustMagnitude,
  maxThrust = 800000,
}: LandingDustProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { environmentType } = useEnvironmentStore();

  // Get dust color based on environment
  const dustColor = useMemo(() => {
    switch (environmentType) {
      case 'mars':
        return new THREE.Color('#cc6644'); // Red/orange Mars dust
      case 'droneShip':
        return new THREE.Color('#888899'); // Gray smoke/steam
      case 'rtls':
      default:
        return new THREE.Color('#aa9977'); // Tan/brown dust
    }
  }, [environmentType]);

  // Particle system setup
  const particleCount = 500;
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Start all particles at origin (will be repositioned)
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random initial velocities
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 30;
      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = Math.sin(angle) * speed;
      velocities[i * 3 + 2] = Math.random() * 5;

      lifetimes[i] = -1; // -1 means particle is inactive
      sizes[i] = 1 + Math.random() * 3;
    }

    return { positions, velocities, lifetimes, sizes };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(particles.sizes, 1));
    return geo;
  }, [particles]);

  // Spawn and update particles
  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const altitude = rocketPosition[2];
    const thrustRatio = thrustMagnitude / maxThrust;

    // Only show dust when low altitude and thrusting
    const shouldSpawnDust = altitude < 100 && thrustRatio > 0.1;
    const spawnRate = shouldSpawnDust ? Math.floor(thrustRatio * 20) : 0;

    const positions = geometry.attributes.position.array as Float32Array;

    // Update existing particles and spawn new ones
    let spawned = 0;
    for (let i = 0; i < particleCount; i++) {
      if (particles.lifetimes[i] >= 0) {
        // Update active particle
        particles.lifetimes[i] -= delta;

        if (particles.lifetimes[i] <= 0) {
          // Particle died
          particles.lifetimes[i] = -1;
          positions[i * 3 + 2] = -1000; // Hide below ground
        } else {
          // Move particle
          positions[i * 3] += particles.velocities[i * 3] * delta;
          positions[i * 3 + 1] += particles.velocities[i * 3 + 1] * delta;
          positions[i * 3 + 2] += particles.velocities[i * 3 + 2] * delta;

          // Apply drag and gravity
          particles.velocities[i * 3] *= 0.98;
          particles.velocities[i * 3 + 1] *= 0.98;
          particles.velocities[i * 3 + 2] -= 2 * delta; // Light gravity for dust

          // Don't go below ground
          if (positions[i * 3 + 2] < 0) {
            positions[i * 3 + 2] = 0;
            particles.velocities[i * 3 + 2] = 0;
          }
        }
      } else if (spawned < spawnRate) {
        // Spawn new particle at rocket exhaust position
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 5;
        const exhaustZ = Math.max(0, rocketPosition[2] - 25); // Just above ground

        if (exhaustZ < 50) {
          positions[i * 3] = rocketPosition[0] + Math.cos(angle) * radius;
          positions[i * 3 + 1] = rocketPosition[1] + Math.sin(angle) * radius;
          positions[i * 3 + 2] = Math.max(0.5, exhaustZ);

          // Radial velocity based on exhaust
          const speed = 20 + Math.random() * 40 * thrustRatio;
          particles.velocities[i * 3] = Math.cos(angle) * speed;
          particles.velocities[i * 3 + 1] = Math.sin(angle) * speed;
          particles.velocities[i * 3 + 2] = Math.random() * 10;

          particles.lifetimes[i] = 1 + Math.random() * 2;
          spawned++;
        }
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={dustColor}
        size={3}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
