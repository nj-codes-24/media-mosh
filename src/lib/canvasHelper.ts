export interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface CompressOptions {
  quality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill';
  quality?: number;
}

export class CanvasHelper {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  /**
   * Get or create canvas and context
   */
  private static getCanvas(): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', {
        willReadFrequently: true,
        alpha: true
      });

      if (!this.ctx) {
        throw new Error('Failed to get 2D context');
      }
    }

    return {
      canvas: this.canvas,
      ctx: this.ctx as CanvasRenderingContext2D
    };
  }

  /**
   * Load an image from a file
   */
  static async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Load image from URL
   */
  static async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image from URL'));

      img.src = url;
    });
  }

  /**
   * Convert canvas to blob
   */
  static async canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string = 'image/png',
    quality: number = 0.92
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        format,
        quality
      );
    });
  }

  /**
   * Compress an image
   */
  static async compressImage(
    file: File,
    options: CompressOptions = {}
  ): Promise<Blob> {
    const {
      quality = 0.85,
      maxWidth,
      maxHeight,
      format = 'image/jpeg'
    } = options;

    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    // Calculate dimensions
    let { width, height } = img;

    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Draw image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    return this.canvasToBlob(canvas, format, quality);
  }

  /**
   * Resize an image
   */
  static async resizeImage(
    file: File,
    options: ResizeOptions
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    const { width, height } = this.calculateDimensions(
      img.width,
      img.height,
      options
    );

    canvas.width = width;
    canvas.height = height;

    // Use high-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);

    return this.canvasToBlob(
      canvas,
      file.type as any,
      options.quality || 0.92
    );
  }

  /**
   * Calculate dimensions based on resize options
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    options: ResizeOptions
  ): { width: number; height: number } {
    const { width: targetWidth, height: targetHeight, fit = 'contain' } = options;

    if (!targetWidth && !targetHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    if (fit === 'fill') {
      return {
        width: targetWidth || originalWidth,
        height: targetHeight || originalHeight
      };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (targetWidth && !targetHeight) {
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio)
      };
    }

    if (!targetWidth && targetHeight) {
      return {
        width: Math.round(targetHeight * aspectRatio),
        height: targetHeight
      };
    }

    // Both width and height specified
    if (fit === 'contain') {
      const scale = Math.min(
        targetWidth! / originalWidth,
        targetHeight! / originalHeight
      );
      return {
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale)
      };
    }

    // fit === 'cover'
    const scale = Math.max(
      targetWidth! / originalWidth,
      targetHeight! / originalHeight
    );
    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale)
    };
  }

  /**
   * Crop an image
   */
  static async cropImage(
    file: File,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    return this.canvasToBlob(canvas, file.type as any);
  }

  /**
   * Apply filters to an image
   */
  static async applyFilter(
    file: File,
    filter: 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast',
    value: number = 1
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = img.width;
    canvas.height = img.height;

    // Apply CSS filter
    const filters: Record<string, string> = {
      grayscale: `grayscale(${value})`,
      sepia: `sepia(${value})`,
      blur: `blur(${value}px)`,
      brightness: `brightness(${value})`,
      contrast: `contrast(${value})`
    };

    ctx.filter = filters[filter] || 'none';
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';

    return this.canvasToBlob(canvas, file.type as any);
  }

  /**
   * Convert image to grayscale
   */
  static async toGrayscale(file: File): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);

    return this.canvasToBlob(canvas, 'image/png');
  }

  /**
   * Add text to image
   */
  static async addText(
    file: File,
    text: string,
    options: {
      x?: number;
      y?: number;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      stroke?: boolean;
      strokeColor?: string;
      strokeWidth?: number;
    } = {}
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Setup text
    const {
      x = canvas.width / 2,
      y = canvas.height / 2,
      fontSize = 48,
      fontFamily = 'Arial',
      color = 'white',
      align = 'center',
      baseline = 'middle',
      stroke = true,
      strokeColor = 'black',
      strokeWidth = 3
    } = options;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillStyle = color;

    // Draw stroke
    if (stroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(text, x, y);
    }

    // Draw text
    ctx.fillText(text, x, y);

    return this.canvasToBlob(canvas, 'image/png');
  }

  /**
   * Rotate image
   */
  static async rotateImage(
    file: File,
    degrees: number
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    const radians = (degrees * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));

    const newWidth = img.width * cos + img.height * sin;
    const newHeight = img.width * sin + img.height * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    return this.canvasToBlob(canvas, file.type as any);
  }

  /**
   * Flip image
   */
  static async flipImage(
    file: File,
    direction: 'horizontal' | 'vertical'
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.save();

    if (direction === 'horizontal') {
      ctx.scale(-1, 1);
      ctx.drawImage(img, -canvas.width, 0);
    } else {
      ctx.scale(1, -1);
      ctx.drawImage(img, 0, -canvas.height);
    }

    ctx.restore();

    return this.canvasToBlob(canvas, file.type as any);
  }

  /**
   * Extract color palette from image
   */
  static async extractPalette(
    file: File,
    numColors: number = 5
  ): Promise<string[]> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    // Use smaller canvas for faster processing
    const maxSize = 100;
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Color quantization (simplified k-means)
    const colors: Map<string, number> = new Map();

    for (let i = 0; i < pixels.length; i += 4) {
      const r = Math.round(pixels[i] / 10) * 10;
      const g = Math.round(pixels[i + 1] / 10) * 10;
      const b = Math.round(pixels[i + 2] / 10) * 10;
      const key = `${r},${g},${b}`;

      colors.set(key, (colors.get(key) || 0) + 1);
    }

    // Sort by frequency and take top N
    const sorted = Array.from(colors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors);

    // Convert to hex
    return sorted.map(([rgb]) => {
      const [r, g, b] = rgb.split(',').map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    });
  }

  /**
   * Create a circular profile picture
   */
  static async createCircularPFP(
    file: File,
    size: number = 500,
    borderWidth: number = 0,
    borderColor: string = '#ffffff'
  ): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - borderWidth;

    // Draw border
    if (borderWidth > 0) {
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Create circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Calculate crop to center
    const scale = Math.max(size / img.width, size / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (size - scaledWidth) / 2;
    const y = (size - scaledHeight) / 2;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    ctx.restore();

    return this.canvasToBlob(canvas, 'image/png');
  }

  /**
   * Remove EXIF data by creating a new image
   */
  static async removeEXIF(file: File): Promise<Blob> {
    const img = await this.loadImage(file);
    const { canvas, ctx } = this.getCanvas();

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    // By converting to canvas and back, EXIF is stripped
    return this.canvasToBlob(
      canvas,
      file.type as any,
      1.0 // Maximum quality to preserve image quality
    );
  }

  /**
   * Generate QR code
   */
  static async generateQRCode(
    text: string,
    size: number = 512,
    options: {
      foreground?: string;
      background?: string;
      errorCorrection?: 'L' | 'M' | 'Q' | 'H';
    } = {}
  ): Promise<Blob> {
    const {
      foreground = '#000000',
      background = '#ffffff'
    } = options;

    // Note: In production, use a proper QR library like qrcode
    // This is a placeholder implementation
    const { canvas, ctx } = this.getCanvas();

    canvas.width = size;
    canvas.height = size;

    // Draw background
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    // Draw placeholder QR pattern
    ctx.fillStyle = foreground;
    ctx.fillText('QR: ' + text, 10, 50);

    return this.canvasToBlob(canvas, 'image/png');
  }

  /**
   * Clean up resources
   */
  static cleanup(): void {
    if (this.canvas) {
      this.canvas.width = 0;
      this.canvas.height = 0;
    }
  }
}
