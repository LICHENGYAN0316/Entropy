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
  const bitmap = await createImageBitmap(file, {
    resizeWidth: w,
    resizeHeight: h,
    resizeQuality: 'high',
  });

  try {
    const data = processBitmap(bitmap);
    bitmap.close();
    return data;
  } catch (e) {
    bitmap.close();
    throw e;
  }
}

function processBitmap(bitmap: ImageBitmap): ParticleData {
  const w = bitmap.width;
  const h = bitmap.height;

  // Determine target particle count
  let targetCount = 300000;

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    targetCount = 50000;
  } else if (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    targetCount = 150000;
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

  const positions: number[] = [];
  const colors: number[] = [];
  const sizeJitters: number[] = [];

  const aspectRatio = w / h;

  for (let y = 0; y < h; y += step) {
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

      positions.push(nx, ny, nz);
      colors.push(r, g, b);
      sizeJitters.push(Math.random());
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    sizeJitters: new Float32Array(sizeJitters),
    count: positions.length / 3,
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
