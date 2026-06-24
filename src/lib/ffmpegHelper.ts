import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

export interface FFmpegProgress {
  ratio: number;
  time: number;
}

export class FFmpegHelper {
  private static instance: FFmpegHelper;
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  /** Promise-based mutex — replaces the spin-wait anti-pattern. */
  private loadingPromise: Promise<FFmpeg> | null = null;

  private constructor() {}

  /**
   * Singleton pattern to ensure only one engine instance exists
   */
  static getInstance(): FFmpegHelper {
    if (!FFmpegHelper.instance) {
      FFmpegHelper.instance = new FFmpegHelper();
    }
    return FFmpegHelper.instance;
  }

  /**
   * Initializes FFmpeg and binds the progress listener to the UI.
   * Uses a promise-based mutex to avoid the spin-wait race condition.
   */
  async load(onProgress?: (progress: FFmpegProgress) => void): Promise<FFmpeg> {
    // If another caller is already loading, wait on the same promise
    if (this.loadingPromise) {
      await this.loadingPromise;
    }

    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
    }

    // Refresh the progress listener for the current caller
    (this.ffmpeg as any).off('progress'); 
    
    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress, time }) => {
        onProgress({ ratio: progress, time });
      });
    }

    if (this.loaded) return this.ffmpeg;

    // Create a single promise that all concurrent callers will await
    this.loadingPromise = (async (): Promise<FFmpeg> => {
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await this.ffmpeg!.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        this.loaded = true;
        return this.ffmpeg!; 
      } catch (error) {
        // Reset so future callers can retry
        this.loaded = false;
        throw new Error('Failed to initialize FFmpeg. Check your network connection.');
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /**
   * Probes video duration by decoding just the metadata.
   * Falls back to a conservative estimate if probing fails.
   */
  private async probeDuration(file: File): Promise<number> {
    const DEFAULT_DURATION = 20;
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;

      const duration = await new Promise<number>((resolve) => {
        const timeout = setTimeout(() => resolve(DEFAULT_DURATION), 5000);
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          resolve(isFinite(video.duration) && video.duration > 0 ? video.duration : DEFAULT_DURATION);
        };
        video.onerror = () => {
          clearTimeout(timeout);
          resolve(DEFAULT_DURATION);
        };
        video.src = url;
      });

      URL.revokeObjectURL(url);
      return duration;
    } catch {
      return DEFAULT_DURATION;
    }
  }

  /**
   * Compresses video with custom target size or quality slider.
   * When a target size is specified, the actual video duration is probed
   * to compute an accurate bitrate (instead of assuming 20 seconds).
   */
  public async compressVideo(
    file: File, 
    options: { quality?: number; targetSize?: string; onProgress?: (p: FFmpegProgress) => void } = {}
  ): Promise<Blob> {
    const outputName = `output_${Date.now()}.mp4`;
    const args = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast'];

    if (options.targetSize && parseFloat(options.targetSize) > 0) {
      const targetMB = parseFloat(options.targetSize);
      const duration = await this.probeDuration(file);
      const AUDIO_BITRATE_KBPS = 128;
      const BITS_PER_BYTE = 8;
      const KB_PER_MB = 1024;
      const totalBitrateKbps = (targetMB * KB_PER_MB * BITS_PER_BYTE) / duration; 
      const videoBitrate = Math.max(100, Math.round(totalBitrateKbps - AUDIO_BITRATE_KBPS));
      args.push('-b:v', `${videoBitrate}k`, '-maxrate', `${videoBitrate}k`, '-bufsize', `${videoBitrate * 2}k`);
    } else {
      const quality = options.quality || 25;
      const crf = Math.round(51 - (quality * 0.51));
      args.push('-crf', crf.toString());
    }

    args.push('-c:a', 'aac', '-b:a', '128k', outputName);
    return this.processFile(file, outputName, args, options.onProgress);
  }

  /**
   * Extracts audio tracks and reports real-time progress
   */
  public async extractAudio(
    file: File, 
    format: 'mp3' | 'wav' | 'ogg' = 'mp3',
    onProgress?: (p: FFmpegProgress) => void
  ): Promise<Blob> {
    const outputName = `audio_${Date.now()}.${format}`;
    const args = ['-vn', '-c:a', format === 'mp3' ? 'libmp3lame' : 'pcm_s16le', '-b:a', '192k', outputName];
    return this.processFile(file, outputName, args, onProgress);
  }

  /**
   * Core execution handler for file I/O and FFmpeg commands
   */
  private async processFile(
    inputFile: File,
    outputFilename: string,
    ffmpegArgs: string[],
    onProgress?: (p: FFmpegProgress) => void
  ): Promise<Blob> {
    const ff = await this.load(onProgress);
    const inputName = 'input';
    try {
      await ff.writeFile(inputName, new Uint8Array(await inputFile.arrayBuffer()));
      await ff.exec(['-i', inputName, ...ffmpegArgs]);
      const data = await ff.readFile(outputFilename);
      
      const mimeType = outputFilename.endsWith('mp4') ? 'video/mp4' : 'audio/mpeg';
      return new Blob([data as Uint8Array], { type: mimeType });
    } finally {
      try { await ff.deleteFile(inputName); } catch { /* may not exist */ }
      try { await ff.deleteFile(outputFilename); } catch { /* may not exist */ }
    }
  }
}

export const ffmpegHelper = FFmpegHelper.getInstance();