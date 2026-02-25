// 🎨 PROFESSIONAL MAGIC ERASER PROCESSOR
// Uses advanced inpainting with multi-directional propagation

export async function process(file: File, options: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const MAX_DIM = 2048; // Higher resolution support
      let w = img.width;
      let h = img.height;
      
      // Smart scaling
      const scale = Math.min(1, MAX_DIM / Math.max(w, h));
      w = Math.floor(w * scale);
      h = Math.floor(h * scale);

      // Setup main canvas
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return reject('No context');

      ctx.drawImage(img, 0, 0, w, h);

      if (!options.maskBlob) {
        URL.revokeObjectURL(url);
        return canvas.toBlob(b => b ? resolve(b) : reject('No blob'), 'image/png');
      }

      // Load mask
      const maskImg = new Image();
      const maskUrl = URL.createObjectURL(options.maskBlob);

      maskImg.onload = () => {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        if (!maskCtx) return reject('No mask context');

        maskCtx.drawImage(maskImg, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const maskData = maskCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const mData = maskData.data;

        // ═══════════════════════════════════════════════════
        // ADVANCED INPAINTING ALGORITHM
        // ═══════════════════════════════════════════════════

        // 1️⃣ Build mask map (for faster lookups)
        const isMasked = new Uint8Array(w * h);
        let maskCount = 0;
        
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = y * w + x;
            const idx = i * 4;
            
            // Pixel is masked if it has any visible color
            if (mData[idx + 3] > 10) {
              isMasked[i] = 1;
              maskCount++;
            }
          }
        }

        if (maskCount === 0) {
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(maskUrl);
          return canvas.toBlob(b => b ? resolve(b) : reject('No blob'), 'image/png');
        }

        console.log(`🎨 Erasing ${maskCount} pixels (${(maskCount/(w*h)*100).toFixed(1)}% of image)`);

        // 2️⃣ Multi-Pass Diffusion with Priority Queue
        // Fill from edges inward for better quality
        
        const MAX_ITERATIONS = 100;
        const NEIGHBORS_8 = [
          [-1, -1], [0, -1], [1, -1],  // Top row
          [-1,  0],          [1,  0],  // Middle row
          [-1,  1], [0,  1], [1,  1]   // Bottom row
        ];

        let iteration = 0;
        let changed = true;

        while (changed && iteration < MAX_ITERATIONS) {
          changed = false;
          const updates: Array<{i: number, r: number, g: number, b: number}> = [];

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const i = y * w + x;
              
              if (!isMasked[i]) continue;

              let rSum = 0, gSum = 0, bSum = 0;
              let count = 0;
              let totalWeight = 0;

              // Check all 8 neighbors with distance weighting
              for (const [dx, dy] of NEIGHBORS_8) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                
                const ni = ny * w + nx;
                
                if (!isMasked[ni]) {
                  const nIdx = ni * 4;
                  
                  // Distance-based weighting (diagonal neighbors get less weight)
                  const weight = (dx === 0 || dy === 0) ? 1.0 : 0.7;
                  
                  rSum += data[nIdx] * weight;
                  gSum += data[nIdx + 1] * weight;
                  bSum += data[nIdx + 2] * weight;
                  totalWeight += weight;
                  count++;
                }
              }

              // If we have valid neighbors, fill this pixel
              if (count > 0) {
                updates.push({
                  i,
                  r: Math.round(rSum / totalWeight),
                  g: Math.round(gSum / totalWeight),
                  b: Math.round(bSum / totalWeight)
                });
              }
            }
          }

          // Apply all updates
          if (updates.length > 0) {
            changed = true;
            for (const {i, r, g, b} of updates) {
              const idx = i * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
              isMasked[i] = 0; // Mark as filled
            }
          }

          iteration++;
          
          // Report progress
          if (options.onProgress && iteration % 10 === 0) {
            options.onProgress({ ratio: Math.min(iteration / MAX_ITERATIONS, 0.95) });
          }
        }

        console.log(`✅ Inpainting complete in ${iteration} iterations`);

        // 3️⃣ Final pass: Fill any remaining stubborn pixels
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = y * w + x;
            
            if (isMasked[i]) {
              const idx = i * 4;
              
              // Use nearest valid neighbor
              let found = false;
              for (let radius = 1; radius < 10 && !found; radius++) {
                for (const [dx, dy] of NEIGHBORS_8) {
                  const nx = x + dx * radius;
                  const ny = y + dy * radius;
                  
                  if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                  
                  const ni = ny * w + nx;
                  if (!isMasked[ni]) {
                    const nIdx = ni * 4;
                    data[idx] = data[nIdx];
                    data[idx + 1] = data[nIdx + 1];
                    data[idx + 2] = data[nIdx + 2];
                    data[idx + 3] = 255;
                    found = true;
                    break;
                  }
                }
              }
              
              // Last resort: gray
              if (!found) {
                data[idx] = data[idx + 1] = data[idx + 2] = 128;
                data[idx + 3] = 255;
              }
            }
          }
        }

        // 4️⃣ Optional: Slight blur on filled regions for smoothness
        // (You can enable this for even smoother results)
        /*
        const blurRadius = 2;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = blurRadius; y < h - blurRadius; y++) {
          for (let x = blurRadius; x < w - blurRadius; x++) {
            const i = y * w + x;
            const idx = i * 4;
            
            // Only blur originally masked areas
            if (mData[idx + 3] > 10) {
              let r = 0, g = 0, b = 0, count = 0;
              
              for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                  const ni = (y + dy) * w + (x + dx);
                  const nIdx = ni * 4;
                  r += tempData[nIdx];
                  g += tempData[nIdx + 1];
                  b += tempData[nIdx + 2];
                  count++;
                }
              }
              
              data[idx] = Math.round(r / count);
              data[idx + 1] = Math.round(g / count);
              data[idx + 2] = Math.round(b / count);
            }
          }
        }
        */

        // 5️⃣ Write result
        ctx.putImageData(imgData, 0, 0);
        
        if (options.onProgress) {
          options.onProgress({ ratio: 1 });
        }
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(maskUrl);
          if (blob) {
            console.log(`💾 Result ready (${(blob.size / 1024).toFixed(1)}KB)`);
            resolve(blob);
          } else {
            reject('Failed to create blob');
          }
        }, 'image/png');
      };

      maskImg.onerror = () => reject('Failed to load mask');
      maskImg.src = maskUrl;
    };
    
    img.onerror = () => reject('Failed to load image');
    img.src = url;
  });
}