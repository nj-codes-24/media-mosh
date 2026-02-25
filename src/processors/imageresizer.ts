import { ProcessingOptions, ToolProcessor } from '@/lib/toolRegistry';
import { CanvasHelper } from '@/lib/canvasHelper';
import { ffmpegHelper } from '@/lib/ffmpegHelper';
export const imageResizerProcessor: ToolProcessor = {
  validate: async (file: File): Promise<boolean> => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  },

  getDefaultOptions: () => ({
    width: 1920,
    height: 1080,
    fit: 'contain' as const, // 'contain' | 'cover' | 'fill'
    maintainAspectRatio: true,
    quality: 92,
    format: 'same' as const // 'same' | 'jpeg' | 'png' | 'webp'
  }),

  process: async (file: File, options?: ProcessingOptions): Promise<Blob> => {
    const {
      width = 1920,
      height = 1080,
      fit = 'contain',
      maintainAspectRatio = true,
      quality = 92,
      format = 'same'
    } = options || {};

    // Determine output format
    let outputFormat: 'image/jpeg' | 'image/png' | 'image/webp';
    if (format === 'same') {
      outputFormat = file.type as 'image/jpeg' | 'image/png' | 'image/webp';
    } else if (format === 'jpeg') {
      outputFormat = 'image/jpeg';
    } else if (format === 'png') {
      outputFormat = 'image/png';
    } else {
      outputFormat = 'image/webp';
    }

    // Calculate dimensions based on aspect ratio
    let targetWidth = width;
    let targetHeight = height;

    if (maintainAspectRatio) {
      // Load image to get original dimensions
      const img = await CanvasHelper.loadImage(file);
      const aspectRatio = img.width / img.height;

      if (fit === 'contain') {
        // Fit inside the box
        if (width / height > aspectRatio) {
          targetWidth = Math.round(height * aspectRatio);
        } else {
          targetHeight = Math.round(width / aspectRatio);
        }
      } else if (fit === 'cover') {
        // Cover the entire box
        if (width / height > aspectRatio) {
          targetHeight = Math.round(width / aspectRatio);
        } else {
          targetWidth = Math.round(height * aspectRatio);
        }
      }
      // 'fill' uses exact dimensions, no adjustment needed
    }

    // Use CanvasHelper to resize
    const resizedBlob = await CanvasHelper.resizeImage(file, {
      width: targetWidth,
      height: targetHeight,
      fit: fit as 'contain' | 'cover' | 'fill',
      quality: quality / 100
    });

    // Convert format if needed
    if (outputFormat !== file.type) {
      const img = await CanvasHelper.loadImage(
        new File([resizedBlob], 'temp.png', { type: resizedBlob.type })
      );
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          outputFormat,
          quality / 100
        );
      });
    }

    return resizedBlob;
  }
};