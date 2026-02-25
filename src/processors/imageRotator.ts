import { ProcessingOptions, ToolProcessor } from '@/lib/toolRegistry';
import { CanvasHelper } from '@/lib/canvasHelper';
import { ffmpegHelper } from '@/lib/ffmpegHelper';
export const imageRotatorProcessor: ToolProcessor = {
  validate: async (file: File): Promise<boolean> => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  },

  getDefaultOptions: () => ({
    rotation: 0, // Degrees: 0, 90, 180, 270
    flipHorizontal: false,
    flipVertical: false,
    quality: 92,
    format: 'same' as const
  }),

  process: async (file: File, options?: ProcessingOptions): Promise<Blob> => {
    const {
      rotation = 0,
      flipHorizontal = false,
      flipVertical = false,
      quality = 92,
      format = 'same'
    } = options || {};

    let result = file;

    // Apply rotation if specified
    if (rotation !== 0) {
      result = new File(
        [await CanvasHelper.rotateImage(result, rotation)],
        file.name,
        { type: file.type }
      );
    }

    // Apply horizontal flip
    if (flipHorizontal) {
      result = new File(
        [await CanvasHelper.flipImage(result, 'horizontal')],
        file.name,
        { type: file.type }
      );
    }

    // Apply vertical flip
    if (flipVertical) {
      result = new File(
        [await CanvasHelper.flipImage(result, 'vertical')],
        file.name,
        { type: file.type }
      );
    }

    // Handle format conversion
    let outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
    if (format === 'same') {
      outputFormat = file.type as any;
    } else if (format === 'jpeg') {
      outputFormat = 'image/jpeg';
    } else if (format === 'png') {
      outputFormat = 'image/png';
    } else {
      outputFormat = 'image/webp';
    }

    // Convert format if needed
    if (outputFormat !== file.type) {
      const img = await CanvasHelper.loadImage(result);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
          outputFormat,
          quality / 100
        );
      });
    }

    return result;
  }
};