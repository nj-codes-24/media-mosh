/**
 * Palette Generator Processor
 * Extracts dominant colors using a simplified quantization approach.
 * 🚀 UPDATE: Now prioritizes VIBRANCY/SATURATION to avoid dull gray results.
 */
export const paletteGenerator = async (file: File, options: any): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Downscale for performance (speed over absolute precision)
          const MAX_SIZE = 150; 
          let w = img.width;
          let h = img.height;
          if (w > h) {
             if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
          } else {
             if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
          }
  
          canvas.width = w;
          canvas.height = h;
          
          if (!ctx) {
             reject(new Error('Canvas context failed'));
             return;
          }
          
          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h).data;
          
          const colorStats: { [key: string]: { count: number, score: number, rgb: number[] } } = {};
          
          // Helper: RGB to HSL (to detect saturation)
          const getSaturation = (r: number, g: number, b: number) => {
              r /= 255; g /= 255; b /= 255;
              const max = Math.max(r, g, b), min = Math.min(r, g, b);
              let s = 0;
              if (max !== min) {
                  const d = max - min;
                  s = (max + min) > 1 ? d / (2 - max - min) : d / (max + min);
              }
              return s;
          };

          // Sampling step
          for (let i = 0; i < imageData.length; i += 4) { 
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];
  
            if (a < 128) continue; // Skip transparent
  
            // Quantize colors (coarse grouping)
            const round = (n: number) => Math.floor(n / 25) * 25;
            const key = `${round(r)},${round(g)},${round(b)}`;
            
            if (!colorStats[key]) {
                colorStats[key] = { count: 0, score: 0, rgb: [r, g, b] };
            }

            colorStats[key].count++;
            
            // 🚀 SMART SCORE: 
            // Give higher score to saturated colors to prevent "Gray dominance"
            // Score = Count * (1 + Saturation * 2)
            const saturation = getSaturation(r, g, b);
            
            // Penalize very dark or very white pixels slightly
            const brightness = (r + g + b) / 3;
            let penalty = 1;
            if (brightness < 20 || brightness > 240) penalty = 0.5;

            colorStats[key].score += (1 + saturation * 3) * penalty; 
          }
  
          // Sort by SMART SCORE instead of just raw count
          let sortedCandidates = Object.values(colorStats)
            .sort((a, b) => b.score - a.score);

          // Filter for distinct colors (prevent duplicates like 3 shades of red)
          const finalPalette: string[] = [];
          const MIN_DISTANCE = 40; // Euclidean distance threshold

          const getDist = (c1: number[], c2: number[]) => {
              return Math.sqrt(
                  Math.pow(c1[0] - c2[0], 2) + 
                  Math.pow(c1[1] - c2[1], 2) + 
                  Math.pow(c1[2] - c2[2], 2)
              );
          };

          for (const candidate of sortedCandidates) {
              if (finalPalette.length >= 6) break;

              const isDistinct = finalPalette.every(hex => {
                  // Convert hex back to rgb for check (simplified for performance, usually valid)
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  return getDist(candidate.rgb, [r, g, b]) > MIN_DISTANCE;
              });

              if (isDistinct) {
                   const [r, g, b] = candidate.rgb;
                   const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                   finalPalette.push(hex);
              }
          }
  
          // Create Result
          const resultData = {
             palette: finalPalette,
             source: file.name,
             generated: new Date().toISOString()
          };
  
          const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' });
          const newFile = new File([blob], 'palette.json', { type: 'application/json' });
          
          setTimeout(() => {
             if (options.onProgress) options.onProgress({ ratio: 1 });
             resolve(newFile);
          }, 800);
        };
  
        img.onerror = () => reject(new Error('Failed to load image'));
        if (event.target?.result) img.src = event.target.result as string;
      };
      
      reader.readAsDataURL(file);
    });
};