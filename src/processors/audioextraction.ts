import { ToolProcessor, ProcessingOptions } from '@/lib/toolRegistry';
import { ffmpegHelper } from '@/lib/ffmpegHelper';

export const audioExtractionProcessor: ToolProcessor = {
  validate: async (file: File) => file.type.startsWith('video/'),
  getDefaultOptions: () => ({ format: 'mp3' }),
  process: async (file: File, options?: ProcessingOptions): Promise<Blob> => {
    const format = (options?.format as 'mp3' | 'wav' | 'ogg') || 'mp3';
    
    // 🚀 FIXED: Passes onProgress to the helper
    return await ffmpegHelper.extractAudio(file, format, options?.onProgress);
  }
};