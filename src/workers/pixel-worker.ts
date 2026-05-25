// Web Worker for asynchronous image decoding and pixel extraction

export interface WorkerInput {
  file: File | Blob;
  targetCount: number;
}

export interface WorkerOutput {
  positions: Float32Array;
  colors: Float32Array;
  sizeJitters: Float32Array;
  count: number;
  aspectRatio: number;
}

self.onmessage = async (e: MessageEvent<WorkerInput>) => {
  const { file, targetCount } = e.data;

  try {
    // 1. Get original dimensions
    const tempBitmap = await createImageBitmap(file);
    const w = tempBitmap.width;
    const h = tempBitmap.height;
    tempBitmap.close();

    // 2. Compute downscaled dimensions (max longest edge is 800px)
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

    // 3. Create final downscaled ImageBitmap on worker thread
    const bitmap = await createImageBitmap(file, {
      resizeWidth: tw,
      resizeHeight: th,
      resizeQuality: 'medium',
    });

    // 4. Draw to OffscreenCanvas to extract pixel data
    const canvas = new OffscreenCanvas(tw, th);
    const ctxCanvas = canvas.getContext('2d');
    if (!ctxCanvas) {
      throw new Error('Failed to get 2D context in OffscreenCanvas');
    }
    ctxCanvas.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();

    const imgData = ctxCanvas.getImageData(0, 0, tw, th).data;

    // 5. Sampling loop (runs synchronously on worker thread)
    const totalPixels = tw * th;
    const step = Math.max(1, Math.sqrt(totalPixels / targetCount));

    const maxParticles = Math.ceil(totalPixels / (step * step));
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizeJitters = new Float32Array(maxParticles);
    let count = 0;

    const aspectRatio = tw / th;

    for (let y = 0; y < th; y += step) {
      for (let x = 0; x < tw; x += step) {
        const px = Math.floor(x);
        const py = Math.floor(y);
        if (px >= tw || py >= th) continue;

        const idx = (py * tw + px) * 4;
        const a = imgData[idx + 3];
        if (a < 10) continue; // skip transparent

        const r = imgData[idx] / 255;
        const g = imgData[idx + 1] / 255;
        const b = imgData[idx + 2] / 255;

        const nx = (x / tw - 0.5) * aspectRatio;
        const ny = 0.5 - y / th;
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

    const slicedPositions = positions.slice(0, count * 3);
    const slicedColors = colors.slice(0, count * 3);
    const slicedJitters = sizeJitters.slice(0, count);

    // 6. Post back transferable results
    const output: WorkerOutput = {
      positions: slicedPositions,
      colors: slicedColors,
      sizeJitters: slicedJitters,
      count,
      aspectRatio,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).postMessage(output, [
      slicedPositions.buffer,
      slicedColors.buffer,
      slicedJitters.buffer,
    ]);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Worker error';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).postMessage({ error: errMsg });
  }
};
