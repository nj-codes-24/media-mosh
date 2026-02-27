/**
 * pdfjs loader — loads pdfjs from local /pdfjs/ files via dynamic import()
 * This bypasses Next.js webpack entirely since we load from public/ directly.
 */

let pdfjsPromise: Promise<any> | null = null;

export function loadPdfjs(): Promise<any> {
    if (pdfjsPromise) return pdfjsPromise;

    pdfjsPromise = (async () => {
        // If already loaded globally (from a previous call or external script)
        if ((window as any).pdfjsLib) {
            return (window as any).pdfjsLib;
        }

        // Dynamic import from our public directory (served as static files)
        // @ts-ignore
        const pdfjsLib = await import(/* webpackIgnore: true */ '/pdfjs/pdf.mjs');
        const lib = pdfjsLib.default || pdfjsLib;

        // Set the worker source to our local copy
        lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';

        // Cache it globally
        (window as any).pdfjsLib = lib;
        return lib;
    })();

    // If it fails, allow retry
    pdfjsPromise.catch(() => { pdfjsPromise = null; });

    return pdfjsPromise;
}