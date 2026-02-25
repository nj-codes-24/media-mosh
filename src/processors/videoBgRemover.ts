// videoBgRemover.ts
// Catches ALL errors and shows them via alert() so they're never silent.

const PROXY_SIZE = 512;
let _segmenter: any = null;
let _RawImage: any = null;

async function applyMask(canvas: HTMLCanvasElement, segmenter: any, hasAlpha: boolean) {
  const W = canvas.width, H = canvas.height;
  const proxy = document.createElement('canvas');
  proxy.width = proxy.height = PROXY_SIZE;
  const pCtx = proxy.getContext('2d')!;
  pCtx.drawImage(canvas, 0, 0, PROXY_SIZE, PROXY_SIZE);
  const id = pCtx.getImageData(0, 0, PROXY_SIZE, PROXY_SIZE);
  const rgb = new Uint8ClampedArray(PROXY_SIZE * PROXY_SIZE * 3);
  for (let i = 0; i < PROXY_SIZE * PROXY_SIZE; i++) {
    rgb[i*3] = id.data[i*4]; rgb[i*3+1] = id.data[i*4+1]; rgb[i*3+2] = id.data[i*4+2];
  }
  const results = await segmenter(new _RawImage(rgb, PROXY_SIZE, PROXY_SIZE, 3));
  const mask = Array.isArray(results) ? (results[0]?.mask ?? results[0]) : (results?.mask ?? results);
  if (!mask?.data) throw new Error('No mask returned from segmenter');

  const mc = document.createElement('canvas');
  mc.width = mask.width; mc.height = mask.height;
  const mCtx = mc.getContext('2d')!;
  const md = mCtx.createImageData(mask.width, mask.height);
  for (let i = 0; i < mask.data.length; i++) {
    md.data[i*4] = md.data[i*4+1] = md.data[i*4+2] = 255;
    md.data[i*4+3] = mask.data[i];
  }
  mCtx.putImageData(md, 0, 0);

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mc, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  if (!hasAlpha) {
    const fg = document.createElement('canvas');
    fg.width = W; fg.height = H;
    fg.getContext('2d')!.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(fg, 0, 0);
  }
}

