import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface FFmpegProgress {
  ratio: number;
  time: number;
}

export class FFmpegHelper {
  private static instance: FFmpegHelper;
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loading = false;

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
   * Initializes FFmpeg and binds the progress listener to the UI
   */
  async load(onProgress?: (progress: FFmpegProgress) => void): Promise<FFmpeg> {
    if (this.loading) {
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!this.ffmpeg) {
      this.ffmpeg = new FFmpeg();
    }

    // 🚀 FIXED: Cast to 'any' to allow .off() and refresh listeners
    (this.ffmpeg as any).off('progress'); 
    
    if (onProgress) {
      this.ffmpeg.on('progress', ({ progress, time }) => {
        onProgress({ ratio: progress, time });
      });
    }

    if (this.loaded) return this.ffmpeg;

    this.loading = true;
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this.loaded = true;
      return this.ffmpeg; 
    } catch (error) {
      throw new Error('Failed to initialize FFmpeg');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Compresses video with custom target size or quality slider
   */
  public async compressVideo(
    file: File, 
    options: { quality?: number; targetSize?: string; onProgress?: (p: FFmpegProgress) => void } = {}
  ): Promise<Blob> {
    const outputName = `output_${Date.now()}.mp4`;
    let args = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast'];

    if (options.targetSize && parseFloat(options.targetSize) > 0) {
      const targetMB = parseFloat(options.targetSize);
      const duration = 20; // Estimated duration for bitrate math
      const totalBitrateKbps = (targetMB * 8192) / duration; 
      const videoBitrate = Math.round(totalBitrateKbps - 128);
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
      return new Blob([data as any], { type: mimeType });
    } finally {
      await ff.deleteFile(inputName);
      await ff.deleteFile(outputFilename);
    }
  }
}

export const ffmpegHelper = FFmpegHelper.getInstance();