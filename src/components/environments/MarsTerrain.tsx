import { useMemo, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Mars terrain configuration
const TERRAIN_CONFIG = {
  width: 6000,
  height: 6000,
  widthSegments: 256,
  heightSegments: 256,
  verticalScale: 100,     // Full Mars terrain detail
  flatCenterRadius: 50,   // Just the landing pad is flat
  edgeCurlStart: 2200,    // Distance from center where curl begins
  edgeCurlStrength: 150,  // How much terrain curls down at edges
};

export function MarsTerrain() {
  // Load all Mars textures
  const [colorTexture, topoTexture, bumpTexture] = useTexture([
    '/terrain/2k_mars.jpg',
    '/terrain/mars_1k_topo.jpg',
    '/terrain/marsbump1k.jpg',
  ]);

  // Create color texture - stretch across terrain (no tiling = no seams)
  const marsColorMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    const size = 2048;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx && colorTexture.image) {
      const img = colorTexture.image as HTMLImageElement;
      // Use a larger region and stretch it (no tiling)
      const sx = img.width * 0.1;
      const sy = img.height * 0.25;
      const sw = img.width * 0.5;
      const sh = img.height * 0.5;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    // NO tiling - stretch across entire terrain
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [colorTexture]);

  // Bump map - also no tiling to avoid seams
  const marsBumpMap = useMemo(() => {
    bumpTexture.wrapS = bumpTexture.wrapT = THREE.ClampToEdgeWrapping;
    return bumpTexture;
  }, [bumpTexture]);

  // Create terrain geometry
  const terrainGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(
      TERRAIN_CONFIG.width,
      TERRAIN_CONFIG.height,
      TERRAIN_CONFIG.widthSegments,
      TERRAIN_CONFIG.heightSegments
    );
  }, []);

  // Apply real MOLA heightmap data to terrain
  useEffect(() => {
    if (!topoTexture.image || !terrainGeometry) return;

    const img = topoTexture.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = TERRAIN_CONFIG.widthSegments + 1;
    canvas.height = TERRAIN_CONFIG.heightSegments + 1;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const positions = terrainGeometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const vx = positions[i * 3];
      const vy = positions[i * 3 + 1];
      const distFromCenter = Math.sqrt(vx * vx + vy * vy);

      const pixelIndex = i * 4;
      const r = imageData.data[pixelIndex];
      const g = imageData.data[pixelIndex + 1];
      const b = imageData.data[pixelIndex + 2];
      const gray = (r + g + b) / 3 / 255;

      let height = (gray - 0.5) * 2 * TERRAIN_CONFIG.verticalScale;

      // Keep center flat for landing pad
      if (distFromCenter < TERRAIN_CONFIG.flatCenterRadius) {
        height = 0;
      } else if (distFromCenter < TERRAIN_CONFIG.flatCenterRadius * 2.5) {
        const blend = (distFromCenter - TERRAIN_CONFIG.flatCenterRadius) /
                      (TERRAIN_CONFIG.flatCenterRadius * 1.5);
        const smoothBlend = blend * blend * (3 - 2 * blend);
        height *= smoothBlend;
      }

      // Edge curl - terrain dips down at edges to hide boundaries
      const maxDist = TERRAIN_CONFIG.width / 2;
      if (distFromCenter > TERRAIN_CONFIG.edgeCurlStart) {
        const curlProgress = (distFromCenter - TERRAIN_CONFIG.edgeCurlStart) /
                            (maxDist - TERRAIN_CONFIG.edgeCurlStart);
        const smoothCurl = curlProgress * curlProgress; // Quadratic falloff
        height -= smoothCurl * TERRAIN_CONFIG.edgeCurlStrength;
      }

      positions[i * 3 + 2] = height;
    }

    terrainGeometry.attributes.position.needsUpdate = true;
    terrainGeometry.computeVertexNormals();
    console.log('Applied real MOLA Mars heightmap');
  }, [topoTexture, terrainGeometry]);

  return (
    <group>
      {/* Mars surface with real MOLA terrain */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        geometry={terrainGeometry}
        receiveShadow
      >
        <meshStandardMaterial
          map={marsColorMap}
          bumpMap={marsBumpMap}
          bumpScale={2}
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      {/* Landing pad area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} receiveShadow>
        <circleGeometry args={[45, 64]} />
        <meshStandardMaterial
          color="#8b5a3c"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Landing target markings */}
      <LandingTarget />

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
          <mesh key={angle} position={[Math.cos(rad) * 25, 0.6, Math.sin(rad) * 25]}>
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

function MarsAtmosphere() {

  return (
    <group>
      {/* Main sunlight - the Sun as seen from Mars */}
      <directionalLight
        position={[3000, 2000, 2000]}
        intensity={2.5}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={5000}
        shadow-camera-left={-1500}
        shadow-camera-right={1500}
        shadow-camera-top={1500}
        shadow-camera-bottom={-1500}
      />

      {/* Sun disc - smaller, more distant appearance from Mars */}
      <mesh position={[3000, 2000, 2000]}>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#fffef8" />
      </mesh>

      {/* Ambient light - brighter for rocket visibility */}
      <ambientLight intensity={0.6} color="#ffeedd" />

      {/* Fill light from opposite side to reduce harsh shadows on rocket */}
      <directionalLight
        position={[-1500, 800, -1000]}
        intensity={0.8}
        color="#ffddcc"
      />

      {/* Hemisphere light for atmosphere scatter */}
      <hemisphereLight color="#443322" groundColor="#8b4513" intensity={0.5} />

      {/* Sky background set via scene.background in App.tsx */}

    </group>
  );
}
