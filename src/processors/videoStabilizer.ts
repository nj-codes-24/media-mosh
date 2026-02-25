'use client';

/**
 * GOD-TIER VIDEO STABILIZER — Pure Client-Side
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgrades:
 * - Grid-bucketed Shi-Tomasi (Forces background tracking)
 * - RANSAC Similarity Transform (X, Y, Rotation, Scale) 
 * - Adaptive Auto-Zoom (Computes the exact zoom needed to hide black borders)
 * - Edge-padded Gaussian smoothing (Prevents start/stop snapping)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ANALYSIS_WIDTH  = 480; 
const LK_WIN_HALF     = 10;  
const LK_MAX_ITER     = 30;  
const LK_EPS          = 0.03; 
const MIN_CORNERS     = 30;  
const REFRESH_EVERY   = 10;  
const BITRATE         = 10_000_000;

type Pt = { x: number; y: number };
type Transform = { dx: number; dy: number; da: number; ds: number }; // + Scale for drones

// ─── Image helpers ────────────────────────────────────────────────────────────

const toGray = (rgba: Uint8ClampedArray): Float32Array => {
  const n = rgba.length >> 2;
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++)
    g[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  return g;
};

const bilinear = (img: Float32Array, w: number, h: number, x: number, y: number): number => {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  if (x0 < 0 || y0 < 0 || x0 + 1 >= w || y0 + 1 >= h) return 0;
  const fx = x - x0, fy = y - y0;
  return (
    img[y0 * w + x0] * (1 - fx) * (1 - fy) +
    img[y0 * w + x0 + 1] * fx  * (1 - fy) +
    img[(y0 + 1) * w + x0] * (1 - fx) * fy  +
    img[(y0 + 1) * w + x0 + 1] * fx  * fy
  );
};

// ─── Grid-Bucketed Shi-Tomasi ─────────────────────────────────────────────────
// Guarantees points are spread evenly across the frame, ignoring massive foregrounds

const detectCorners = (gray: Float32Array, w: number, h: number, maxPerCell = 15): Pt[] => {
  const response = new Float32Array(w * h);
  const ws = 3; 

  for (let y = ws + 1; y < h - ws - 1; y++) {
    for (let x = ws + 1; x < w - ws - 1; x++) {
      let Ixx = 0, Iyy = 0, Ixy = 0;
      for (let dy = -ws; dy <= ws; dy++) {
        for (let dx = -ws; dx <= ws; dx++) {
          const i  = (y + dy) * w + (x + dx);
          const ix = (gray[i + 1] - gray[i - 1]) * 0.5;
          const iy = (gray[i + w] - gray[i - w]) * 0.5;
          Ixx += ix * ix; Iyy += iy * iy; Ixy += ix * iy;
        }
      }
      const tr = Ixx + Iyy;
      const dt = Ixx * Iyy - Ixy * Ixy;
      response[y * w + x] = tr * 0.5 - Math.sqrt(Math.max(0, tr * tr * 0.25 - dt));
    }
  }

  const nms = 10;
  const gridW = w / 4; const gridH = h / 4;
  const grid: { x: number; y: number; r: number }[][] = Array.from({length: 16}, () => []);

  for (let y = nms; y < h - nms; y++) {
    for (let x = nms; x < w - nms; x++) {
      const r = response[y * w + x];
      if (r < 80) continue;
      let isMax = true;
      outer: for (let dy = -nms; dy <= nms; dy++) {
        for (let dx = -nms; dx <= nms; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (response[(y + dy) * w + (x + dx)] >= r) { isMax = false; break outer; }
        }
      }
      if (isMax) {
        const cell = Math.floor(y / gridH) * 4 + Math.floor(x / gridW);
        if (cell >= 0 && cell < 16) grid[cell].push({ x, y, r });
      }
    }
  }

  const pts: Pt[] = [];
  for (const cell of grid) {
    cell.sort((a, b) => b.r - a.r);
    for (let i = 0; i < Math.min(cell.length, maxPerCell); i++) pts.push({ x: cell[i].x, y: cell[i].y });
  }
  return pts;
};

// ─── Lucas-Kanade ─────────────────────────────────────────────────────────────

const lkTrack = (prev: Float32Array, curr: Float32Array, w: number, h: number, p: Pt): { pt: Pt; ok: boolean } => {
  let fx = p.x, fy = p.y;
  const hw = LK_WIN_HALF;
  for (let iter = 0; iter < LK_MAX_ITER; iter++) {
    let Ixx = 0, Iyy = 0, Ixy = 0, Ixt = 0, Iyt = 0;
    for (let dy = -hw; dy <= hw; dy++) {
      for (let dx = -hw; dx <= hw; dx++) {
        const sx = p.x + dx, sy = p.y + dy;
        const tx = fx + dx, ty = fy + dy;
        if (sx < 1 || sx >= w - 1 || sy < 1 || sy >= h - 1 || tx < 1 || tx >= w - 1 || ty < 1 || ty >= h - 1) continue;

        const ix = (bilinear(prev, w, h, sx + 1, sy) - bilinear(prev, w, h, sx - 1, sy)) * 0.5;
        const iy = (bilinear(prev, w, h, sx, sy + 1) - bilinear(prev, w, h, sx, sy - 1)) * 0.5;
        const it =  bilinear(curr, w, h, tx, ty)     - bilinear(prev, w, h, sx, sy);

        Ixx += ix * ix; Iyy += iy * iy; Ixy += ix * iy;
        Ixt += ix * it; Iyt += iy * it;
      }
    }
    const det = Ixx * Iyy - Ixy * Ixy;
    if (Math.abs(det) < 1e-7) break;

    const vx = -(Iyy * Ixt - Ixy * Iyt) / det;
    const vy = -(Ixx * Iyt - Ixy * Ixt) / det;
    fx += vx; fy += vy;

    if (vx * vx + vy * vy < LK_EPS * LK_EPS) break;
  }
  const ok = fx > 1 && fy > 1 && fx < w - 2 && fy < h - 2 && Math.abs(bilinear(prev, w, h, p.x, p.y) - bilinear(curr, w, h, fx, fy)) < 60;
  return { pt: { x: fx, y: fy }, ok };
};

// ─── TRUE RANSAC Similarity Transform ─────────────────────────────────────────

const estimateTransformRANSAC = (from: Pt[], to: Pt[]): Transform => {
  const n = from.length;
  if (n < 2) return { dx: 0, dy: 0, da: 0, ds: 1 };

  let bestInliers = 0;
  let bestModel = { dx: 0, dy: 0, da: 0, ds: 1 };
  const RANSAC_ITERS = 100;
  const INLIER_THRESH = 2.0; // pixels

  for (let iter = 0; iter < RANSAC_ITERS; iter++) {
    // 1. Pick 2 random distinct points
    const i1 = Math.floor(Math.random() * n);
    let i2 = Math.floor(Math.random() * n);
    while (i1 === i2) i2 = Math.floor(Math.random() * n);

    const p1 = from[i1], p2 = from[i2];
    const q1 = to[i1], q2 = to[i2];

    // 2. Compute Transform Model (Scale, Rotation, Translation)
    const dxF = p2.x - p1.x, dyF = p2.y - p1.y;
    const dxT = q2.x - q1.x, dyT = q2.y - q1.y;
    
    const distF = Math.sqrt(dxF * dxF + dyF * dyF);
    const distT = Math.sqrt(dxT * dxT + dyT * dyT);
    if (distF < 5) continue; // Points too close to establish scale/rotation

    let ds = distT / distF;
    ds = Math.max(0.9, Math.min(1.1, ds)); // Cap scale to prevent wild distortion
    
    const da = Math.atan2(dyT, dxT) - Math.atan2(dyF, dxF);
    
    // Translation (based on scaled and rotated p1 mapped to q1)
    const cosA = Math.cos(da), sinA = Math.sin(da);
    const dx = q1.x - (p1.x * cosA - p1.y * sinA) * ds;
    const dy = q1.y - (p1.x * sinA + p1.y * cosA) * ds;

    // 3. Count inliers
    let inliers = 0;
    for (let i = 0; i < n; i++) {
      const predX = (from[i].x * cosA - from[i].y * sinA) * ds + dx;
      const predY = (from[i].x * sinA + from[i].y * cosA) * ds + dy;
      const err = Math.sqrt((predX - to[i].x) ** 2 + (predY - to[i].y) ** 2);
      if (err < INLIER_THRESH) inliers++;
    }

    // 4. Update best
    if (inliers > bestInliers) {
      bestInliers = inliers;
      bestModel = { dx, dy, da, ds };
    }
  }

  // Final refinement: Calculate purely on inliers could go here, but for JS performance 
  // and the nature of high-FPS video, the raw RANSAC winner is highly accurate.
  
  // Convert Transform back to center-relative for easy canvas manipulation later
  // We want to return translation relative to center, not origin (0,0)
  return bestModel; 
};

// ─── Edge-Padded Gaussian smoothing ───────────────────────────────────────────

const gaussSmooth = (arr: Float32Array, sigma: number): Float32Array => {
  const r   = Math.ceil(sigma * 3) | 0;
  const ker = new Float32Array(2 * r + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) { ker[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += ker[i + r]; }
  for (let i = 0; i < ker.length; i++) ker[i] /= sum;

  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let v = 0;
    for (let j = -r; j <= r; j++) {
      // Pad edges instead of zero-falling
      const idx = Math.max(0, Math.min(arr.length - 1, i + j));
      v += arr[idx] * ker[j + r];
    }
    out[i] = v;
  }
  return out;
};

// ─── Video element helpers ────────────────────────────────────────────────────

const makeVideo = (src: string): Promise<HTMLVideoElement> =>
  new Promise((res, rej) => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
    v.onloadedmetadata = () => res(v);
    v.onerror = () => rej(new Error('Failed to load video'));
    v.src = src;
  });

const seekTo = (v: HTMLVideoElement, t: number): Promise<void> =>
  new Promise((res, rej) => {
    if (Math.abs(v.currentTime - t) < 0.001) { res(); return; }
    const onSeeked = () => { v.removeEventListener('seeked', onSeeked); res(); };
    const onErr    = () => { v.removeEventListener('error',  onErr);    rej(new Error('Seek failed')); };
    v.addEventListener('seeked', onSeeked, { once: true });
    v.addEventListener('error',  onErr,    { once: true });
    v.currentTime = t;
  });

// ─── Main processor ───────────────────────────────────────────────────────────

export const videoStabilizer = {
  process: async (file: File, options: { onProgress?: (v: number) => void; strength?: number } = {}): Promise<Blob> => {
    const prog     = options.onProgress ?? (() => {});
    const strength = Math.max(0, Math.min(1, options.strength ?? 0.85));
    const sigma    = 10 + strength * 60; 

    const blobUrl = URL.createObjectURL(file);

    try {
      prog(0.01);
      const probe = await makeVideo(blobUrl);
      const dur = probe.duration;
      const nW = probe.videoWidth;
      const nH = probe.videoHeight;
      if (!isFinite(dur) || dur <= 0 || !nW || !nH) throw new Error('Invalid video');

      const estFps = 30;
      const maxAnalysisFrames = 1800;
      const nFrames  = Math.min(Math.ceil(dur * estFps), maxAnalysisFrames);
      const timeStep = dur / nFrames;
      probe.src = '';

      const aW = ANALYSIS_WIDTH;
      const aH = Math.round(nH * (aW / nW));

      prog(0.03);
      const aCv = document.createElement('canvas');
      aCv.width = aW; aCv.height = aH;
      const aCtx = aCv.getContext('2d', { willReadFrequently: true })!;
      const vidA = await makeVideo(blobUrl);

      const transforms: Transform[] = [];
      let prevGray: Float32Array | null = null;
      let prevPts:  Pt[] = [];

      // ─── PASS 1: Motion Tracking ───
      for (let i = 0; i < nFrames; i++) {
        await seekTo(vidA, Math.min(i * timeStep, dur - 0.001));
        aCtx.drawImage(vidA, 0, 0, aW, aH);
        const gray = toGray(aCtx.getImageData(0, 0, aW, aH).data);

        if (i > 0 && prevGray && prevPts.length > 0) {
          const goodFrom: Pt[] = [];
          const goodTo:   Pt[] = [];
          const nextPts:  Pt[] = [];

          for (const pt of prevPts) {
            const { pt: tp, ok } = lkTrack(prevGray, gray, aW, aH, pt);
            if (ok) { goodFrom.push(pt); goodTo.push(tp); nextPts.push(tp); }
          }

          // Use center-relative transform estimation so zooming and rotation pivot correctly
          const cx = aW/2, cy = aH/2;
          const centeredFrom = goodFrom.map(p => ({ x: p.x - cx, y: p.y - cy }));
          const centeredTo   = goodTo.map(p => ({ x: p.x - cx, y: p.y - cy }));
          
          transforms.push(estimateTransformRANSAC(centeredFrom, centeredTo));

          if (nextPts.length < MIN_CORNERS || i % REFRESH_EVERY === 0) prevPts = detectCorners(gray, aW, aH);
          else prevPts = nextPts;
        } else {
          prevPts = detectCorners(gray, aW, aH);
        }

        prevGray = gray;
        prog(0.03 + 0.37 * (i / nFrames));
      }
      vidA.src = ''; aCtx.clearRect(0, 0, aW, aH);

      // ─── TRAJECTORY & SMOOTHING ───
      prog(0.41);
      const N = transforms.length;
      const rawX = new Float32Array(nFrames); const rawY = new Float32Array(nFrames);
      const rawA = new Float32Array(nFrames); const rawS = new Float32Array(nFrames);
      rawS[0] = 1.0; 
      
      for (let i = 0; i < N; i++) {
        rawX[i + 1] = rawX[i] + transforms[i].dx;
        rawY[i + 1] = rawY[i] + transforms[i].dy;
        rawA[i + 1] = rawA[i] + transforms[i].da;
        rawS[i + 1] = rawS[i] * transforms[i].ds; // Scale multiplies 
      }

      const smoothX = gaussSmooth(rawX, sigma); const smoothY = gaussSmooth(rawY, sigma);
      const smoothA = gaussSmooth(rawA, sigma); const smoothS = gaussSmooth(rawS, sigma);

      const corrX = new Float32Array(nFrames); const corrY = new Float32Array(nFrames);
      const corrA = new Float32Array(nFrames); const corrS = new Float32Array(nFrames);
      for (let i = 0; i < nFrames; i++) {
        corrX[i] = smoothX[i] - rawX[i];
        corrY[i] = smoothY[i] - rawY[i];
        corrA[i] = smoothA[i] - rawA[i];
        corrS[i] = smoothS[i] / (rawS[i] || 1);
      }

      // ─── ADAPTIVE AUTO-ZOOM CALCULATION ───
      // Calculate exactly how much the canvas is exposed at the corners
      let maxRequiredZoom = 1.0;
      const w2 = aW / 2, h2 = aH / 2;
      const corners = [ {x: -w2, y: -h2}, {x: w2, y: -h2}, {x: w2, y: h2}, {x: -w2, y: h2} ];

      for (let i = 0; i < nFrames; i++) {
        const cos = Math.cos(corrA[i]), sin = Math.sin(corrA[i]);
        let maxInsetX = 0, maxInsetY = 0;
        
        for (const c of corners) {
          // Transform corner bounds backwards to see where the camera frame moved
          const tx = (c.x * cos - c.y * sin) * corrS[i] + corrX[i];
          const ty = (c.x * sin + c.y * cos) * corrS[i] + corrY[i];
          
          // How far inside the frame did the corner pull?
          maxInsetX = Math.max(maxInsetX, Math.abs(c.x) - Math.abs(tx));
          maxInsetY = Math.max(maxInsetY, Math.abs(c.y) - Math.abs(ty));
        }
        
        const requiredZoomX = aW / (aW - maxInsetX * 2);
        const requiredZoomY = aH / (aH - maxInsetY * 2);
        maxRequiredZoom = Math.max(maxRequiredZoom, requiredZoomX, requiredZoomY);
      }
      
      // Add a tiny 1% safety buffer
      const finalAdaptiveZoom = Math.min(maxRequiredZoom * 1.01, 1.5); // Cap at 1.5x zoom so we don't pixelate to hell

      prog(0.44);

      // ─── PASS 2: Render & Encode ───
      const outCv = document.createElement('canvas');
      outCv.width = nW; outCv.height = nH;
      const outCtx = outCv.getContext('2d')!;
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
        .find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

      const stream = (outCv as any).captureStream(estFps) as MediaStream;
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: BITRATE });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      const vidR = await makeVideo(blobUrl);
      const frameDurMs = (timeStep * 1000); 
      const cx = nW / 2, cy = nH / 2;
      const scaleF = nW / aW;

      for (let i = 0; i < nFrames; i++) {
        await seekTo(vidR, Math.min(i * timeStep, dur - 0.001));

        outCtx.save();
        outCtx.clearRect(0, 0, nW, nH);
        
        outCtx.translate(cx + corrX[i] * scaleF, cy + corrY[i] * scaleF);
        outCtx.rotate(corrA[i]);
        outCtx.scale(finalAdaptiveZoom * corrS[i], finalAdaptiveZoom * corrS[i]);
        outCtx.drawImage(vidR, -cx, -cy, nW, nH);
        
        outCtx.restore();
        await new Promise<void>(r => setTimeout(r, frameDurMs));
        prog(0.44 + 0.54 * (i / nFrames));
      }

      recorder.stop();
      vidR.src = '';
      await new Promise<void>(r => { recorder.onstop = () => r(); });

      prog(1.0);
      const result = new Blob(chunks, { type: mime });
      URL.revokeObjectURL(blobUrl);
      return result;

    } catch (err) {
      URL.revokeObjectURL(blobUrl);
      throw err;
    }
  },
};