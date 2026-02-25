import { PDFDocument } from "pdf-lib";

export const pdfMergerProcessor = async (
  input: File | File[],
  options: {
    onProgress?: (progress: number) => void;
  }
): Promise<Blob> => {
  const files = Array.isArray(input) ? input : [input];

  if (files.length < 2) {
    throw new Error(
      "pdfMergerProcessor: At least two PDF files are required for merging."
    );
  }

  for (const file of files) {
    if (file.type !== "application/pdf") {
      throw new Error(
        `pdfMergerProcessor: File "${file.name}" is not a PDF (received type "${file.type}").`
      );
    }
  }

  const mergedDoc = await PDFDocument.create();
  options.onProgress?.(0.05);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    let sourceDoc: PDFDocument;
    try {
      const arrayBuffer = await file.arrayBuffer();
      sourceDoc = await PDFDocument.load(arrayBuffer);
    } catch (err) {
      throw new Error(
        `pdfMergerProcessor: Failed to parse "${file.name}". The file may be corrupt or password-protected.`
      );
    }

    const pageIndices = sourceDoc.getPageIndices(); // [0, 1, 2, ...]
    const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((page) => mergedDoc.addPage(page));

    // Progress: 5% init, 90% across all files, 5% for save
    options.onProgress?.(0.05 + ((i + 1) / files.length) * 0.9);
  }

  const pdfBytes = await mergedDoc.save();
  options.onProgress?.(1);

  return new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
};