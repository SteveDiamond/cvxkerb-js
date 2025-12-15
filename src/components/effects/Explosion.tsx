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
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const debrisRef = useRef<THREE.Points>(null);
  const sparkRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());

  // Scale explosion based on impact velocity
  const explosionScale = Math.min(1 + impactVelocity / 50, 4);

  // Debris particles - chunks flying outward
  const debrisCount = 200;
  const { debrisPositions, debrisVelocities, debrisSizes } = useMemo(() => {
    const positions = new Float32Array(debrisCount * 3);
    const velocities: [number, number, number][] = [];
    const sizes = new Float32Array(debrisCount);

    for (let i = 0; i < debrisCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.6;
      const speed = (20 + Math.random() * 60) * explosionScale;
      velocities.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 15,
        Math.sin(phi) * Math.sin(theta) * speed,
      ]);

      sizes[i] = 2 + Math.random() * 4;
    }

    return { debrisPositions: positions, debrisVelocities: velocities, debrisSizes: sizes };
  }, [explosionScale]);

  // Sparks - small bright particles
  const sparkCount = 500;
  const { sparkPositions, sparkVelocities } = useMemo(() => {
    const positions = new Float32Array(sparkCount * 3);
    const velocities: [number, number, number][] = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = (40 + Math.random() * 100) * explosionScale;
      velocities.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.cos(phi)) * speed * 0.8 + 20,
        Math.sin(phi) * Math.sin(theta) * speed,
      ]);
    }

    return { sparkPositions: positions, sparkVelocities: velocities };
  }, [explosionScale]);

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;

    // Fireball - rapid expansion then fade
    if (fireballRef.current) {
      const fireballPhase = Math.min(elapsed * 3, 1);
      const scale = fireballPhase * 25 * explosionScale;
      fireballRef.current.scale.setScalar(scale);

      const mat = fireballRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (1 - elapsed / 1.5) * 0.9);

      // Color shift from white -> orange -> red -> dark
      if (elapsed < 0.3) {
        mat.color.setHex(0xffffaa);
      } else if (elapsed < 0.8) {
        mat.color.setHex(0xff6600);
      } else {
        mat.color.setHex(0x441100);
      }
    }

    // Shockwave ring expanding outward
    if (shockwaveRef.current) {
      const shockScale = elapsed * 80 * explosionScale;
      shockwaveRef.current.scale.set(shockScale, shockScale, 1);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.6 - elapsed * 0.8);
    }

    // Update debris
    if (debrisRef.current) {
      const posArray = debrisRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < debrisCount; i++) {
        posArray[i * 3] += debrisVelocities[i][0] * 0.016;
        posArray[i * 3 + 1] += debrisVelocities[i][1] * 0.016;
        posArray[i * 3 + 2] += debrisVelocities[i][2] * 0.016;

        // Gravity
        debrisVelocities[i][1] -= 9.8 * 0.016;

        // Ground collision with bounce
        if (posArray[i * 3 + 1] < 0) {
          posArray[i * 3 + 1] = 0;
          debrisVelocities[i][1] *= -0.3;
          debrisVelocities[i][0] *= 0.7;
          debrisVelocities[i][2] *= 0.7;
        }
      }

      debrisRef.current.geometry.attributes.position.needsUpdate = true;
      const mat = debrisRef.current.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1 - elapsed / 5);
    }

    // Update sparks
    if (sparkRef.current) {
      const posArray = sparkRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < sparkCount; i++) {
        posArray[i * 3] += sparkVelocities[i][0] * 0.016;
        posArray[i * 3 + 1] += sparkVelocities[i][1] * 0.016;
        posArray[i * 3 + 2] += sparkVelocities[i][2] * 0.016;

        // Drag slows sparks quickly
        sparkVelocities[i][0] *= 0.98;
        sparkVelocities[i][1] -= 5 * 0.016;
        sparkVelocities[i][2] *= 0.98;
      }

      sparkRef.current.geometry.attributes.position.needsUpdate = true;
      const mat = sparkRef.current.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1 - elapsed / 2);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main fireball */}
      <mesh ref={fireballRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#ffffaa"
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Shockwave ring */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Debris chunks */}
      <points ref={debrisRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[debrisPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[debrisSizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={4}
          color="#332211"
          transparent
          opacity={1}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Sparks */}
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={2}
          color="#ffcc00"
          transparent
          opacity={1}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Explosion lights */}
      <pointLight
        intensity={20 * explosionScale}
        color="#ff6600"
        distance={300}
        decay={2}
      />
      <pointLight
        position={[0, 10, 0]}
        intensity={10 * explosionScale}
        color="#ffaa00"
        distance={200}
        decay={2}
      />
    </group>
  );
}
