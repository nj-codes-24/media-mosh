/**
 * EXIF Remover Processor
 * Strips EXIF/metadata by re-encoding the image through a canvas.
 * Canvas drawImage() naturally strips all metadata.
 */

export const exifRemoverProcessor = {
  validate: async (file: File) => file.type.startsWith('image/'),
  getDefaultOptions: () => ({}),
  process: async (file: File, options?: { quality?: number; onProgress?: (p: { ratio: number }) => void }): Promise<Blob> => {
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

          if (options?.onProgress) options.onProgress({ ratio: 0.8 });

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create image blob. The image may be tainted by CORS.'));
                return;
              }
              if (options?.onProgress) options.onProgress({ ratio: 1 });
              resolve(blob);
            },
            'image/jpeg',
            options?.quality ?? 1.0
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err instanceof Error ? err : new Error('EXIF removal failed.'));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for EXIF removal.'));
      };

      img.src = url;
    });
  }
};