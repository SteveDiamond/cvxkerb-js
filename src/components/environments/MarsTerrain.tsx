import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  generateMarsTerrainData,
  applyHeightmapToGeometry,
  loadHeightmapFromImage,
  type TerrainConfig,
} from '../../utils/terrainLoader';

// Mars terrain configuration
const TERRAIN_CONFIG: TerrainConfig = {
  width: 3000,
  height: 3000,
  widthSegments: 256,
  heightSegments: 256,
  verticalScale: 80, // Max elevation variation in meters
  flatCenterRadius: 40, // Keep landing area flat
};

// URL for NASA Mars heightmap (optional - uses procedural if not available)
// You can replace this with a local file in public/terrain/mars_heightmap.png
const HEIGHTMAP_URL = '/terrain/mars_heightmap.png';

export function MarsTerrain() {
  const dustRef = useRef<THREE.Points>(null);

  // Generate terrain geometry with realistic Mars-like features
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_CONFIG.width,
      TERRAIN_CONFIG.height,
      TERRAIN_CONFIG.widthSegments,
      TERRAIN_CONFIG.heightSegments
    );

    // Generate procedural Mars terrain using FBM noise
    const heightData = generateMarsTerrainData(TERRAIN_CONFIG, 42);
    applyHeightmapToGeometry(geo, heightData);

    return geo;
  }, []);

  // Try to load heightmap from file (for real NASA DEM data)
  useEffect(() => {
    loadHeightmapFromImage(HEIGHTMAP_URL, TERRAIN_CONFIG)
      .then((heightData) => {
        applyHeightmapToGeometry(terrainGeometry, heightData);
        console.log('Loaded NASA Mars heightmap');
      })
      .catch(() => {
        // Heightmap not available, using procedural terrain
        console.log('Using procedural Mars terrain (heightmap not found)');
      });
  }, [terrainGeometry]);

  // Ambient dust particles floating
  const dustParticles = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 1000;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = Math.random() * 300 + 2;
      sizes[i] = 0.5 + Math.random() * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);

  // Animate floating dust with wind patterns
  useFrame((state) => {
    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < positions.length; i += 3) {
        // Wind drift with varying speeds
        const windSpeed = 0.02 + Math.sin(i * 0.1) * 0.015;
        positions[i] += Math.sin(time * 0.15 + i * 0.5) * windSpeed;
        positions[i + 1] += Math.cos(time * 0.12 + i * 0.3) * windSpeed;
        positions[i + 2] += Math.sin(time * 0.2 + i * 0.2) * 0.01;

        // Keep in bounds
        if (positions[i + 2] > 350) positions[i + 2] = 2;
        if (positions[i + 2] < 1) positions[i + 2] = 300;
      }

      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Mars surface with realistic terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        geometry={terrainGeometry}
        receiveShadow
      >
        <meshStandardMaterial
          color="#b5653d"
          roughness={0.92}
          metalness={0.08}
          flatShading={false}
        />
      </mesh>

      {/* Secondary detail layer for close-up visual interest */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[3000, 3000, 64, 64]} />
        <meshStandardMaterial
          color="#a85a35"
          roughness={0.95}
          metalness={0.05}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Landing pad area - flattened and prepared */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <circleGeometry args={[38, 64]} />
        <meshStandardMaterial color="#9e5a3c" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Landing target markings */}
      <LandingTarget />

      {/* Scattered rocks with better distribution */}
      <Rocks />

      {/* Distant mountains/ridges */}
      <MarsRidges />

      {/* Floating dust particles */}
      <points ref={dustRef} geometry={dustParticles}>
        <pointsMaterial
          color="#d4a574"
          size={1.8}
          transparent
          opacity={0.25}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Mars atmosphere and lighting */}
      <MarsAtmosphere />
    </group>
  );
}

