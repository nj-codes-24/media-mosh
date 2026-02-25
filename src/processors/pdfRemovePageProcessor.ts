import { PDFDocument } from "pdf-lib";

export interface PdfRemovePageOptions {
  onProgress?: (progress: number) => void;
  /** 0-indexed page numbers to remove. */
  pagesToRemove: number[];
}

export const pdfRemovePageProcessor = async (
  input: File | File[],
  options: PdfRemovePageOptions
): Promise<Blob> => {
  const file = Array.isArray(input) ? input[0] : input;

  if (!file) {
    throw new Error("pdfRemovePageProcessor: No file provided.");
  }
  if (file.type !== "application/pdf") {
    throw new Error(
      `pdfRemovePageProcessor: File "${file.name}" is not a PDF (received type "${file.type}").`
    );
  }
  if (!options.pagesToRemove || options.pagesToRemove.length === 0) {
    throw new Error(
      "pdfRemovePageProcessor: options.pagesToRemove must be a non-empty array."
    );
  }

  options.onProgress?.(0.1);

  let sourceDoc: PDFDocument;
  try {
    const arrayBuffer = await file.arrayBuffer();
    sourceDoc = await PDFDocument.load(arrayBuffer);
  } catch (err) {
    throw new Error(
      `pdfRemovePageProcessor: Failed to parse "${file.name}". The file may be corrupt or password-protected.`
    );
  }

  const totalPages = sourceDoc.getPageCount();

  // Validate all indices before touching the document
  const invalidIndices = options.pagesToRemove.filter(
    (idx) => idx < 0 || idx >= totalPages
  );
  if (invalidIndices.length > 0) {
    throw new Error(
      `pdfRemovePageProcessor: Page indices out of range for a ${totalPages}-page document: [${invalidIndices.join(", ")}]. Indices must be 0-based.`
    );
  }

  if (options.pagesToRemove.length >= totalPages) {
    throw new Error(
      `pdfRemovePageProcessor: Cannot remove all ${totalPages} pages. At least one page must remain.`
    );
  }

  options.onProgress?.(0.3);

  // Build the new document from only the pages we want to keep.
  // This is safer and produces a cleaner file than removing pages
  // from the source doc directly (which can leave orphaned objects).
  const keepIndices = sourceDoc
    .getPageIndices()
    .filter((idx) => !options.pagesToRemove.includes(idx));

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(sourceDoc, keepIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  options.onProgress?.(0.85);

  const pdfBytes = await newDoc.save();
  options.onProgress?.(1);

  return new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
};