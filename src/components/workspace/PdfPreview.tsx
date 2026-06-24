import React, { useRef, useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';
import { loadPdfjs } from '@/lib/pdfjsLoader';

export const PdfSinglePageCanvas = ({ srcFile, pageIndex, rotation, fileObject, sourceUrl }: { srcFile: string | null; pageIndex: number; rotation: number; fileObject?: File; sourceUrl?: string; }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfPage, setPdfPage] = useState<any>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPdfPage(null);
    setRenderError(null);

    const fetchPage = async () => {
      if (sourceUrl) return;
      if (!fileObject && !srcFile) return;

      try {
        const pdfjsLib = await loadPdfjs();

        let dataToLoad: any;
        if (fileObject) {
          const arrayBuffer = await fileObject.arrayBuffer();
          dataToLoad = { data: new Uint8Array(arrayBuffer) };
        } else {
          dataToLoad = { url: srcFile };
        }

        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument(dataToLoad);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(pageIndex + 1);
        if (!cancelled) setPdfPage(page);
      } catch (err: any) {
        console.error('[PdfSinglePageCanvas] Fetch error:', err);
        if (!cancelled) setRenderError(err?.message || 'Failed to load page');
      }
    };

    fetchPage();
    return () => { cancelled = true; };
  }, [srcFile, fileObject, sourceUrl, pageIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let renderTask: any = null;

    if (sourceUrl) {
      const img = new Image();
      img.onload = () => {
        const isRotated = rotation === 90 || rotation === 270;
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      };
      img.src = sourceUrl;
      return;
    }

    if (!pdfPage) return;

    try {
      const viewport = pdfPage.getViewport({ scale: 2.0, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      renderTask = pdfPage.render({ canvasContext: ctx, viewport } as any);
      renderTask.promise.catch((err: any) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('[PdfSinglePageCanvas] Render error:', err);
        }
      });
    } catch (err) {
      console.error('[PdfSinglePageCanvas] Canvas setup error:', err);
    }

    return () => { renderTask?.cancel?.(); };
  }, [pdfPage, rotation, sourceUrl]);

  if (renderError) {
    return (
      <div className="flex items-center justify-center bg-white rounded-sm shadow-2xl" style={{ width: 300, height: 400 }}>
        <div className="text-center p-4">
          <p className="text-red-400 text-xs font-bold mb-1">Preview Error</p>
          <p className="text-zinc-500 text-[10px] font-mono">{renderError}</p>
        </div>
      </div>
    );
  }

  if (!pdfPage && !sourceUrl) {
    return (
      <div className="flex items-center justify-center bg-white rounded-sm shadow-2xl" style={{ width: 300, height: 400 }}>
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return <canvas ref={canvasRef} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />;
};

export const PdfPageSlot = ({
  pdfPage,
  pageNum,
  slotRef,
}: {
  pdfPage: any;
  pageNum: number;
  slotRef: (el: HTMLDivElement | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTask = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfPage) return;

    renderTask.current?.cancel?.();

    const viewport = pdfPage.getViewport({ scale: 1.6 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderTask.current = pdfPage.render({ canvasContext: ctx, viewport } as any);
    renderTask.current.promise.catch((err: any) => {
      if (err?.name !== 'RenderingCancelledException') console.error(err);
    });

    return () => { renderTask.current?.cancel?.(); };
  }, [pdfPage]);

  return (
    <div
      ref={slotRef}
      data-page={pageNum}
      className="flex-shrink-0 shadow-2xl rounded overflow-hidden bg-white relative"
      style={{ maxWidth: '100%' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

export const PdfCanvasViewer = ({
  src,
  onPageChange,
}: {
  src: string;
  onPageChange: (page: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfPages, setPdfPages] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pageEls = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    setPdfPages([]);
    setLoadError(null);
    pageEls.current = [];

    const loadPdf = async () => {
      try {
        const pdfjsLib = await loadPdfjs();
        if (cancelled) return;

        const loadingTask = pdfjsLib.getDocument({ url: src });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const pagePromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          pagePromises.push(pdf.getPage(i));
        }

        const pages = await Promise.all(pagePromises);
        if (!cancelled) setPdfPages(pages);
      } catch (err: any) {
        console.error("[PdfCanvasViewer] Error:", err);
        if (!cancelled) setLoadError(err.message || 'Failed to parse PDF preview.');
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    if (pdfPages.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0;
        let bestPage = 1;
        entries.forEach((entry) => {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestPage = Number((entry.target as HTMLElement).dataset.page);
          }
        });
        if (bestRatio > 0) onPageChange(bestPage);
      },
      { root: container, threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0] }
    );

    pageEls.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [pdfPages, onPageChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center gap-4 py-6 px-4 bg-zinc-900/80"
    >
      {loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 shadow-lg">
            <X className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-red-400">Preview Error</p>
            <p className="text-[10px] text-zinc-400 mt-2 max-w-[250px] mx-auto bg-black/50 p-3 rounded-lg border border-white/5 font-mono">{loadError}</p>
            <p className="text-[9px] text-zinc-500 mt-4 max-w-xs font-bold uppercase tracking-widest">
              (You can still safely use the processor tools on the left)
            </p>
          </div>
        </div>
      ) : pdfPages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Rendering Pages…</p>
          </div>
        </div>
      ) : (
        pdfPages.map((pdfPage, idx) => (
          <PdfPageSlot
            key={idx}
            pdfPage={pdfPage}
            pageNum={idx + 1}
            slotRef={(el) => { pageEls.current[idx] = el; }}
          />
        ))
      )}
    </div>
  );
};
