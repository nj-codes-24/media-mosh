/**
 * Client-side Image Format Converter
 * Supports: PNG, JPG, WEBP, BMP
 */
export const imageFormatConverter = async (file: File, options: any): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 0.1;
      if (options.onProgress) options.onProgress({ ratio: Math.min(progress, 0.9) });
    }, 50);

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearInterval(progressInterval);
          reject(new Error('Canvas context failed'));
          return;
        }

        // Handle Transparency for formats that don't support it (JPG, BMP)
        if (['jpg', 'jpeg', 'bmp'].includes(options.format)) {
            ctx.fillStyle = '#FFFFFF'; // White background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);

        // Map format to MIME type
        let mimeType = 'image/png';
        if (options.format === 'jpg' || options.format === 'jpeg') mimeType = 'image/jpeg';
        if (options.format === 'webp') mimeType = 'image/webp';
        if (options.format === 'bmp') mimeType = 'image/bmp';

        // Convert
        canvas.toBlob((blob) => {
          clearInterval(progressInterval);
          if (options.onProgress) options.onProgress({ ratio: 1 });
          
          if (!blob) {
            reject(new Error('Conversion failed'));
            return;
          }

          const newFile = new File([blob], `converted.${options.format}`, { type: mimeType });
          resolve(newFile);
        }, mimeType, 0.9);
      };

      img.onerror = () => {
        clearInterval(progressInterval);
        reject(new Error('Failed to load image'));
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    
    reader.readAsDataURL(file);
  });
};