function LandingTarget() {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Outer ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[28, 30, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Middle ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[18, 20, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[8, 10, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Center beacon */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[1, 1, 4, 16]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Beacon light */}
      <pointLight position={[0, 4, 0]} intensity={3} color="#00ff88" distance={150} />

      {/* Corner markers */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh
            key={angle}
            position={[Math.cos(rad) * 25, 0.6, Math.sin(rad) * 25]}
          >
            <boxGeometry args={[2.5, 1.2, 2.5]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff6600"
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Rocks() {
  const rocks = useMemo(() => {
    const rockData: {
      pos: [number, number, number];
      scale: number;
      rotation: [number, number, number];
      type: number;
    }[] = [];

    // Generate rocks with clustered distribution (more realistic)
    const clusterCenters = Array.from({ length: 20 }, () => ({
      x: (Math.random() - 0.5) * 1400,
      z: (Math.random() - 0.5) * 1400,
    }));

    for (let i = 0; i < 200; i++) {
      // Pick a cluster or random position
      const useCluster = Math.random() < 0.7;
      let x: number, z: number;

      if (useCluster) {
        const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        x = cluster.x + (Math.random() - 0.5) * 150;
        z = cluster.z + (Math.random() - 0.5) * 150;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 700;
        x = Math.cos(angle) * dist;
        z = Math.sin(angle) * dist;
      }

      // Skip if too close to landing pad
      if (Math.sqrt(x * x + z * z) < 50) continue;

      rockData.push({
        pos: [x, 0, z],
        scale: 0.3 + Math.random() * 3 + (Math.random() < 0.1 ? 5 : 0), // Some large boulders
        rotation: [
          Math.random() * 0.4 - 0.2,
          Math.random() * Math.PI * 2,
          Math.random() * 0.4 - 0.2,
        ],
        type: Math.floor(Math.random() * 3),
      });
    }

    return rockData;
  }, []);

  return (
    <group>
      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={[rock.pos[0], rock.scale * 0.35, rock.pos[2]]}
          rotation={rock.rotation}
          castShadow
        >
          {rock.type === 0 && <dodecahedronGeometry args={[rock.scale, 0]} />}
          {rock.type === 1 && <icosahedronGeometry args={[rock.scale, 0]} />}
          {rock.type === 2 && <octahedronGeometry args={[rock.scale, 0]} />}
          <meshStandardMaterial
            color={`hsl(${12 + Math.random() * 8}, ${25 + Math.random() * 15}%, ${22 + Math.random() * 12}%)`}
            roughness={0.9 + Math.random() * 0.1}
            metalness={0.02 + Math.random() * 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function MarsRidges() {
  const ridges = useMemo(() => {
    // Create distant mountain ridges/plateaus
    return [
      { pos: [900, 0, 700], scale: [400, 150, 300], rotation: 0.2 },
      { pos: [-800, 0, 900], scale: [500, 200, 350], rotation: -0.3 },
      { pos: [600, 0, -900], scale: [350, 130, 280], rotation: 0.4 },
      { pos: [-1000, 0, -600], scale: [300, 100, 250], rotation: -0.1 },
      { pos: [1100, 0, 100], scale: [450, 180, 320], rotation: 0.15 },
      { pos: [-1200, 0, 300], scale: [550, 250, 400], rotation: -0.25 },
      { pos: [200, 0, 1100], scale: [400, 170, 300], rotation: 0.1 },
      { pos: [100, 0, -1100], scale: [380, 140, 290], rotation: -0.15 },
    ];
  }, []);

  return (
    <group>
      {ridges.map((ridge, i) => (
        <group key={i} position={[ridge.pos[0], ridge.scale[1] * 0.3, ridge.pos[2]]} rotation={[0, ridge.rotation, 0]}>
          {/* Main ridge body */}
          <mesh>
            <boxGeometry args={[ridge.scale[0], ridge.scale[1], ridge.scale[2]]} />
            <meshStandardMaterial
              color="#7a3d1f"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
          {/* Erosion detail - smaller blocks on top */}
          <mesh position={[(Math.random() - 0.5) * ridge.scale[0] * 0.4, ridge.scale[1] * 0.4, (Math.random() - 0.5) * ridge.scale[2] * 0.3]}>
            <boxGeometry args={[ridge.scale[0] * 0.3, ridge.scale[1] * 0.3, ridge.scale[2] * 0.4]} />
            <meshStandardMaterial
              color="#8b4525"
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MarsAtmosphere() {
  return (
    <group>
      {/* Main sunlight - Mars gets less light than Earth */}
      <directionalLight
        position={[400, 500, 300]}
        intensity={1.8}
        color="#ffe4c4"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={3000}
        shadow-camera-left={-800}
        shadow-camera-right={800}
        shadow-camera-top={800}
        shadow-camera-bottom={-800}
      />

      {/* Ambient - reddish tint from dust scattering */}
      <ambientLight intensity={0.4} color="#e8a878" />

      {/* Fill light from atmosphere scatter */}
      <hemisphereLight
        color="#ffd4a8"
        groundColor="#8b4513"
        intensity={0.5}
      />

      {/* Mars sky dome - butterscotch/salmon color */}
      <mesh>
        <sphereGeometry args={[2800, 64, 64]} />
        <meshBasicMaterial
          color="#c9956c"
          side={THREE.BackSide}
        />
      </mesh>

      {/* Dust haze / fog */}
      <fog attach="fog" args={['#c9956c', 500, 2500]} />
    </group>
  );
}
