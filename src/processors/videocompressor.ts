import { ffmpegHelper } from '@/lib/ffmpegHelper';

export const videoCompressorProcessor = {
  validate: async (file: File) => file.type.startsWith('video/'),
  getDefaultOptions: () => ({ quality: 25, targetSize: '' }),
  process: async (file: File, options?: any): Promise<Blob> => {
    return await ffmpegHelper.compressVideo(file, {
      quality: Number(options?.quality) || 25,
      targetSize: options?.targetSize?.toString(),
      onProgress: options?.onProgress // 🚀 Bridge the callback to the engine
    });
  }
};