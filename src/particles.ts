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
 * Uses a Web Worker to offload image decoding and processing off the main thread.
 */
export async function extractParticlesFromFile(file: File): Promise<ParticleData> {
  // Determine target particle count based on device profile
  let targetCount = 150000; // Desktop default
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory && deviceMemory < 4) {
    targetCount = 30000; // Low-memory default
  } else if (navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    targetCount = 75000; // Mobile default
  }

  // 1. Offload to Web Worker if supported (standard modern browsers)
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
    return new Promise<ParticleData>((resolve, reject) => {
      console.log(`[Particles] Initializing Web Worker for async decode/sampling. Target count: ${targetCount}`);
      console.time('[Particles] Web Worker Total Time');

      const worker = new Worker(new URL('./workers/pixel-worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e) => {
        console.timeEnd('[Particles] Web Worker Total Time');
        if (e.data.error) {
          worker.terminate();
          reject(new Error(e.data.error));
        } else {
          worker.terminate();
          resolve(e.data);
        }
      };

      worker.onerror = (err) => {
        console.timeEnd('[Particles] Web Worker Total Time');
        worker.terminate();
        reject(err);
      };

      worker.postMessage({ file, targetCount });
    });
  }

  // 2. Fallback to main-thread extraction if workers or OffscreenCanvas are not supported
  console.warn('[Particles] Web Workers or OffscreenCanvas not supported. Falling back to main thread extraction.');
  return extractParticlesFromFileFallback(file, targetCount);
}

/**
 * Fallback main-thread image parser if Web Workers / OffscreenCanvas are unavailable.
 */
async function extractParticlesFromFileFallback(file: File, targetCount: number): Promise<ParticleData> {
  const url = URL.createObjectURL(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image metadata'));
    };
    i.src = url;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;

  let tw = w;
  let th = h;
  const maxDim = 800;
  if (tw > maxDim || th > maxDim) {
    if (tw > th) {
      th = Math.round((th * maxDim) / tw);
      tw = maxDim;
    } else {
      tw = Math.round((tw * maxDim) / th);
      th = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Could not get 2D context');
  }

  // Modern browsers support Image.decode() to async decode before drawing
  try {
    if (typeof img.decode === 'function') {
      await img.decode();
    }
  } catch (e) {
    console.warn('[Particles] Main thread async decode failed, drawing anyway:', e);
  }

  ctx.drawImage(img, 0, 0, tw, th);
  URL.revokeObjectURL(url);

  const imgData = ctx.getImageData(0, 0, tw, th).data;
  return processPixelDataFallback(imgData, tw, th, targetCount);
}

/**
 * Fallback pixel sampling loop with cooperative yielding to avoid locking the UI.
 */
async function processPixelDataFallback(
  imgData: Uint8ClampedArray,
  w: number,
  h: number,
  targetCount: number
): Promise<ParticleData> {
  const totalPixels = w * h;
  const step = Math.max(1, Math.sqrt(totalPixels / targetCount));

  const maxParticles = Math.ceil(totalPixels / (step * step));
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const sizeJitters = new Float32Array(maxParticles);
  let count = 0;

  const aspectRatio = w / h;

  for (let y = 0; y < h; y += step) {
    if (Math.floor(y / step) % 50 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }

    for (let x = 0; x < w; x += step) {
      const px = Math.floor(x);
      const py = Math.floor(y);
      if (px >= w || py >= h) continue;

      const idx = (py * w + px) * 4;
      const a = imgData[idx + 3];
      if (a < 10) continue;

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
