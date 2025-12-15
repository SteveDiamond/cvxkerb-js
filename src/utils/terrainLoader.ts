import * as THREE from 'three';

export interface TerrainConfig {
  width: number;
  height: number;
  widthSegments: number;
  heightSegments: number;
  verticalScale: number;
  flatCenterRadius: number;
}

// Simplex-like noise implementation for better terrain generation
// Based on improved Perlin noise algorithm
class SimplexNoise {
  private perm: number[] = [];
  private gradP: { x: number; y: number }[] = [];

  private grad3 = [
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  ];

  constructor(seed = 0) {
    this.seed(seed);
  }

  seed(seed: number) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle based on seed
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 16807) % 2147483647;
      const j = n % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }

    this.perm = [];
    this.gradP = [];
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.gradP[i] = this.grad3[this.perm[i] % 8];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const aa = this.perm[X] + Y;
    const ab = this.perm[X] + Y + 1;
    const ba = this.perm[X + 1] + Y;
    const bb = this.perm[X + 1] + Y + 1;

    const dot = (g: { x: number; y: number }, dx: number, dy: number) =>
      g.x * dx + g.y * dy;

    return this.lerp(
      this.lerp(
        dot(this.gradP[aa], x, y),
        dot(this.gradP[ba], x - 1, y),
        u
      ),
      this.lerp(
        dot(this.gradP[ab], x, y - 1),
        dot(this.gradP[bb], x - 1, y - 1),
        u
      ),
      v
    );
  }
}

// Fractional Brownian Motion for realistic terrain
export function fbm(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number,
  lacunarity: number,
  persistence: number
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise.noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

// Generate realistic Mars terrain using procedural noise
export function generateMarsTerrainData(
  config: TerrainConfig,
  seed = 42
): Float32Array {
  const { widthSegments, heightSegments, verticalScale, flatCenterRadius } = config;
  const noise = new SimplexNoise(seed);
  const data = new Float32Array((widthSegments + 1) * (heightSegments + 1));

  const scale = 0.002; // Base frequency scale

  for (let j = 0; j <= heightSegments; j++) {
    for (let i = 0; i <= widthSegments; i++) {
      const index = j * (widthSegments + 1) + i;

      // Map to world coordinates
      const x = (i / widthSegments - 0.5) * config.width;
      const y = (j / heightSegments - 0.5) * config.height;
      const distFromCenter = Math.sqrt(x * x + y * y);

      // Keep center flat for landing pad
      if (distFromCenter < flatCenterRadius) {
        data[index] = 0;
        continue;
      }

      // Multi-octave FBM for base terrain
      let height = fbm(noise, x * scale, y * scale, 6, 2.0, 0.5) * verticalScale;

      // Add larger scale features (mountains/valleys)
      height += fbm(noise, x * scale * 0.3, y * scale * 0.3, 4, 2.0, 0.6) * verticalScale * 1.5;

      // Add small detail noise
      height += fbm(noise, x * scale * 5, y * scale * 5, 3, 2.0, 0.4) * verticalScale * 0.1;

      // Generate realistic crater distribution using Poisson-like placement
      const craterNoise = noise.noise2D(x * 0.01, y * 0.01);
      if (craterNoise > 0.6) {
        // Crater-prone area
        const craterX = Math.floor(x / 100) * 100 + 50;
        const craterY = Math.floor(y / 100) * 100 + 50;
        const craterDist = Math.sqrt((x - craterX) ** 2 + (y - craterY) ** 2);
        const craterRadius = 30 + (craterNoise - 0.6) * 100;
        const craterDepth = craterRadius * 0.25;

        if (craterDist < craterRadius) {
          const t = craterDist / craterRadius;
          // Bowl shape
          height -= craterDepth * (1 - t * t) * 0.8;
        } else if (craterDist < craterRadius * 1.3) {
          // Raised rim
          const t = (craterDist - craterRadius) / (craterRadius * 0.3);
          height += craterDepth * 0.2 * Math.cos(t * Math.PI * 0.5);
        }
      }

      // Smooth transition from flat center
      if (distFromCenter < flatCenterRadius * 2.5) {
        const blend = Math.max(0, (distFromCenter - flatCenterRadius) / (flatCenterRadius * 1.5));
        height *= smoothstep(0, 1, blend);
      }

      data[index] = height;
    }
  }

  return data;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Load heightmap from image URL
export async function loadHeightmapFromImage(
  url: string,
  config: TerrainConfig
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        const image = texture.image as HTMLImageElement;
        const canvas = document.createElement('canvas');
        canvas.width = config.widthSegments + 1;
        canvas.height = config.heightSegments + 1;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = new Float32Array(canvas.width * canvas.height);

        for (let i = 0; i < data.length; i++) {
          // Use red channel (or average for grayscale)
          const r = imageData.data[i * 4];
          const g = imageData.data[i * 4 + 1];
          const b = imageData.data[i * 4 + 2];
          const gray = (r + g + b) / 3 / 255; // Normalize to 0-1

          // Map to height, keeping center flat
          const x = (i % canvas.width) / canvas.width - 0.5;
          const y = Math.floor(i / canvas.width) / canvas.height - 0.5;
          const distFromCenter = Math.sqrt(x * x + y * y) * config.width;

          if (distFromCenter < config.flatCenterRadius) {
            data[i] = 0;
          } else {
            const height = (gray - 0.5) * 2 * config.verticalScale;
            // Smooth transition from center
            const blend = Math.min(1, (distFromCenter - config.flatCenterRadius) / (config.flatCenterRadius * 1.5));
            data[i] = height * smoothstep(0, 1, blend);
          }
        }

        resolve(data);
      },
      undefined,
      (error) => reject(error)
    );
  });
}

// Apply heightmap data to a PlaneGeometry
export function applyHeightmapToGeometry(
  geometry: THREE.PlaneGeometry,
  heightData: Float32Array
): void {
  const positions = geometry.attributes.position.array as Float32Array;
  const vertexCount = positions.length / 3;

  if (heightData.length !== vertexCount) {
    console.warn(`Heightmap size (${heightData.length}) doesn't match geometry vertices (${vertexCount})`);
  }

  for (let i = 0; i < vertexCount; i++) {
    positions[i * 3 + 2] = heightData[i] || 0;
  }

  geometry.computeVertexNormals();
  geometry.attributes.position.needsUpdate = true;
}

// Export noise class for use elsewhere
export { SimplexNoise };
