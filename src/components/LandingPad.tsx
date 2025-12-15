import * as THREE from 'three';

interface LandingPadProps {
  position: [number, number, number];
}

export function LandingPad({ position }: LandingPadProps) {
  return (
    <group position={position}>
      {/* Main pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[30, 32]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>

      {/* SpaceX-style X marking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[20, 25, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* Cross lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <planeGeometry args={[40, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, Math.PI / 2, 0]} position={[0, 0.15, 0]}>
        <planeGeometry args={[40, 3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Center target */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#ff0000" roughness={0.6} emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>

      {/* Edge lights */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <pointLight
            key={i}
            position={[Math.cos(angle) * 28, 2, Math.sin(angle) * 28]}
            intensity={0.5}
            color="#00ff00"
            distance={20}
          />
        );
      })}
    </group>
  );
}
