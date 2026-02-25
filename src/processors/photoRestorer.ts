/**
 * Photo Restorer Processor V7 (Pro-Grade Restoration)
 * Fixes: Blown-out contrast, aggressive smudging, and weird colors.
 * Approach: Gentle De-haze -> Surgical Repair -> Vintage Color Grading
 */

// --- HELPER 1: SURGICAL REPAIR (Dust & Scratch Removal) ---
const applySurgicalRepair = (data: Uint8ClampedArray, w: number, h: number) => {
    // We use a cloned buffer to read original values
    const input = new Uint8ClampedArray(data);
    
    // Config: How aggressive to be?
    // Threshold: 30 = subtle, 10 = aggressive. 25 is a good balance for old photos.
    const THRESHOLD = 25; 

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            
            // Calculate luminance of current pixel
            const lum = (input[idx] + input[idx + 1] + input[idx + 2]) / 3;
            
            // Get 3x3 Median (The "middle" value of neighbors)
            // This is excellent for removing salt-and-pepper noise (dust)
            const neighbors = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nIdx = ((y + dy) * w + (x + dx)) * 4;
                    const nLum = (input[nIdx] + input[nIdx + 1] + input[nIdx + 2]) / 3;
                    neighbors.push(nLum);
                }
            }
            neighbors.sort((a, b) => a - b);
            const median = neighbors[4]; // Middle element
            
            // If current pixel is VERY different from median (it's a speck/scratch)
            if (Math.abs(lum - median) > THRESHOLD) {
                // Replace with median color (physically removes the speck)
                // To do this accurately, we need the RGB of that median pixel.
                // Simplified: We blend the neighbors.
                
                let rSum = 0, gSum = 0, bSum = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nIdx = ((y + dy) * w + (x + dx)) * 4;
                        rSum += input[nIdx];
                        gSum += input[nIdx + 1];
                        bSum += input[nIdx + 2];
                    }
                }
                
                data[idx] = rSum / 8;
                data[idx + 1] = gSum / 8;
                data[idx + 2] = bSum / 8;
            }
        }
    }
};

// --- HELPER 2: SMART DE-HAZE (Levels Adjustment) ---
const applySmartDehaze = (data: Uint8ClampedArray) => {
    // 1. Find true black and white points (ignoring outliers)
    // We create a histogram to find the 1st and 99th percentile
    const hist = new Array(256).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
        const lum = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
        hist[lum]++;
    }
    
    const totalPixels = data.length / 4;
    
    let minThresh = 0;
    let sum = 0;
    // Walk up to find bottom 1% (shadows)
    while (minThresh < 255 && sum < totalPixels * 0.01) {
        sum += hist[minThresh];
        minThresh++;
    }
    
    let maxThresh = 255;
    sum = 0;
    // Walk down to find top 1% (highlights)
    while (maxThresh > 0 && sum < totalPixels * 0.01) {
        sum += hist[maxThresh];
        maxThresh--;
    }
    
    // 2. Stretch that range to 0-255 (Restores Contrast)
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            let val = data[i + c];
            if (val < minThresh) val = minThresh;
            if (val > maxThresh) val = maxThresh;
            
            // Map min->0 and max->255
            data[i + c] = (val - minThresh) * (255 / (maxThresh - minThresh));
        }
    }
};

// --- HELPER 3: VINTAGE COLOR GRADING (Warmth) ---
const applyVintageColor = (data: Uint8ClampedArray) => {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Target Colors (Vintage Look)
        // Shadows: Deep Brown/Chocolate
        // Midtones: Warm Peach/Skin
        // Highlights: Soft Cream
        
        let newR = lum;
        let newG = lum;
        let newB = lum;
        
        // Apply "Sepia-like" curve but preserving blacks
        newR = lum + 40;  // Boost Red
        newG = lum + 20;  // Boost Green (Red+Green = Yellow/Orange)
        newB = lum - 20;  // Reduce Blue (creates yellow warmth)
        
        // Correction for deep blacks (keep them neutral/cool)
        if (lum < 60) {
            const factor = (60 - lum) / 60; // 1.0 at black
            newR -= 40 * factor;
            newG -= 20 * factor;
            newB += 30 * factor; // Add blue back to shadows for depth
        }
        
        // Correction for bright whites (keep them clean)
        if (lum > 200) {
            const factor = (lum - 200) / 55;
            newR += 10 * factor;
            newG += 10 * factor;
            newB += 20 * factor; // Add blue back to whites to make them "paper white"
        }
        
        // Blend: 50% Color, 50% Original Luminance (Overlay Mode Simulation)
        // This ensures details aren't lost under the color
        const blend = 0.5; 
        
        data[i] = Math.min(255, Math.max(0, r * (1 - blend) + newR * blend));
        data[i + 1] = Math.min(255, Math.max(0, g * (1 - blend) + newG * blend));
        data[i + 2] = Math.min(255, Math.max(0, b * (1 - blend) + newB * blend));
    }
};

// --- HELPER 4: UNSHARP MASK (Crispness) ---
const applyUnsharpMask = (data: Uint8ClampedArray, w: number, h: number) => {
    const copy = new Uint8ClampedArray(data);
    const amount = 0.3; // Gentle sharpening
    
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            
            for (let c = 0; c < 3; c++) {
                const center = copy[idx + c];
                
                // Simple high-pass filter
                const neighbors = (
                    copy[((y-1)*w + x)*4 + c] +
                    copy[((y+1)*w + x)*4 + c] +
                    copy[(y*w + (x-1))*4 + c] +
                    copy[(y*w + (x+1))*4 + c]
                ) / 4;
                
                const diff = center - neighbors;
                data[idx + c] = Math.min(255, Math.max(0, center + diff * amount * 4));
            }
        }
    }
};

// --- MAIN PROCESSOR ---

export const photoRestorer = async (file: File, options: any): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const updateProgress = (ratio: number) => {
         if (options.onProgress) options.onProgress({ ratio });
      };
  
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
  
          if (!ctx) {
            reject(new Error('Canvas context failed'));
            return;
          }
  
          // Resize large images for speed, but keep enough res for print
          const MAX_DIM = 2000;
          let w = img.width;
          let h = img.height;
          if (w > MAX_DIM || h > MAX_DIM) {
             const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
             w *= ratio;
             h *= ratio;
          }

          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          
          const imageData = ctx.getImageData(0, 0, w, h);
          const data = imageData.data;
          
          updateProgress(0.1);

          try {
              // 1. REPAIR: Remove physical defects first
              if (options.repair) {
                  applySurgicalRepair(data, w, h);
                  updateProgress(0.4);
              }

              // 2. ENHANCE: Fix exposure/haze (Critical for old photos)
              // We always run this to fix the "gray" look
              applySmartDehaze(data);
              updateProgress(0.6);
              
              // 3. COLOR: Apply vintage grading
              if (options.colorize) {
                  applyVintageColor(data);
                  updateProgress(0.8);
              }
              
              // 4. SHARPEN: Final polish to bring back edges
              applyUnsharpMask(data, w, h);
              updateProgress(0.95);

              ctx.putImageData(imageData, 0, 0);
      
              canvas.toBlob((blob) => {
                updateProgress(1);
                if (!blob) {
                  reject(new Error('Restoration failed'));
                  return;
                }
                const newFile = new File([blob], `restored_${file.name}`, { type: 'image/png' });
                resolve(newFile);
              }, 'image/png');

          } catch (err) {
              reject(err);
          }
        };
  
        img.onerror = () => reject(new Error('Failed to load image'));
        if (event.target?.result) img.src = event.target.result as string;
      };
      
      reader.readAsDataURL(file);
    });
};