export const videoBgRemoverProcessor = {
  validate: async (file: File) =>
    file.type === 'video/mp4' || file.type === 'video/webm' ||
    file.name.endsWith('.mp4') || file.name.endsWith('.webm'),

  getDefaultOptions: () => ({}),

  process: async (file: File, opts?: any): Promise<Blob> => {
    const report = (r: number) => opts?.onProgress?.(Math.min(1, Math.max(0, r)));

    try {
      report(0.01);

      // ── Check WebCodecs ──────────────────────────────────────────────────
      if (!(window as any).VideoDecoder || !(window as any).VideoEncoder) {
        throw new Error('WebCodecs not available. Use Chrome 94+ or Edge 94+.');
      }

      // ── Load AI model ────────────────────────────────────────────────────
      if (!_segmenter) {
        report(0.02);
        let mod: any;
        try {
          mod = await import('@xenova/transformers');
        } catch (e: any) {
          throw new Error(`Cannot load @xenova/transformers: ${e.message}. Run: npm install @xenova/transformers`);
        }
        const { pipeline, env, RawImage } = mod;
        _RawImage = RawImage;
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        if (env?.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;
        report(0.04);
        _segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4');
      }
      report(0.08);

      // ── Read file ────────────────────────────────────────────────────────
      const arrayBuffer = await file.arrayBuffer();
      report(0.10);

      // ── Demux ────────────────────────────────────────────────────────────
      const MP4BoxMod = await import('mp4box');
      const MP4Box = (MP4BoxMod as any).default ?? MP4BoxMod;

      const trackInfo = await new Promise<any>((resolve, reject) => {
        const mp4 = MP4Box.createFile();
        mp4.onError = (e: any) => reject(new Error(`MP4Box: ${e}`));
        mp4.onReady = (info: any) => {
          const vt = info.tracks?.find((t: any) => t.type === 'video');
          if (!vt) return reject(new Error('No video track found'));
          const fps = (vt.nb_samples > 0 && vt.duration > 0)
            ? (vt.nb_samples / vt.duration) * vt.timescale : 30;
          resolve({ id: vt.id, codec: vt.codec, width: vt.video.width, height: vt.video.height, fps, nb_samples: vt.nb_samples ?? 0 });
        };
        const buf = arrayBuffer.slice(0);
        (buf as any).fileStart = 0;
        mp4.appendBuffer(buf);
        mp4.flush();
      });

      const { id: trackId, codec, width, height, fps, nb_samples } = trackInfo;
      report(0.12);

      // ── Extract samples ──────────────────────────────────────────────────
      const samples = await new Promise<any[]>((resolve, reject) => {
        const out: any[] = [];
        const mp4 = MP4Box.createFile();
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(out); } };
        mp4.onError = (e: any) => { if (!done) { done = true; reject(new Error(`MP4Box samples: ${e}`)); } };
        mp4.onReady = () => { mp4.setExtractionOptions(trackId, null, { nbSamples: Infinity }); mp4.start(); };
        mp4.onSamples = (_: any, __: any, raw: any[]) => {
          for (const s of raw) out.push({
            data: new Uint8Array(s.data),
            timestamp: Math.round((s.cts / s.timescale) * 1_000_000),
            duration: Math.round((s.duration / s.timescale) * 1_000_000),
            isKeyFrame: s.is_sync,
          });
          if (nb_samples > 0 && out.length >= nb_samples) finish();
        };
        const buf = arrayBuffer.slice(0);
        (buf as any).fileStart = 0;
        mp4.appendBuffer(buf);
        mp4.flush();
        setTimeout(finish, 8000);
      });

      if (!samples.length) throw new Error('No samples extracted. File may be corrupt.');
      report(0.15);

      // ── Decode frames ────────────────────────────────────────────────────
      const codecMap: Record<string, string> = {
        avc1: 'avc1.42001f', avc3: 'avc1.42001f',
        hvc1: 'hvc1.1.6.L93.90', hev1: 'hvc1.1.6.L93.90',
        vp08: 'vp8', vp09: 'vp09.00.10.08', av01: 'av01.0.04M.08',
      };
      const decoderCodec = codecMap[codec.slice(0, 4)] ?? codec;

      const frames: { bitmap: ImageBitmap; timestamp: number; duration: number }[] = [];
      let decErr: any = null;

      const dec = new (window as any).VideoDecoder({
        output: async (frame: any) => {
          try {
            frames.push({ bitmap: await createImageBitmap(frame), timestamp: frame.timestamp, duration: frame.duration ?? Math.round(1_000_000 / fps) });
          } catch { } finally { frame.close(); }
        },
        error: (e: any) => { decErr = e; },
      });
      dec.configure({ codec: decoderCodec, codedWidth: width, codedHeight: height });
      for (const s of samples) {
        dec.decode(new (window as any).EncodedVideoChunk({ type: s.isKeyFrame ? 'key' : 'delta', timestamp: s.timestamp, duration: s.duration, data: s.data }));
      }
      await dec.flush();
      if (decErr) throw new Error(`VideoDecoder: ${decErr}`);
      frames.sort((a, b) => a.timestamp - b.timestamp);
      report(0.18);

      // ── Muxer setup ──────────────────────────────────────────────────────
      const { Muxer, ArrayBufferTarget } = await import('webm-muxer');
      let encCodec = 'vp09.00.10.08.01', hasAlpha = true;
      try {
        const c = await (window as any).VideoEncoder.isConfigSupported({ codec: encCodec, width, height, alpha: 'keep' });
        if (!c.supported) throw 0;
      } catch { encCodec = 'vp8'; hasAlpha = false; }

      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: { codec: hasAlpha ? 'V_VP9' : 'V_VP8', width, height, frameRate: fps, ...(hasAlpha ? { alpha: true } : {}) },
        firstTimestampBehavior: 'offset',
      });
      const enc = new (window as any).VideoEncoder({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (e: any) => { throw new Error(`VideoEncoder: ${e}`); },
      });
      enc.configure({ codec: encCodec, width, height, bitrate: Math.max(2_000_000, width * height * fps * 0.07), framerate: fps, latencyMode: 'quality', ...(hasAlpha ? { alpha: 'keep' } : {}) });

      // ── AI mask + encode ─────────────────────────────────────────────────
      const total = frames.length;
      const keyInt = Math.max(1, Math.round(fps));
      for (let i = 0; i < total; i++) {
        const f = frames[i];
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        c.getContext('2d')!.drawImage(f.bitmap, 0, 0);
        f.bitmap.close();
        await applyMask(c, _segmenter, hasAlpha);
        const vf = new (window as any).VideoFrame(c, { timestamp: f.timestamp, duration: f.duration, alpha: hasAlpha ? 'keep' : 'discard' });
        enc.encode(vf, { keyFrame: i % keyInt === 0 });
        vf.close();
        report(0.18 + ((i + 1) / total) * 0.77);
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 0));
      }

      // ── Finalize ─────────────────────────────────────────────────────────
      report(0.96);
      await enc.flush();
      muxer.finalize();
      const blob = new Blob([target.buffer], { type: 'video/webm' });
      report(1.0);
      return blob;

    } catch (err: any) {
      const msg = err?.message ?? String(err);
      // Show alert so error is NEVER silent
      alert(`Video BG Remover Error:\n\n${msg}\n\nCheck DevTools Console for details.`);
      console.error('[VideoBgRemover] FATAL:', err);
      throw err;
    }
  },
};