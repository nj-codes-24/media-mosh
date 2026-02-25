/**
 * Client-side PDF Compressor — Target File Size
 *
 * Uses Binary Search on JPEG quality to hit the exact target file size.
 * Renders pages to canvas once, then iterates to find the best quality.
 */

import { loadPdfjs } from '@/lib/pdfjsLoader';

export const pdfCompressor = async (file: File, options: any): Promise<Blob> => {
    const { PDFDocument } = await import('pdf-lib');

    const report = (r: number) => { if (options?.onProgress) options.onProgress({ ratio: r }); };
    report(0.02);

    // ── Target Size ──
    const targetMB = parseFloat(options?.targetSize);
    const targetBytes = targetMB && targetMB > 0
        ? targetMB * 1024 * 1024
        : file.size * 0.5;

    const arrayBuffer = await file.arrayBuffer();
    report(0.06);

    const pdfjsLib = await loadPdfjs();
    report(0.1);

    const pdfData = new Uint8Array(arrayBuffer);
    const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const pageCount = pdfDoc.numPages;
    report(0.15);

    // Use a fixed high-quality scale for canvas rendering.
    // This ensures text stays readable; we control size strictly via JPEG quality.
    const renderScale = 1.5;

    // ── Render all pages to canvas ONCE ──
    const canvases: { w: number; h: number; canvas: HTMLCanvasElement }[] = [];

    for (let i = 1; i <= pageCount; i++) {
        const page = await pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        canvases.push({ w: vp.width, h: vp.height, canvas });
        report(0.15 + (i / pageCount) * 0.35); // takes us to 0.50
    }

    // ── Binary Search for optimal JPEG Quality ──

    let low = 0.01;
    let high = 1.0;
    let bestBlob: Blob | null = null;
    let bestDiff = Infinity;

    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const q = (low + high) / 2;

        // Build PDF
        const newDoc = await PDFDocument.create();
        for (const { w, h, canvas } of canvases) {
            const dataUrl = canvas.toDataURL('image/jpeg', q);
            const base64 = dataUrl.split(',')[1];
            const raw = atob(base64);
            const imgBytes = new Uint8Array(raw.length);
            for (let j = 0; j < raw.length; j++) imgBytes[j] = raw.charCodeAt(j);

            const jpg = await newDoc.embedJpg(imgBytes);
            const page = newDoc.addPage([w, h]);
            page.drawImage(jpg, { x: 0, y: 0, width: w, height: h });
        }

        const pdfBytes = await newDoc.save({ useObjectStreams: true });
        const resultBlob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });

        report(0.50 + ((attempt + 1) / MAX_ATTEMPTS) * 0.45); // takes us to 0.95

        console.log(`[pdfCompressor] Try ${attempt + 1}: Q=${q.toFixed(3)} -> ${(resultBlob.size / 1024 / 1024).toFixed(2)}MB (Target: ${(targetBytes / 1024 / 1024).toFixed(2)}MB)`);

        // Track the closest blob that is <= targetBytes array
        const diff = targetBytes - resultBlob.size;

        // If it's under the target, and closer than our previous best, save it
        if (resultBlob.size <= targetBytes) {
            if (diff < bestDiff) {
                bestBlob = resultBlob;
                bestDiff = diff;
            }
            // Try higher quality to get closer to target
            low = q;
        } else {
            // Too big, must lower quality
            high = q;
            // Fallback: if we haven't found a valid bestBlob yet, keep this one just in case 
            // even the lowest quality is slightly over the target.
            if (!bestBlob && attempt === MAX_ATTEMPTS - 1) {
                bestBlob = resultBlob;
            }
        }

        // If we hit it nearly perfectly (within 2%), we can stop early
        if (Math.abs(diff) / targetBytes < 0.02 && resultBlob.size <= targetBytes) {
            break;
        }
    }

    report(1);
    return bestBlob!;
};
