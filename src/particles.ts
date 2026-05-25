import * as THREE from 'three';

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  sizeJitters: Float32Array;
  count: number;
  aspectRatio: number;
}

/**
 * Parses the uploaded image file, applies adaptive sampling and downscaling,
 * and extracts the pixel coordinate and color information.
 */
export async function extractParticlesFromFile(file: File): Promise<ParticleData> {
  // 1. Create a temporary bitmap to read dimensions off the main thread
  const tempBitmap = await createImageBitmap(file);
  const origW = tempBitmap.width;
  const origH = tempBitmap.height;
  tempBitmap.close();

  // 2. Compute downscaled dimensions (max longest edge is 1200px)
  let w = origW;
  let h = origH;
  const maxDim = 1200;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  // 3. Create the final downscaled ImageBitmap off the main thread
  // Use 'medium' resize quality to avoid high-overhead Lanczos filtering in Chrome/Edge
  const bitmap = await createImageBitmap(file, {
    resizeWidth: w,
    resizeHeight: h,
    resizeQuality: 'medium',
  });

  try {
    const data = await processBitmap(bitmap);
    bitmap.close();
    return data;
  } catch (e) {
    bitmap.close();
    throw e;
  }
}

async function processBitmap(bitmap: ImageBitmap): Promise<ParticleData> {
  const w = bitmap.width;
  const h = bitmap.height;

  // Determine target particle count (reduced threshold defaults for performance)
  let targetCount = 150000; // Desktop default (was 300,000)

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    targetCount = 30000; // Low-memory default (was 50,000)
  } else if (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    targetCount = 75000; // Mobile default (was 150,000)
  }

  // Create offscreen canvas for sampling
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  // Draw bitmap to canvas
  ctx.drawImage(bitmap, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h).data;

  // Grid sampling calculation
  const totalPixels = w * h;
  const step = Math.max(1, Math.sqrt(totalPixels / targetCount));

  // Pre-allocate typed arrays to eliminate dynamic JS array resize and copy overhead
  const maxParticles = Math.ceil(totalPixels / (step * step));
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const sizeJitters = new Float32Array(maxParticles);
  let count = 0;

  const aspectRatio = w / h;

  for (let y = 0; y < h; y += step) {
    // Chunked async sampling: yield control to the browser's main thread every 50 rows
    // to keep the UI completely responsive.
    if (Math.floor(y / step) % 50 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    for (let x = 0; x < w; x += step) {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px >= w || py >= h) continue;

      const idx = (py * w + px) * 4;
      const a = imgData[idx + 3];
      if (a < 10) continue; // skip transparent pixels

      const r = imgData[idx] / 255;
      const g = imgData[idx + 1] / 255;
      const b = imgData[idx + 2] / 255;

      const nx = (x / w - 0.5) * aspectRatio;
      const ny = 0.5 - y / h;
      const nz = (Math.random() - 0.5) * 0.05;

      positions[count * 3] = nx;
      positions[count * 3 + 1] = ny;
      positions[count * 3 + 2] = nz;

      colors[count * 3] = r;
      colors[count * 3 + 1] = g;
      colors[count * 3 + 2] = b;

      sizeJitters[count] = Math.random();

      count++;
    }
  }

  // Slice buffers to actual sampled particle count
  return {
    positions: positions.slice(0, count * 3),
    colors: colors.slice(0, count * 3),
    sizeJitters: sizeJitters.slice(0, count),
    count,
    aspectRatio,
  };
}

/**
 * Manages Three.js particle geometry representation.
 */
export class ParticleSystem {
  private geometry: THREE.BufferGeometry | null = null;

  constructor() {}

  createGeometry(data: ParticleData): THREE.BufferGeometry {
    if (this.geometry) {
      this.geometry.dispose();
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(data.colors, 3));
    this.geometry.setAttribute('sizeJitter', new THREE.BufferAttribute(data.sizeJitters, 1));

    return this.geometry;
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
  }
}
