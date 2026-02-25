import { ToolProcessor, ProcessingOptions } from '@/lib/toolRegistry';

export const imageCompressorProcessor: ToolProcessor = {
  validate: async (file: File) => file.type.startsWith('image/'),
  getDefaultOptions: () => ({ quality: 0.6, format: 'image/jpeg' }),
  process: async (file: File, options?: ProcessingOptions): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob!), options?.format || 'image/jpeg', options?.quality || 0.6);
      };
    });
  }
};