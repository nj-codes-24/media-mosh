/**
 * Image Compressor Processor
 * Re-encodes images through a canvas at the specified quality level.
 */

export const imageCompressorProcessor = {
  validate: async (file: File) => file.type.startsWith('image/'),
  getDefaultOptions: () => ({ quality: 0.6 }),
  process: async (file: File, options?: { quality?: number; format?: string; onProgress?: (p: { ratio: number }) => void }): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to get canvas context.'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);

          if (options?.onProgress) options.onProgress({ ratio: 0.5 });

          const outputFormat = options?.format || 'image/jpeg';
          const quality = options?.quality ?? 0.6;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error(`Failed to compress image. Format "${outputFormat}" may not be supported.`));
                return;
              }
              if (options?.onProgress) options.onProgress({ ratio: 1 });
              resolve(blob);
            },
            outputFormat,
            quality
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err instanceof Error ? err : new Error('Image compression failed.'));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for compression. The file may be corrupt or unsupported.'));
      };

      img.src = url;
    });
  }
};