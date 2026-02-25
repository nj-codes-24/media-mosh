import { PDFDocument, degrees } from 'pdf-lib';

export const pdfPageManager = async (primaryFile: File, options: any): Promise<Blob> => {
  const { pages, onProgress } = options;

  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    throw new Error('No pages provided to process.');
  }

  // Ensure progress starts
  if (onProgress) onProgress(0.1);

  // 1. Create the new output document
  const outDoc = await PDFDocument.create();
  
  // 2. We need to load all unique source documents referenced in the tree
  // 'main' is our primary file. Others are inside the page objects if they uploaded them.
  const sourceDocs: Record<string, PDFDocument> = {};
  
  // Load the primary document first
  const primaryArrayBuffer = await primaryFile.arrayBuffer();
  sourceDocs['main'] = await PDFDocument.load(primaryArrayBuffer, { ignoreEncryption: true });
  
  if (onProgress) onProgress(0.3);

  // Helper to convert images to standard format if needed
  const convertToPng = async (fileObj: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(fileObj);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) { blob.arrayBuffer().then(resolve).catch(reject); } 
          else { reject(new Error('Blob creation failed')); }
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.src = objectUrl;
    });
  };

  // 3. Process every page sequentially
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    
    if (p.sourceType === 'main' || p.sourceType === 'doc') {
      // ── COPY FROM PDF ──
      let srcDoc = sourceDocs[p.sourceId];
      if (!srcDoc) {
         // If it's a newly added document, load it and cache it
         if (p.file) {
           const ab = await p.file.arrayBuffer();
           srcDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
           sourceDocs[p.sourceId] = srcDoc;
         } else {
           throw new Error(`Source document ${p.sourceId} not found`);
         }
      }
      
      const [copiedPage] = await outDoc.copyPages(srcDoc, [p.originalIndex]);
      
      // Apply rotation if any
      if (p.rotation !== 0) {
        const currentRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(currentRot + p.rotation));
      }
      outDoc.addPage(copiedPage);

    } else if (p.sourceType === 'blank') {
      // ── ADD BLANK PAGE ──
      // Default to standard A4 (595x842) unless we want to match previous page
      const prevPage = outDoc.getPageCount() > 0 ? outDoc.getPage(outDoc.getPageCount() - 1) : null;
      const width = prevPage ? prevPage.getWidth() : 595.28;
      const height = prevPage ? prevPage.getHeight() : 841.89;
      outDoc.addPage([width, height]);

    } else if (p.sourceType === 'image') {
      // ── EMBED CUSTOM IMAGE ──
      if (!p.file) continue;
      
      let embeddedImage;
      const isJpeg = p.file.type === 'image/jpeg' || p.file.name.toLowerCase().endsWith('.jpg');
      
      try {
        if (isJpeg) embeddedImage = await outDoc.embedJpg(await p.file.arrayBuffer());
        else embeddedImage = await outDoc.embedPng(await p.file.arrayBuffer());
      } catch (e) {
        // Fallback rasterization
        const fallbackPngBuffer = await convertToPng(p.file);
        embeddedImage = await outDoc.embedPng(fallbackPngBuffer);
      }
      
      // Match dimensions of the previous page
      const prevPage = outDoc.getPageCount() > 0 ? outDoc.getPage(outDoc.getPageCount() - 1) : null;
      const pageWidth = prevPage ? prevPage.getWidth() : embeddedImage.width;
      const pageHeight = prevPage ? prevPage.getHeight() : embeddedImage.height;
      
      const newPage = outDoc.addPage([pageWidth, pageHeight]);
      
      // Center the image inside the page
      const scale = Math.min(pageWidth / embeddedImage.width, pageHeight / embeddedImage.height);
      const scaledWidth = embeddedImage.width * scale;
      const scaledHeight = embeddedImage.height * scale;
      
      newPage.drawImage(embeddedImage, {
        x: (pageWidth - scaledWidth) / 2,
        y: (pageHeight - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      if (p.rotation !== 0) newPage.setRotation(degrees(p.rotation));
    }
    
    // Report progress
    if (onProgress) onProgress(0.3 + ((i / pages.length) * 0.6));
  }

  // 4. Save and return
  if (onProgress) onProgress(0.9);
  const pdfBytes = await outDoc.save();
  if (onProgress) onProgress(1.0);
  
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
};