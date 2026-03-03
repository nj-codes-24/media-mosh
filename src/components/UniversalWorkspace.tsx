'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload, Download, Settings, RotateCcw, Zap, FileType, Copy, Check, Trash2,
  Mic2, Drum, Speaker, ListMusic, Play, Pause, Music2,
  Ghost, Bot, Phone, Smile, Mountain, User, UserCheck,
  Pencil, X, ChevronRight, File as FileIcon, Layers, Plus, GripVertical, Loader2, Image as ImageIcon, FileArchive,
  FileText, Square, RotateCw, ArrowUpRight, CopyPlus
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// ---------------------------------------------------------------------------
// UTILITY: parse "1, 3, 5-10" (1-indexed UI labels) → sorted 0-indexed array
// ---------------------------------------------------------------------------
const parsePdfPageInput = (
  text: string,
  selected: number[],
  total: number
): number[] => {
  const pages = new Set<number>();

  if (text.trim()) {
    text.split(',').forEach(part => {
      part = part.trim();
      const rangeParts = part.split('-').map(s => parseInt(s.trim(), 10));
      if (
        rangeParts.length === 2 &&
        !isNaN(rangeParts[0]) &&
        !isNaN(rangeParts[1])
      ) {
        const [start, end] = rangeParts;
        for (let i = Math.max(1, start); i <= Math.min(total, end); i++) {
          pages.add(i - 1);
        }
      } else if (rangeParts.length >= 1 && !isNaN(rangeParts[0])) {
        const n = rangeParts[0];
        if (n >= 1 && n <= total) pages.add(n - 1);
      }
    });
  } else {
    selected.forEach(p => {
      if (p >= 1 && p <= total) pages.add(p - 1);
    });
  }

  return Array.from(pages).sort((a, b) => a - b);
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: WAVEFORM PLAYER
// ---------------------------------------------------------------------------
const WaveformPlayer = ({
  src, color, isPlaying, onTogglePlay,
}: {
  src: string; color: string; isPlaying: boolean; onTogglePlay: () => void;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play(); else audio.pause();
    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100);
    const setAudioData = () => setDuration(audio.duration);
    const handleEnded = () => onTogglePlay();
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, onTogglePlay]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = (parseFloat(e.target.value) / 100) * duration;
      audioRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  return (
    <div className="flex-1 flex items-center gap-4">
      <audio ref={audioRef} src={src} />
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="relative w-full h-8 group cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-between gap-[2px] opacity-30">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className={`w-1 rounded-full ${color.replace('text-', 'bg-')}`} style={{ height: `${20 + Math.random() * 80}%` }} />
            ))}
          </div>
          <input type="range" min="0" max="100" value={progress || 0} onChange={handleSeek} onClick={(e) => e.stopPropagation()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
          <div className="absolute top-1/2 left-0 h-1 bg-white/10 w-full -translate-y-1/2 rounded-full overflow-hidden pointer-events-none">
            <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <a href={src} download="stem.wav" onClick={(e) => e.stopPropagation()} className="w-10 h-10 flex-shrink-0 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">
        <Download className="w-4 h-4" />
      </a>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: SUBTITLE TRANSCRIPT ITEM
// ---------------------------------------------------------------------------
const TranscriptItem = ({
  sub, index, isActive, onSeek, onUpdate,
}: {
  sub: { start: number; end: number; text: string };
  index: number;
  isActive: boolean;
  onSeek: (time: number) => void;
  onUpdate: (index: number, updated: { start: number; end: number; text: string }) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editStart, setEditStart] = useState(sub.start.toFixed(1));
  const [editEnd, setEditEnd] = useState(sub.end.toFixed(1));
  const [editText, setEditText] = useState(sub.text);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1).padStart(4, '0');
    return m > 0 ? `${m}:${sec}` : `${sec}s`;
  };

  const handleSave = () => {
    onUpdate(index, {
      start: parseFloat(editStart) || sub.start,
      end: parseFloat(editEnd) || sub.end,
      text: editText,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-3 rounded-xl bg-zinc-900 border border-cyan-500/40 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">Start (s)</label>
            <input type="number" step="0.1" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="flex-1">
            <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">End (s)</label>
            <input type="number" step="0.1" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500" />
          </div>
        </div>
        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none" />
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 py-1.5 bg-cyan-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors">Save</button>
          <button onClick={() => setEditing(false)} className="py-1.5 px-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors"><X className="w-3 h-3" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-2 p-2.5 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.06] hover:border-white/10'}`}>
      <button onClick={() => onSeek(sub.start)} className="flex-1 flex items-start gap-2 text-left">
        <div className="flex flex-col gap-0.5 pt-0.5 min-w-[48px]">
          <span className={`font-mono text-[9px] font-bold ${isActive ? 'text-cyan-400' : 'text-zinc-600'}`}>{formatTime(sub.start)}</span>
          <span className="font-mono text-[8px] text-zinc-700">→{formatTime(sub.end)}</span>
        </div>
        <ChevronRight className={`w-3 h-3 mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-cyan-500' : 'text-zinc-700 group-hover:text-zinc-500'}`} />
        <p className={`text-[10px] leading-relaxed font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{sub.text}</p>
      </button>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-zinc-600 hover:text-white transition-all flex-shrink-0 mt-0.5">
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: PDF SINGLE PAGE CANVAS
// ---------------------------------------------------------------------------

let _pdfjsPromise: Promise<any> | null = null;
const getPdfjsLib = (): Promise<any> => {
  if (_pdfjsPromise) return _pdfjsPromise;

  _pdfjsPromise = (async () => {
    if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
      return (window as any).pdfjsLib;
    }
    const pdfjsModule = await import(/* webpackIgnore: true */ '/pdfjs/pdf.mjs' as any);
    const lib = pdfjsModule.default || pdfjsModule;

    lib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';

    if (typeof window !== 'undefined') {
      (window as any).pdfjsLib = lib;
    }
    return lib;
  })();

  _pdfjsPromise.catch(() => { _pdfjsPromise = null; });
  return _pdfjsPromise;
};

const PdfSinglePageCanvas = ({ srcFile, pageIndex, rotation, fileObject, sourceUrl }: { srcFile: string | null; pageIndex: number; rotation: number; fileObject?: File; sourceUrl?: string; }) => {
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
        const pdfjsLib = await getPdfjsLib();

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


// ---------------------------------------------------------------------------
// SUB-COMPONENT: PDF CANVAS VIEWER
// ---------------------------------------------------------------------------
const PdfPageSlot = ({
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

const PdfCanvasViewer = ({
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
        const pdfjsLib = await getPdfjsLib();
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

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function UniversalWorkspace({ tool, onProcess }: any) {
  // ── File & URL states ────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pdfGridRef = useRef<HTMLDivElement>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);

  // ── Audio / Palette / Voice states ──────────────────────────────────────
  const [stems, setStems] = useState<Record<string, string> | null>(null);
  const [playingStem, setPlayingStem] = useState<string | null>(null);
  const [paletteColors, setPaletteColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeVoice, setActiveVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Subtitle states ──────────────────────────────────────────────────────
  const [subtitles, setSubtitles] = useState<{ start: number; end: number; text: string }[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVideoStarted, setIsVideoStarted] = useState(false);

  // ── PDF Remove-Page states ───────────────────────────────────────────────
  const [pdfPageMode, setPdfPageMode] = useState<'keep' | 'delete'>('delete');
  const [pdfSelectedPages, setPdfSelectedPages] = useState<number[]>([]);
  const [pdfManualText, setPdfManualText] = useState<string>('');
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(0);
  const [pdfDetecting, setPdfDetecting] = useState(false);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);

  // ── PDF Page Manager States ──────────────────────────────────────────────
  interface PdfManagerPage {
    id: string;
    sourceId: string;
    sourceType: 'main' | 'blank' | 'image' | 'doc';
    sourceLabel: string;
    originalIndex: number;
    rotation: number;
    file?: File;
    sourceUrl?: string;
  }
  const [pdfManagerPages, setPdfManagerPages] = useState<PdfManagerPage[]>([]);
  const [pdfManagerActiveId, setPdfManagerActiveId] = useState<string | null>(null);
  const [pdfManagerUnsaved, setPdfManagerUnsaved] = useState(false);
  const insertDocInputRef = useRef<HTMLInputElement>(null);
  const insertImageInputRef = useRef<HTMLInputElement>(null);
  const [insertIndexTarget, setInsertIndexTarget] = useState<number | null>(null);

  // ── Remove-BG states ─────────────────────────────────────────────────────
  const [selectedBgColor, setSelectedBgColor] = useState<string | null>(null);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [resultDimensions, setResultDimensions] = useState<{ w: number; h: number } | null>(null);
  const customBgInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<any>({
    quality: 75, targetSize: '', format: 'mp3', scale: 2,
    colorize: false, repair: false, preset: '', frameMode: 'single'
  });

  // ── Tool-type flags ──────────────────────────────────────────────────────
  const _toolName = (tool.name || '').toLowerCase();
  const isPdfMultiInput = tool.id === 'pdf-from-images' || tool.id === 'pdf-merger';
  const isPdfRemovePage = tool.id === 'pdf-remove-page';
  const isPdfCompress = tool.id === 'pdf-compress';
  const isPdfConverter = tool.id === 'pdf-converter';
  const isPdfManager = tool.id === 'pdf-page-manager';
  const isPdfTool = isPdfMultiInput || isPdfRemovePage || isPdfCompress || isPdfConverter || isPdfManager;
  const isVideoBgRemover = tool.id === 'video-bg-remover';
  const isRemoveBg = (tool.id === 'remove-bg' || tool.id === 'bg-remover' || tool.id === 'background-remover' || (_toolName.includes('background') && (_toolName.includes('remov')))) && !isVideoBgRemover;
  const isExifRemover = tool.id === 'exif-remover' || tool.id === 'exif' || _toolName.includes('exif');
  const isImageConverter = tool.id === 'image-converter';
  const isAiUpscale = tool.id === 'ai-upscale';
  const isPaletteGenerator = tool.id === 'palette-generator';
  const shouldHideMetadata = tool.id === 'palette-generator' || tool.id === 'photo-restore' || isRemoveBg || isPdfManager;
  const isSplitter = tool.id === 'audio-splitter';
  const isVoiceChanger = tool.id === 'voice-changer';
  const isTTS = tool.id === 'text-to-speech';
  const isSubtitles = tool.id === 'auto-subtitle';
  const isFrameExtractor = tool.id === 'frame-extractor';

  // ── Global Drag & Drop / Paste overrides ────────────────────────────────
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent browser from opening files dragged outside the dropzone
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Ignore if typing in text inputs (e.g. prompt bar, url bar)
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const pastedFiles = Array.from(e.clipboardData.files);
        const shouldAppend = isPdfMultiInput && files.length > 0;
        handleFileSelect(pastedFiles, shouldAppend);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, file, isPdfMultiInput]);

  // ── Local Dropzone Handlers ──────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files, isPdfMultiInput && files.length > 0);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0.00 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ── Arrow key navigation + reordering ───────────────────────────────────
  useEffect(() => {
    if (!isPdfManager) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!pdfManagerActiveId) return;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setPdfManagerPages(prev => {
          const idx = prev.findIndex(p => p.id === pdfManagerActiveId);
          if (idx === -1) return prev;
          const newIdx = e.key === 'ArrowLeft' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= prev.length) return prev;
          setPdfManagerActiveId(prev[newIdx].id);
          return prev;
        });
      } else {
        setPdfManagerPages(prev => {
          const idx = prev.findIndex(p => p.id === pdfManagerActiveId);
          if (idx === -1) return prev;
          const newIdx = e.key === 'ArrowUp' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= prev.length) return prev;
          const next = [...prev];
          [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
          return next;
        });
        setPdfManagerUnsaved(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPdfManager, pdfManagerActiveId]);

  const handleReset = () => {
    setFile(null);
    setFiles([]);
    setActiveFile(null);
    setImgDimensions(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setResultSize(null);
    setProcessing(false);
    setProgress(0);
    setError(null);
    setHasInitiated(false);
    setPaletteColors([]);
    setStems(null);
    setPlayingStem(null);
    setTextInput('');
    setSubtitles([]);
    setCurrentTime(0);
    setIsVideoStarted(false);
    setIsSpeaking(false);
    setPdfSelectedPages([]);
    setPdfManualText('');
    setPdfPageMode('delete');
    setPdfTotalPages(0);
    setPdfDetecting(false);
    setCurrentPdfPage(1);
    setSelectedBgColor(null);
    setCustomBgUrl(null);
    setCompositeUrl(null);
    setResultDimensions(null);
    setImageUrlInput('');
    setUrlError(null);

    setPdfManagerPages([]);
    setPdfManagerActiveId(null);
    setPdfManagerUnsaved(false);

    window.speechSynthesis.cancel();
    setOptions({ quality: 75, targetSize: '', format: '', scale: 2, colorize: false, repair: false, preset: '', frameMode: 'single' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  useEffect(() => { handleReset(); }, [tool.id]);

  useEffect(() => {
    if (!pdfGridRef.current || !isPdfRemovePage) return;
    const btn = pdfGridRef.current.querySelector<HTMLButtonElement>(
      `[data-gridpage="${currentPdfPage}"]`
    );
    btn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentPdfPage, isPdfRemovePage]);

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setAvailableVoices(v);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // ── File selection ───────────────────────────────────────────────────────
  const handleFileSelect = async (selectedFiles: FileList | File[], append = false) => {
    const fileArray = Array.from(selectedFiles);
    if (fileArray.length === 0) return;

    const newFiles = append ? [...files, ...fileArray] : fileArray;

    setFiles(newFiles);
    setFile(newFiles[0]);

    if (!append) {
      setActiveFile(newFiles[0]);
      setPreviewUrl(URL.createObjectURL(newFiles[0]));
      setResultUrl(null);
      setResultSize(null);
      setError(null);
      setHasInitiated(false);
      setPaletteColors([]);
      setStems(null);
      setSubtitles([]);
      setCurrentTime(0);
      setIsVideoStarted(false);
      setPdfSelectedPages([]);
      setPdfManualText('');
      setPdfTotalPages(0);

      if (newFiles[0].type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => setImgDimensions({ w: img.width, h: img.height });
        img.src = URL.createObjectURL(newFiles[0]);
      }

      if (isPdfManager && newFiles[0].type === 'application/pdf') {
        setPdfDetecting(true);
        try {
          const { PDFDocument } = await import('pdf-lib');
          const arrayBuffer = await newFiles[0].arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const count = pdfDoc.getPageCount();

          const initialNodes: PdfManagerPage[] = Array.from({ length: count }).map((_, i) => ({
            id: `main-${Date.now()}-${i}`,
            sourceId: 'main',
            sourceType: 'main',
            sourceLabel: newFiles[0].name,
            originalIndex: i,
            rotation: 0,
          }));

          setPdfManagerPages(initialNodes);
          if (initialNodes.length > 0) setPdfManagerActiveId(initialNodes[0].id);

        } catch (err) {
          console.error('[UniversalWorkspace] Initial load failed:', err);
          setError('Could not read the PDF to initialize the Page Manager.');
        } finally {
          setPdfDetecting(false);
        }
      }

      if (isPdfRemovePage && newFiles[0].type === 'application/pdf') {
        setPdfDetecting(true);
        try {
          const { PDFDocument } = await import('pdf-lib');
          const arrayBuffer = await newFiles[0].arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
          });
          const count = pdfDoc.getPageCount();
          setPdfTotalPages(count > 0 ? count : 1);
        } catch (err) {
          console.warn('[UniversalWorkspace] pdf-lib page detection failed:', err);
          setPdfTotalPages(1);
        } finally {
          setPdfDetecting(false);
        }
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput) return;

    setIsFetchingUrl(true);
    setUrlError(null);

    try {
      const response = await fetch(`/api/fetch-image?url=${encodeURIComponent(imageUrlInput)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Network response was not ok');
      }

      const blob = await response.blob();

      let filename = imageUrlInput.split('/').pop()?.split('?')[0] || 'url-image.jpg';
      if (!filename.includes('.')) {
        const ext = blob.type.split('/')[1] || 'jpg';
        filename = `url-image.${ext}`;
      }

      const file = new File([blob], filename, { type: blob.type });
      await handleFileSelect([file]);
      setImageUrlInput('');
    } catch (err: any) {
      console.error('URL Fetch Error:', err);
      setUrlError(err.message || "Failed to load image. Ensure the URL is accessible.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleRemoveFile = (fileToRemove: File, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFiles = files.filter(f => f !== fileToRemove);
    if (newFiles.length === 0) {
      handleReset();
    } else {
      setFiles(newFiles);
      if (activeFile === fileToRemove) {
        setActiveFile(newFiles[0]);
        setPreviewUrl(URL.createObjectURL(newFiles[0]));
        setFile(newFiles[0]);
      }
    }
  };

  // ── PDF PAGE MANAGER LOGIC ───────────────────────────────────────────────
  const handlePdfManagerInsertBlank = (targetIndex: number) => {
    const newId = `blank-${Date.now()}`;
    const newNode: PdfManagerPage = { id: newId, sourceId: newId, sourceType: 'blank', sourceLabel: 'Blank Page', originalIndex: 0, rotation: 0 };
    const newPages = [...pdfManagerPages];
    newPages.splice(targetIndex, 0, newNode);
    setPdfManagerPages(newPages);
    setPdfManagerActiveId(newId);
    setPdfManagerUnsaved(true);
  };

  const handlePdfManagerInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || insertIndexTarget === null) return;
    const imgFile = e.target.files[0];
    const newId = `img-${Date.now()}`;
    const newNode: PdfManagerPage = {
      id: newId, sourceId: newId, sourceType: 'image', sourceLabel: imgFile.name, originalIndex: 0, rotation: 0, file: imgFile, sourceUrl: URL.createObjectURL(imgFile)
    };
    const newPages = [...pdfManagerPages];
    newPages.splice(insertIndexTarget, 0, newNode);
    setPdfManagerPages(newPages);
    setPdfManagerActiveId(newId);
    setPdfManagerUnsaved(true);
    if (insertImageInputRef.current) insertImageInputRef.current.value = '';
  };

  const handlePdfManagerInsertDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || insertIndexTarget === null) return;
    const docFile = e.target.files[0];
    const docId = `doc-${Date.now()}`;

    setProcessing(true); // show generic loader briefly
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await docFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      const newNodes: PdfManagerPage[] = Array.from({ length: count }).map((_, i) => ({
        id: `${docId}-${i}`, sourceId: docId, sourceType: 'doc', sourceLabel: docFile.name, originalIndex: i, rotation: 0, file: docFile
      }));

      const newPages = [...pdfManagerPages];
      newPages.splice(insertIndexTarget, 0, ...newNodes);
      setPdfManagerPages(newPages);
      if (newNodes.length > 0) setPdfManagerActiveId(newNodes[0].id);
      setPdfManagerUnsaved(true);

    } catch (err) {
      console.error(err); setError('Could not parse the inserted PDF.');
    } finally {
      setProcessing(false);
      if (insertDocInputRef.current) insertDocInputRef.current.value = '';
    }
  };

  const handlePdfManagerRotate = (direction: 'cw' | 'ccw') => {
    if (!pdfManagerActiveId) return;
    setPdfManagerPages(prev => prev.map(p => {
      if (p.id === pdfManagerActiveId) {
        let newRot = p.rotation + (direction === 'cw' ? 90 : -90);
        if (newRot >= 360) newRot -= 360;
        if (newRot <= -360) newRot += 360;
        return { ...p, rotation: newRot };
      }
      return p;
    }));
    setPdfManagerUnsaved(true);
  };

  const handlePdfManagerDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPages = pdfManagerPages.filter(p => p.id !== id);
    setPdfManagerPages(newPages);
    if (pdfManagerActiveId === id && newPages.length > 0) setPdfManagerActiveId(newPages[0].id);
    else if (newPages.length === 0) setPdfManagerActiveId(null);
    setPdfManagerUnsaved(true);
  };

  const handlePdfManagerDuplicate = (node: PdfManagerPage, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = pdfManagerPages.findIndex(p => p.id === node.id);
    if (idx === -1) return;
    const newNode = { ...node, id: `dup-${Date.now()}-${node.id}` };
    const newPages = [...pdfManagerPages];
    newPages.splice(idx + 1, 0, newNode);
    setPdfManagerPages(newPages);
    setPdfManagerUnsaved(true);
  };

  const handlePdfManagerExtract = async (node: PdfManagerPage) => {
    setProcessing(true);
    try {
      const result = await onProcess(file!, { pages: [node] });
      const dlUrl = URL.createObjectURL(result);
      const a = document.createElement('a');
      a.href = dlUrl; a.download = `extracted_page_${node.originalIndex + 1}.pdf`;
      a.click(); URL.revokeObjectURL(dlUrl);
    } catch (e: any) { setError('Failed to extract page.'); } finally { setProcessing(false); }
  };

  // ── Subtitle helpers ─────────────────────────────────────────────────────
  const handleSeekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => { });
      setCurrentTime(time);
      setIsVideoStarted(true);
    }
  };

  const handleSubtitleUpdate = (index: number, updated: { start: number; end: number; text: string }) => {
    setSubtitles(prev => prev.map((s, i) => i === index ? updated : s));
  };

  const handleExportSRT = () => {
    const pad = (n: number, d = 2) => String(Math.floor(n)).padStart(d, '0');
    const toSRTTime = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.round((s % 1) * 1000);
      return `${pad(h)}:${pad(m)}:${pad(sec)},${String(ms).padStart(3, '0')}`;
    };
    const srt = subtitles
      .map((s, i) => `${i + 1}\n${toSRTTime(s.start)} --> ${toSRTTime(s.end)}\n${s.text}`)
      .join('\n\n');
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^.]+$/, '') || 'subtitles'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Frame Extractor Single Frame Client Process ──────────────────────────
  const handleExtractSingleFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setResultUrl(URL.createObjectURL(blob));
        setResultSize(blob.size);
        setHasInitiated(true);
        setOptions({ ...options, format: 'png' });
      }
    }, 'image/png');
  };

  // ── Core process handler ─────────────────────────────────────────────────
  const handleProcess = async (overrideOptions?: any) => {
    const primaryFile = isPdfMultiInput ? (files[0] ?? null) : file;

    if (!primaryFile && tool.id !== 'text-to-speech') return;

    let processInput: File | File[] | string;
    if (tool.id === 'text-to-speech') {
      processInput = new File([textInput], 'speech.txt', { type: 'text/plain' });
    } else if (isPdfMultiInput) {
      processInput = files;
    } else {
      processInput = primaryFile!;
    }

    let pagesToRemove: number[] | undefined;
    if (isPdfRemovePage) {
      const selectedZeroIndexed = parsePdfPageInput(
        pdfManualText,
        pdfSelectedPages,
        pdfTotalPages,
      );

      if (pdfPageMode === 'delete') {
        pagesToRemove = selectedZeroIndexed;
      } else {
        const allIndices = Array.from({ length: pdfTotalPages }, (_, i) => i);
        pagesToRemove = allIndices.filter(i => !selectedZeroIndexed.includes(i));
      }

      if (!pagesToRemove || pagesToRemove.length === 0) {
        setError('Please select at least one page before running the processor.');
        return;
      }
    }

    const currentOptions = {
      ...options,
      ...overrideOptions,
      ...(isPdfRemovePage && { pagesToRemove }),
      ...(isPdfManager && { pages: pdfManagerPages })
    };

    setHasInitiated(true);
    setProcessing(true);
    setProgress(0);
    setError(null);

    if (tool.id === 'pdf-from-images' && files && files.length > 0) {
      try {
        setProgress(10);
        const { PDFDocument } = await import('pdf-lib');
        const newDoc = await PDFDocument.create();

        const convertToPng = async (fileToConvert: File): Promise<ArrayBuffer> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(fileToConvert);
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                URL.revokeObjectURL(objectUrl);
                return reject(new Error('Canvas context failed'));
              }
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                URL.revokeObjectURL(objectUrl);
                if (blob) {
                  blob.arrayBuffer().then(resolve).catch(reject);
                } else {
                  reject(new Error('Blob creation failed'));
                }
              }, 'image/png');
            };
            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              reject(new Error('Failed to parse image for fallback canvas conversion'));
            };
            img.src = objectUrl;
          });
        };

        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          let image;

          const fileName = f.name.toLowerCase();
          const isJpeg = f.type === 'image/jpeg' || f.type === 'image/jpg' || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
          const isPng = f.type === 'image/png' || fileName.endsWith('.png');

          try {
            if (isJpeg) {
              image = await newDoc.embedJpg(await f.arrayBuffer());
            } else if (isPng) {
              image = await newDoc.embedPng(await f.arrayBuffer());
            } else {
              throw new Error('Unsupported explicit format');
            }
          } catch (embedError) {
            console.warn(`[UniversalWorkspace] Native embed failed for ${f.name}. Falling back to canvas rasterization...`);
            const fallbackPngBuffer = await convertToPng(f);
            image = await newDoc.embedPng(fallbackPngBuffer);
          }

          const page = newDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
          setProgress(10 + Math.round(((i + 1) / files.length) * 70));
        }

        setProgress(90);
        const pdfBytes = await newDoc.save();
        setProgress(100);

        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize(blob.size);
      } catch (e: any) {
        console.error('[UniversalWorkspace] pdf-lib image to pdf failed:', e);
        setError(e.message || 'Image to PDF conversion failed');
        setHasInitiated(false);
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (isPdfRemovePage && primaryFile && pagesToRemove && pagesToRemove.length > 0) {
      try {
        setProgress(10);
        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await primaryFile.arrayBuffer();
        setProgress(30);
        const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const totalPageCount = srcDoc.getPageCount();
        setProgress(50);

        const newDoc = await PDFDocument.create();
        const keepIndices = Array.from({ length: totalPageCount }, (_, i) => i)
          .filter(i => !pagesToRemove!.includes(i));

        if (keepIndices.length === 0) {
          setError('Cannot remove all pages from the PDF. Please keep at least one page.');
          setProcessing(false);
          setHasInitiated(false);
          return;
        }

        const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
        copiedPages.forEach(page => newDoc.addPage(page));
        setProgress(80);

        const pdfBytes = await newDoc.save();
        setProgress(100);

        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize(blob.size);
      } catch (e: any) {
        console.error('[UniversalWorkspace] pdf-lib processing failed:', e);
        setError(e.message || 'PDF processing failed');
        setHasInitiated(false);
      } finally {
        setProcessing(false);
      }
      return;
    }

    if (tool.id === 'pdf-merger' && files && files.length > 0) {
      try {
        setProgress(10);
        const { PDFDocument } = await import('pdf-lib');
        const mergedDoc = await PDFDocument.create();

        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const arrayBuffer = await f.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const copiedPages = await mergedDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach(page => mergedDoc.addPage(page));
          setProgress(10 + Math.round(((i + 1) / files.length) * 70));
        }

        setProgress(90);
        const pdfBytes = await mergedDoc.save();
        setProgress(100);

        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize(blob.size);
      } catch (e: any) {
        console.error('[UniversalWorkspace] pdf-lib merge failed:', e);
        setError(e.message || 'PDF merging failed');
        setHasInitiated(false);
      } finally {
        setProcessing(false);
      }
      return;
    }

    try {
      const result = await onProcess(processInput, {
        ...currentOptions,
        onProgress: (p: any) => {
          const ratioValue = p && typeof p === 'object' ? p.ratio : p;
          setProgress(Math.round((ratioValue || 0) * 100));
        },
      });

      if (tool.id === 'auto-subtitle') {
        if (!result || !result.chunks || !Array.isArray(result.chunks)) {
          setError('Invalid subtitle format received');
          return;
        }
        const formattedSubtitles = result.chunks.map((c: any) => ({
          start: c.timestamp?.[0] || 0,
          end: c.timestamp?.[1] || (c.timestamp?.[0] || 0) + 2,
          text: c.text || '',
        }));
        setSubtitles(formattedSubtitles);
      } else if (tool.id === 'audio-splitter') {
        const stemUrls: Record<string, string> = {};
        Object.keys(result).forEach(key => {
          stemUrls[key] = URL.createObjectURL(result[key]);
        });
        setStems(stemUrls);
      } else if (tool.id === 'palette-generator') {
        const text = await result.text();
        const data = JSON.parse(text);
        if (data.palette) setPaletteColors(data.palette);
        setResultUrl(URL.createObjectURL(result));
      } else {
        setResultUrl(URL.createObjectURL(result));
        if (result.size) setResultSize(result.size);
      }
    } catch (e: any) {
      console.error('[UniversalWorkspace] onProcess rejected:', e);
      setError(e.message || 'Processing failed');
      setHasInitiated(false);
    } finally {
      setProcessing(false);
    }
  };

  // ── Colour palette ───────────────────────────────────────────────────────
  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // ── Remove-BG background composer ───────────────────────────────────────
  const applyBackground = async (fgUrl: string, bg: string | null, bgImageUrl: string | null) => {
    const fg = new Image();
    fg.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => { fg.onload = () => res(); fg.onerror = rej; fg.src = fgUrl; });
    const canvas = document.createElement('canvas');
    canvas.width = fg.width;
    canvas.height = fg.height;
    setResultDimensions({ w: fg.width, h: fg.height });
    const ctx = canvas.getContext('2d')!;
    if (bgImageUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => { bgImg.onload = () => res(); bgImg.onerror = rej; bgImg.src = bgImageUrl; });
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(fg, 0, 0);
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
    setCompositeUrl(URL.createObjectURL(blob));
  };

  useEffect(() => {
    if (!isRemoveBg || !resultUrl) return;
    if (selectedBgColor || customBgUrl) {
      applyBackground(resultUrl, selectedBgColor, customBgUrl);
    } else {
      setCompositeUrl(null);
      const img = new Image();
      img.onload = () => setResultDimensions({ w: img.width, h: img.height });
      img.src = resultUrl;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultUrl, selectedBgColor, customBgUrl]);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const handleSpeak = (voiceOverride?: SpeechSynthesisVoice, presetOverride?: string) => {
    if (!textInput) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textInput);
    if (voiceOverride) utterance.voice = voiceOverride;
    else if (activeVoice) utterance.voice = activeVoice;
    const currentPreset = presetOverride || options.preset;
    if (currentPreset === 'robot') { utterance.pitch = 0.5; utterance.rate = 0.8; }
    else if (currentPreset === 'chipmunk') { utterance.pitch = 2.0; }
    else { utterance.pitch = 1.0; utterance.rate = 1.0; }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const getVoice = (type: 'male' | 'female' | 'robot') => {
    if (type === 'robot') return availableVoices[0];
    const target = type === 'male' ? ['male', 'david', 'james'] : ['female', 'zira', 'samantha', 'google us'];
    return availableVoices.find(v => target.some(t => v.name.toLowerCase().includes(t))) || availableVoices[0];
  };

  // ── PDF page-grid handlers ───────────────────────────────────────────────
  const handlePdfManualTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfManualText(e.target.value);
    if (e.target.value) setPdfSelectedPages([]);
  };

  const handlePdfGridClick = (pageNum: number) => {
    setCurrentPdfPage(pageNum);
    if (pdfIframeRef.current) {
      const currentSrc = pdfIframeRef.current.src || '';
      const base = currentSrc.split('#')[0];
      if (base) pdfIframeRef.current.src = `${base}#toolbar=0&view=FitH&page=${pageNum}`;
    }
    setPdfSelectedPages(prev => {
      if (prev.includes(pageNum)) return prev.filter(p => p !== pageNum);
      return [...prev, pageNum].sort((a, b) => a - b);
    });
    if (pdfManualText) setPdfManualText('');
  };

  // ── Misc ─────────────────────────────────────────────────────────────────
  const isImage = file?.type.startsWith('image/') || tool.category === 'image';
  const getImageFormat = () => file ? file.type.split('/')[1]?.replace('jpeg', 'jpg') : '';
  const getAudioFormat = () => file ? file.name.split('.').pop()?.toLowerCase() || 'mp3' : '';

  const getFileInputAccept = () => {
    if (tool.id === 'pdf-from-images') return 'image/*';
    if (tool.id === 'pdf-merger' || tool.id === 'pdf-remove-page' || isPdfCompress || isPdfManager) return 'application/pdf';
    if (isPdfConverter) return '.pdf,.docx,.xlsx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    return undefined;
  };

  const SUPPORTED_PDF_IMG_FORMATS = ['png', 'jpg'];
  const SUPPORTED_IMG_FORMATS = ['png', 'jpg', 'webp', 'bmp'];
  const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'webm'];

  const STEM_CONFIG = [
    { id: 'vocals', icon: Mic2, color: 'text-cyan-400', label: 'Vocals', desc: 'Center Channel' },
    { id: 'music', icon: ListMusic, color: 'text-purple-400', label: 'Music', desc: 'Backing Track' },
    { id: 'bass', icon: Speaker, color: 'text-emerald-400', label: 'Bass', desc: 'Low Frequencies' },
    { id: 'drums', icon: Drum, color: 'text-orange-400', label: 'Drums', desc: 'Percussion' },
  ];

  const VOICE_PRESETS = [
    { id: 'chipmunk', label: 'Chipmunk', icon: Smile, color: 'text-orange-400' },
    { id: 'demon', label: 'Demon', icon: Ghost, color: 'text-red-500' },
    { id: 'robot', label: 'Robot', icon: Bot, color: 'text-cyan-400' },
    { id: 'telephone', label: 'Telephone', icon: Phone, color: 'text-yellow-400' },
    { id: 'cave', label: 'Cave', icon: Mountain, color: 'text-purple-400' },
  ];

  const showParams = !hasInitiated || isSplitter || isVoiceChanger || isTTS || isSubtitles || isPdfTool || isVideoBgRemover || isPdfManager;

  const activeSubtitle = isVideoStarted
    ? subtitles.find(s => currentTime >= s.start && currentTime <= s.end)
    : null;

  const isResultPdf = resultUrl && isPdfTool && !isPdfConverter && !isPdfManager;
  const isSourcePdf = !resultUrl && (file?.type === 'application/pdf' || (isPdfMultiInput && activeFile?.type === 'application/pdf')) && !isPdfManager;
  const displayAsPdf = isResultPdf || isSourcePdf;

  const activePageNode = isPdfManager ? pdfManagerPages.find(p => p.id === pdfManagerActiveId) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans overflow-hidden">

      <header className="ws-header flex-shrink-0 px-4 py-3 md:px-8 md:py-5 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="ws-icon w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-black fill-current" />
          </div>
          <div>
            <h1 className="text-sm md:text-xl font-black uppercase tracking-[0.15em] md:tracking-[0.25em] leading-none">{tool.name}</h1>
            <p className="text-[8px] md:text-[9px] text-cyan-500/80 font-bold tracking-[0.2em] uppercase mt-1 md:mt-1.5 italic">Engine V2.0 // Studio Ready</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* ── SIDEBAR ── */}
        <aside className={`ws-sidebar ${isSplitter ? 'w-full bg-[#050505] items-center' : 'w-full lg:w-[360px] bg-black/40 border-r border-white/5'} transition-all duration-500 p-4 md:p-8 flex flex-col z-10 shadow-2xl overflow-y-auto custom-scrollbar`}>
          <div className={`flex-1 space-y-6 md:space-y-8 ${isSplitter ? 'w-full max-w-4xl' : ''}`}>

            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <Settings className="w-3.5 h-3.5" /> {isSplitter ? 'Studio Console' : 'Parameters'}
            </h3>

            <AnimatePresence mode="wait">
              {showParams ? (
                <motion.div key="params" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">

                  {/* ── PDF PAGE MANAGER (Tree) UI ── */}
                  {isPdfManager && file && (
                    <div className="space-y-6">
                      {/* Top action bar */}
                      <div className="flex gap-2">
                        <button
                          disabled={processing || !pdfManagerUnsaved || pdfManagerPages.length === 0}
                          onClick={() => handleProcess()}
                          className="flex-1 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 transition-all disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          {processing ? 'Processing…' : 'Download Document'}
                        </button>
                        <button onClick={handleReset} className="px-5 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center" title="Start Over">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>

                      {resultUrl && !pdfManagerUnsaved && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                          <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Document downloaded successfully!</p>
                        </div>
                      )}

                      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 rounded-xl">{error}</div>}

                      {/* Visual Tree */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex justify-between mb-4">
                          <span>Document Structure</span>
                          <span className="text-[8px] font-bold flex items-center gap-1">
                            {pdfManagerActiveId ? (
                              <>
                                <span className="px-1 py-0.5 bg-white/10 rounded text-zinc-400">←→</span>
                                <span className="text-zinc-600">browse</span>
                                <span className="mx-1 text-zinc-700">·</span>
                                <span className="px-1 py-0.5 bg-white/10 rounded text-zinc-400">↑↓</span>
                                <span className="text-zinc-600">reorder</span>
                              </>
                            ) : (
                              <span className="text-zinc-600">{pdfManagerPages.length} Pages</span>
                            )}
                          </span>
                        </label>

                        <div className="max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                          <Reorder.Group axis="y" values={pdfManagerPages} onReorder={(newOrder) => { setPdfManagerPages(newOrder); setPdfManagerUnsaved(true); }} className="space-y-0 relative">
                            {pdfManagerPages.map((p, idx) => {
                              const isFirstOfGroup = idx === 0 || pdfManagerPages[idx - 1].sourceId !== p.sourceId;

                              return (
                                <React.Fragment key={p.id}>
                                  {/* Hover Insert Gap Top */}
                                  <div className="h-2 -my-1 relative z-10 group/insert cursor-pointer flex items-center justify-center">
                                    <div className="absolute inset-x-0 h-[2px] bg-cyan-500/0 group-hover/insert:bg-cyan-500/50 transition-colors" />
                                    <div className="absolute opacity-0 scale-90 group-hover/insert:opacity-100 group-hover/insert:scale-100 transition-all flex gap-1 bg-[#111] p-1 border border-cyan-500/50 rounded-lg shadow-xl z-50">
                                      <button onClick={() => handlePdfManagerInsertBlank(idx)} className="p-1.5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-wider text-zinc-300">Blank</button>
                                      <button onClick={() => { setInsertIndexTarget(idx); insertImageInputRef.current?.click(); }} className="p-1.5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-wider text-zinc-300">Image</button>
                                      <button onClick={() => { setInsertIndexTarget(idx); insertDocInputRef.current?.click(); }} className="p-1.5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-wider text-zinc-300">Doc</button>
                                    </div>
                                  </div>

                                  {isFirstOfGroup && (
                                    <div className="flex items-center gap-2 mb-1 mt-3 pl-1">
                                      {p.sourceType === 'main' || p.sourceType === 'doc' ? <FileText className="w-3 h-3 text-zinc-500" /> : p.sourceType === 'image' ? <ImageIcon className="w-3 h-3 text-emerald-500" /> : <Square className="w-3 h-3 text-zinc-500" />}
                                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">{p.sourceLabel}</span>
                                    </div>
                                  )}

                                  <Reorder.Item
                                    value={p}
                                    onClick={() => setPdfManagerActiveId(p.id)}
                                    dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
                                    whileDrag={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 50, opacity: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-grab active:cursor-grabbing mb-1
                                            ${pdfManagerActiveId === p.id ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-transparent hover:bg-white/10'}
                                         `}
                                  >
                                    <GripVertical className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                                    {p.sourceType === 'image' && p.sourceUrl ? (
                                      <div className={`w-5 h-7 border rounded flex-shrink-0 overflow-hidden ${pdfManagerActiveId === p.id ? 'border-cyan-500/50' : 'border-white/10'}`}>
                                        <div className="w-full h-full bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${p.sourceUrl})`, transform: `rotate(${p.rotation}deg)` }} />
                                      </div>
                                    ) : p.sourceType === 'blank' ? (
                                      <div className={`w-5 h-7 border rounded flex-shrink-0 flex items-center justify-center text-[9px] font-black ${pdfManagerActiveId === p.id ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/5' : 'border-white/10 text-zinc-500 bg-black'}`}>
                                        <span>+</span>
                                      </div>
                                    ) : null}
                                    <div className="flex-1 truncate pr-2">
                                      <p className={`text-[10px] font-bold ${pdfManagerActiveId === p.id ? 'text-white' : 'text-zinc-400'}`}>
                                        Page {p.sourceType === 'blank' ? 'Blank' : p.originalIndex + 1}
                                      </p>
                                      {p.rotation !== 0 && <p className="text-[8px] text-cyan-500 font-bold uppercase mt-0.5 tracking-wider">{p.rotation}° Rotated</p>}
                                    </div>

                                    <div className="flex gap-0.5 opacity-50 hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => handlePdfManagerDuplicate(p, e)} className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"><CopyPlus className="w-3.5 h-3.5" /></button>
                                      <button onClick={(e) => handlePdfManagerDelete(p.id, e)} className="p-1.5 hover:bg-red-500/20 rounded-md text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </Reorder.Item>

                                  {/* Final Gap at very end */}
                                  {idx === pdfManagerPages.length - 1 && (
                                    <div className="h-4 mt-1 relative z-10 group/insert cursor-pointer flex items-center justify-center">
                                      <div className="absolute inset-x-0 h-[2px] bg-cyan-500/0 group-hover/insert:bg-cyan-500/50 transition-colors" />
                                      <div className="absolute opacity-0 scale-90 group-hover/insert:opacity-100 group-hover/insert:scale-100 transition-all flex gap-1 bg-[#111] p-1 border border-cyan-500/50 rounded-lg shadow-xl z-50">
                                        <button onClick={() => handlePdfManagerInsertBlank(idx + 1)} className="p-1.5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-wider text-zinc-300">Blank</button>
                                        <button onClick={() => { setInsertIndexTarget(idx + 1); insertImageInputRef.current?.click(); }} className="p-1.5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-wider text-zinc-300">Image</button>
                                        <button onClick={() => { setInsertIndexTarget(idx + 1); insertDocInputRef.current?.click(); }} className="p-1.5 hover:bg-white/10 rounded text-[8px] font-bold uppercase tracking-wider text-zinc-300">Doc</button>
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            {pdfManagerPages.length === 0 && (
                              <div className="text-center py-8 opacity-50 text-[10px] font-black uppercase tracking-widest text-zinc-500 border border-dashed border-white/10 rounded-xl">Document Empty</div>
                            )}
                          </Reorder.Group>
                        </div>
                      </div>

                      {/* Hidden Inputs for tree insertions */}
                      <input ref={insertImageInputRef} type="file" accept="image/*" className="hidden" onChange={handlePdfManagerInsertImage} />
                      <input ref={insertDocInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfManagerInsertDoc} />
                    </div>
                  )}

                  {/* ── AUTO SUBTITLE PANEL ── */}
                  {isSubtitles && (
                    <div className="space-y-5">
                      {!subtitles.length && !processing && (
                        <button onClick={() => handleProcess()} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 transition-all">Generate Subtitles</button>
                      )}
                      {processing && (
                        <div className="text-center py-6 space-y-3">
                          <div className="w-8 h-8 mx-auto border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Transcribing...</p>
                        </div>
                      )}
                      {subtitles.length > 0 && (
                        <div className="space-y-4">
                          <button onClick={handleExportSRT} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all"><Download className="w-4 h-4" /> Export .SRT</button>
                          <button onClick={handleReset} className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all">Reset</button>
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Live Transcript</label>
                              <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Click to seek · ✏️ to edit</span>
                            </div>
                            <div className="max-h-[340px] overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                              {subtitles.map((s, i) => (
                                <TranscriptItem key={i} sub={s} index={i} isActive={isVideoStarted && currentTime >= s.start && currentTime <= s.end} onSeek={handleSeekTo} onUpdate={handleSubtitleUpdate} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PDF TOOLS: Run + Inline Result Render ── */}
                  {isPdfTool && file && !isPdfManager && (
                    <div className="space-y-4">
                      {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 font-bold mb-2">
                          {error}
                        </div>
                      )}

                      {/* ── PDF COMPRESS & FORMAT CHANGER: special lifecycle ── */}
                      {isPdfCompress || isPdfConverter ? (
                        <>
                          {!hasInitiated && (
                            <div className="flex gap-2">
                              <button
                                disabled={processing || (isPdfConverter && !options.format)}
                                onClick={() => handleProcess()}
                                className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-30 disabled:grayscale cursor-pointer flex items-center justify-center gap-2"
                              >
                                Run Processor
                              </button>
                              <button onClick={handleReset} className="px-5 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center" title="Start Over">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {hasInitiated && (
                            <div className="space-y-3">
                              {resultUrl ? (
                                (() => {
                                  const baseName = (file?.name || 'output').replace(/\.[^.]+$/, '');
                                  const fmt = options.format ?? 'pdf';
                                  const dlName = isPdfConverter ? `${baseName}_converted.${fmt}` : `${baseName}_compressed.pdf`;
                                  const dlLabel = isPdfConverter ? `Download .${fmt.toUpperCase()}` : 'Download Compressed PDF';
                                  return (
                                    <a
                                      href={resultUrl}
                                      download={dlName}
                                      className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
                                    >
                                      <Download className="w-4 h-4" /> {dlLabel}
                                    </a>
                                  )
                                })()
                              ) : (
                                <div className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed">
                                  {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                  {processing ? 'Processing…' : (isPdfConverter ? 'Waiting...' : 'Download Compressed PDF')}
                                </div>
                              )}
                              {resultUrl && (resultSize || resultSize === 0) && (
                                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    {formatBytes(file.size)} → <span className="text-emerald-400">{formatBytes(resultSize)}</span>
                                  </div>
                                  {!isPdfConverter && (
                                    <span className="text-[9px] font-black text-emerald-400 tracking-widest">
                                      {Math.round((1 - resultSize / file.size) * 100)}% smaller
                                    </span>
                                  )}
                                </div>
                              )}
                              <button
                                onClick={handleReset}
                                className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Redo
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* ── All other PDF tools: original Run + Download ── */
                        <>
                          <div className="flex gap-2">
                            <button
                              disabled={processing || (isPdfRemovePage && pdfDetecting)}
                              onClick={() => handleProcess()}
                              className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-30 disabled:grayscale cursor-pointer flex items-center justify-center gap-2"
                            >
                              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {processing ? 'Processing…' : 'Run Processor'}
                            </button>
                            <button onClick={handleReset} className="px-5 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center" title="Start Over">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>

                          {resultUrl && (() => {
                            const baseName = (file?.name || 'output').replace(/\.[^.]+$/, '');
                            const dlName = `${baseName}_processed.pdf`;
                            return (
                              <a
                                href={resultUrl}
                                download={dlName}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
                              >
                                <Download className="w-4 h-4" /> Download Result PDF
                              </a>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── PDF REMOVE PAGE UI ── */}
                  {isPdfRemovePage && file && (
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-3">Page Selection Strategy</label>
                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                          <button onClick={() => setPdfPageMode('delete')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${pdfPageMode === 'delete' ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'text-zinc-500 hover:text-white'}`}>Delete Pages</button>
                          <button onClick={() => setPdfPageMode('keep')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${pdfPageMode === 'keep' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-zinc-500 hover:text-white'}`}>Keep Pages</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Manual Entry</label>
                        <input
                          type="text"
                          value={pdfManualText}
                          onChange={handlePdfManualTextChange}
                          placeholder="e.g., 1, 3, 5-10"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-700"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                            Select Pages to {pdfPageMode}
                          </label>
                          {pdfDetecting ? (
                            <span className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                              <Loader2 className="w-3 h-3 animate-spin" /> Detecting…
                            </span>
                          ) : pdfTotalPages > 0 ? (
                            <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest">
                              <span className="text-cyan-400">pg {currentPdfPage}</span>
                              <span className="text-zinc-700">/</span>
                              <span className="text-zinc-500">{pdfTotalPages}</span>
                            </span>
                          ) : null}
                        </div>

                        {pdfDetecting ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                          </div>
                        ) : pdfTotalPages > 0 ? (
                          <div ref={pdfGridRef} className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 pt-1">
                            {Array.from({ length: pdfTotalPages }).map((_, i) => {
                              const pageNum = i + 1;
                              const isSelected = pdfSelectedPages.includes(pageNum);
                              const isCurrent = currentPdfPage === pageNum;
                              return (
                                <button
                                  key={i}
                                  data-gridpage={pageNum}
                                  onClick={() => handlePdfGridClick(pageNum)}
                                  className={`py-2 border-2 rounded-lg text-[10px] font-black font-mono transition-all flex flex-col items-center justify-center gap-0.5 relative
                                    ${isCurrent
                                      ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] bg-cyan-500/10 text-cyan-300'
                                      : isSelected
                                        ? pdfPageMode === 'delete'
                                          ? 'border-red-500/60 bg-red-500/20 text-red-400'
                                          : 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                                        : 'border-white/10 bg-white/5 text-zinc-500 hover:text-white hover:border-white/30'
                                    }
                                  `}
                                >
                                  {isSelected && (
                                    <Check className={`w-2.5 h-2.5 ${isCurrent ? 'text-cyan-400' : ''}`} />
                                  )}
                                  <span>{pageNum}</span>
                                  {isCurrent && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* ── PDF MULTIPLE INPUT UI (drag-to-reorder) ── */}
                  {isPdfMultiInput && files.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex justify-between">
                        <span>Input Files ({files.length})</span>
                        <span className="text-[8px] text-zinc-600">Drag to reorder</span>
                      </label>

                      <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
                        {files.map((f) => (
                          <Reorder.Item
                            key={`${f.name}-${f.lastModified}-${f.size}`}
                            value={f}
                            onClick={() => { setActiveFile(f); setPreviewUrl(URL.createObjectURL(f)); }}
                            className={`p-3 border rounded-xl flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all ${activeFile === f ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                          >
                            <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                            <FileIcon className={`w-4 h-4 flex-shrink-0 ${activeFile === f ? 'text-cyan-400' : 'text-zinc-500'}`} />
                            <div className="flex-1 overflow-hidden">
                              <p className={`text-[10px] font-bold truncate ${activeFile === f ? 'text-cyan-400' : 'text-zinc-300'}`}>{f.name}</p>
                            </div>
                            <button onClick={(e) => handleRemoveFile(f, e)} className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors ml-auto flex-shrink-0 cursor-pointer" title="Remove file">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>

                      <button onClick={() => addFileInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 mt-2">
                        <Plus className="w-3.5 h-3.5" /> Add More Files
                      </button>
                      <input ref={addFileInputRef} type="file" multiple accept={getFileInputAccept()} className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files, true)} />
                    </div>
                  )}

                  {/* ── PDF COMPRESS UI ── */}
                  {isPdfCompress && file && !hasInitiated && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-1">
                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Current Size</div>
                        <div className="text-sm font-black text-white font-mono ml-auto">{formatBytes(file.size)}</div>
                      </div>
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Target File Size (MB)</label>
                      <input
                        type="number"
                        placeholder="MB..."
                        value={options.targetSize || ''}
                        onChange={(e) => setOptions({ ...options, targetSize: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-700"
                      />
                    </div>
                  )}

                  {/* ── FILE FORMAT CHANGER UI ── */}
                  {isPdfConverter && file && !hasInitiated && (() => {
                    const ext = file.name.split('.').pop()?.toLowerCase() || '';
                    const isUnsupported = !['pdf', 'docx', 'pptx', 'xlsx'].includes(ext);

                    const FORMAT_META: Record<string, { label: string; sub: string; color: string; bg: string }> = {
                      pdf: { label: 'PDF', sub: 'Document', color: 'text-red-400', bg: 'bg-red-500/10' },
                      docx: { label: 'Word', sub: '.docx', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      xlsx: { label: 'Excel', sub: '.xlsx', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      pptx: { label: 'PowerPoint', sub: '.pptx', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    };

                    const srcMeta = FORMAT_META[ext] || { label: ext.toUpperCase(), sub: 'Unknown', color: 'text-zinc-400', bg: 'bg-white/5' };
                    const targets = ['pdf', 'docx', 'xlsx', 'pptx'].filter(f => f !== ext);

                    return (
                      <div className="space-y-5">
                        <div className={`flex items-center gap-3 p-3 ${srcMeta.bg} border border-white/10 rounded-xl`}>
                          <FileType className={`w-5 h-5 flex-shrink-0 ${srcMeta.color}`} />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Source Format</p>
                            <p className={`text-sm font-black ${srcMeta.color}`}>{srcMeta.label}</p>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">File Size</p>
                            <p className="text-xs font-bold text-white">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>

                        {isUnsupported ? (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 font-bold">
                            Unsupported file type. Please upload a PDF, DOCX, PPTX, or XLSX file.
                          </div>
                        ) : (
                          <div>
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-3">
                              Convert To
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {targets.map((fmt) => {
                                const meta = FORMAT_META[fmt];
                                const isSelected = options.format === fmt;
                                return (
                                  <button
                                    key={fmt}
                                    onClick={() => setOptions({ ...options, format: fmt })}
                                    className={`py-4 px-2 border rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${isSelected
                                      ? `${meta.bg} border-current ${meta.color} shadow-[0_0_12px_rgba(0,0,0,0.3)]`
                                      : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:border-white/20'
                                      }`}
                                  >
                                    <FileType className={`w-4 h-4 ${isSelected ? meta.color : 'text-zinc-500'}`} />
                                    <span className={`text-[11px] font-black leading-none ${isSelected ? meta.color : ''}`}>{meta.label}</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-wide ${isSelected ? 'opacity-80' : 'opacity-40'}`}>{meta.sub}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {!options.format && (
                              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-3">
                                Select a target format above
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── VIDEO BG REMOVER UI — pre-run state ── */}
                  {isVideoBgRemover && file && !hasInitiated && (
                    <div className="space-y-4 mt-4">
                      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-bold leading-relaxed tracking-wide">
                        <span className="text-white uppercase">Note:</span> High-quality AI video matting is hardware intensive. Processing 10 seconds of video may take 1–3 minutes depending on your GPU.
                      </div>
                      <button
                        disabled={!file || processing}
                        onClick={() => handleProcess()}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-20 disabled:grayscale cursor-pointer"
                      >
                        Run Video Processor
                      </button>
                    </div>
                  )}

                  {/* ── FRAME EXTRACTOR UI ── */}
                  {isFrameExtractor && file && !hasInitiated && (
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-3">Extraction Mode</label>
                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                          <button onClick={() => setOptions({ ...options, frameMode: 'single' })} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${options.frameMode === 'single' || !options.frameMode ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'text-zinc-500 hover:text-white'}`}>Single Frame</button>
                          <button onClick={() => setOptions({ ...options, frameMode: 'multiple' })} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${options.frameMode === 'multiple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'text-zinc-500 hover:text-white'}`}>Batch Extract</button>
                        </div>
                      </div>

                      {(!options.frameMode || options.frameMode === 'single') ? (
                        <div className="space-y-4">
                          <p className="text-[10px] text-zinc-400 leading-relaxed">Scrub through the video player on the right, pause at the exact moment you want to capture, and click extract.</p>
                          <button onClick={handleExtractSingleFrame} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Extract Current Frame
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Number of Frames</label>
                            <input type="number" min="2" max="100" placeholder="10" value={options.frameCount || ''} onChange={(e) => setOptions({ ...options, frameCount: parseInt(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Start Time (s)</label>
                              <div className="flex gap-2">
                                <input type="number" step="0.1" value={options.startTime ?? 0} onChange={(e) => setOptions({ ...options, startTime: parseFloat(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all" />
                                <button onClick={() => setOptions({ ...options, startTime: currentTime })} className="px-2 bg-white/10 rounded-lg hover:bg-white/20 text-[10px] font-bold text-zinc-300 transition-colors">Set</button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">End Time (s)</label>
                              <div className="flex gap-2">
                                <input type="number" step="0.1" value={options.endTime ?? (videoRef.current?.duration || 0).toFixed(1)} onChange={(e) => setOptions({ ...options, endTime: parseFloat(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all" />
                                <button onClick={() => setOptions({ ...options, endTime: currentTime })} className="px-2 bg-white/10 rounded-lg hover:bg-white/20 text-[10px] font-bold text-zinc-300 transition-colors">Set</button>
                              </div>
                            </div>
                          </div>
                          <button disabled={processing} onClick={() => { setOptions({ ...options, format: 'zip' }); handleProcess(); }} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2">
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                            {processing ? 'Extracting...' : `Extract ${options.frameCount || 10} Frames`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── GENERIC TOOL OPTIONS ── */}
                  {!isSplitter && !isVoiceChanger && !isTTS && !isSubtitles && !isPdfTool && !isFrameExtractor && (
                    <>
                      {tool.id === 'video-compressor' && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Target Size (MB)</label>
                          <input type="number" placeholder="MB..." value={options.targetSize} onChange={(e) => setOptions({ ...options, targetSize: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-700" />
                        </div>
                      )}
                      {tool.id === 'image-converter' && (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Convert To</label>
                          <div className="grid grid-cols-2 gap-3">
                            {SUPPORTED_IMG_FORMATS.map((fmt) => (
                              <button key={fmt} disabled={!file || getImageFormat() === fmt} onClick={() => { setOptions({ ...options, format: fmt }); handleProcess({ format: fmt }); }} className={`py-4 border rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${(!file || getImageFormat() === fmt) ? 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed opacity-50' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer'}`}>
                                <FileType className="w-3 h-3" /> {fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {tool.id === 'audio-converter' && (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Convert Audio To</label>
                          <div className="grid grid-cols-2 gap-3">
                            {SUPPORTED_AUDIO_FORMATS.map((fmt) => (
                              <button key={fmt} disabled={!file || getAudioFormat() === fmt} onClick={() => { setOptions({ ...options, format: fmt }); handleProcess({ format: fmt }); }} className={`py-4 border rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${(!file || getAudioFormat() === fmt) ? 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed opacity-50' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer'}`}>
                                <Mic2 className="w-3 h-3" /> {fmt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {tool.id === 'ai-upscale' && (
                        <div className="space-y-6">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4 block">Upscale Factor</label>
                          <div className="grid grid-cols-2 gap-4">
                            {[2, 4].map((scale) => (
                              <button key={scale} disabled={!file} onClick={() => { setOptions({ ...options, scale }); handleProcess({ scale }); }} className={`py-6 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${!file ? 'bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed' : 'bg-white/5 border-white/10 hover:border-cyan-500 hover:bg-cyan-500/10'}`}>
                                <span className="text-2xl font-black italic">{scale}x</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {tool.id === 'photo-restore' && (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-2">Restoration Options</label>
                          <div onClick={() => file && setOptions({ ...options, colorize: !options.colorize })} className={`p-4 border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${!file ? 'opacity-50 pointer-events-none border-white/5' : options.colorize ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${options.colorize ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-600'}`}>
                              {options.colorize && <Check className="w-3 h-3 text-black stroke-[4]" />}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider">Colorize</h4>
                          </div>
                          <div onClick={() => file && setOptions({ ...options, repair: !options.repair })} className={`p-4 border rounded-xl flex items-center gap-4 cursor-pointer transition-all ${!file ? 'opacity-50 pointer-events-none border-white/5' : options.repair ? 'bg-purple-500/10 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${options.repair ? 'bg-purple-500 border-purple-500' : 'border-zinc-600'}`}>
                              {options.repair && <Check className="w-3 h-3 text-black stroke-[4]" />}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider">Repair</h4>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── TEXT TO SPEECH UI ── */}
                  {isTTS && (
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Select Voice</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button onClick={() => { const v = getVoice('male'); setOptions({ ...options, preset: 'male' }); setActiveVoice(v); handleSpeak(v, 'male'); }} className={`p-4 border rounded-xl flex items-center gap-4 transition-all hover:bg-white/5 ${options.preset === 'male' ? 'bg-white/10 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400"><User className="w-5 h-5" /></div>
                          <div className="text-left"><h4 className="text-xs font-bold uppercase tracking-widest">Male</h4><p className="text-[9px] text-zinc-500">Standard Tone</p></div>
                          {isSpeaking && options.preset === 'male' && <div className="ml-auto"><div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" /></div>}
                        </button>
                        <button onClick={() => { const v = getVoice('female'); setOptions({ ...options, preset: 'female' }); setActiveVoice(v); handleSpeak(v, 'female'); }} className={`p-4 border rounded-xl flex items-center gap-4 transition-all hover:bg-white/5 ${options.preset === 'female' ? 'bg-white/10 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><UserCheck className="w-5 h-5" /></div>
                          <div className="text-left"><h4 className="text-xs font-bold uppercase tracking-widest">Female</h4><p className="text-[9px] text-zinc-500">Soft Tone</p></div>
                          {isSpeaking && options.preset === 'female' && <div className="ml-auto"><div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" /></div>}
                        </button>
                        <button onClick={() => { const v = getVoice('robot'); setOptions({ ...options, preset: 'robot' }); setActiveVoice(v); handleSpeak(v, 'robot'); }} className={`p-4 border rounded-xl flex items-center gap-4 transition-all hover:bg-white/5 ${options.preset === 'robot' ? 'bg-white/10 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Bot className="w-5 h-5" /></div>
                          <div className="text-left"><h4 className="text-xs font-bold uppercase tracking-widest">Robot</h4><p className="text-[9px] text-zinc-500">Synthesized</p></div>
                          {isSpeaking && options.preset === 'robot' && <div className="ml-auto"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /></div>}
                        </button>
                      </div>
                      {isSpeaking && (
                        <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} className="w-full py-4 border border-red-500/30 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/10 transition-all mt-4">
                          <Pause className="w-3.5 h-3.5" /> Stop Speaking
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── VOICE CHANGER UI ── */}
                  {isVoiceChanger && (
                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Select Character</label>
                      <div className="grid grid-cols-2 gap-3">
                        {VOICE_PRESETS.map((preset) => (
                          <button key={preset.id} disabled={!file || (processing && options.preset === preset.id)} onClick={() => { setOptions({ ...options, preset: preset.id }); handleProcess({ preset: preset.id }); }} className={`py-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden ${!file ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5' : options.preset === preset.id ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 text-zinc-400'}`}>
                            <preset.icon className={`w-6 h-6 ${options.preset === preset.id ? 'text-black' : preset.color}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{preset.label}</span>
                            {processing && options.preset === preset.id && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── AUDIO SPLITTER UI ── */}
                  {isSplitter && (
                    <div className="space-y-6">
                      {!file && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`w-full aspect-[4/1] border rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all ${isDragging
                            ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]'
                            : 'border-white/5 bg-white/[0.01] hover:bg-white/5'
                            }`}
                        >
                          <Upload className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 group-hover:text-cyan-400 transition-colors">
                            {isDragging ? 'Drop Audio Here' : 'Select Audio File'}
                          </p>
                          <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => e.target.files && handleFileSelect(e.target.files)} className="hidden" />
                        </div>
                      )}
                      {file && (
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-500"><Music2 className="w-5 h-5" /></div>
                            <div>
                              <p className="text-xs font-bold text-white max-w-[200px] truncate">{file.name}</p>
                              <p className="text-[10px] text-zinc-500 font-mono mt-1">{formatBytes(file.size)}</p>
                            </div>
                          </div>
                          {!processing && !stems && (
                            <button onClick={handleReset} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      )}
                      {file && (
                        <>
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mt-8">Separated Tracks</label>
                          <div className="grid grid-cols-1 gap-4">
                            {STEM_CONFIG.map((stem) => {
                              const isReady = stems && stems[stem.id];
                              const isPlaying = playingStem === stem.id;
                              return (
                                <motion.div layout key={stem.id} className={`border rounded-xl transition-all overflow-hidden relative ${isReady ? 'bg-white/5 border-white/20' : 'bg-transparent border-white/10'}`} style={{ opacity: !isReady && processing ? 0.5 : 1 }}>
                                  <div className="p-4 flex items-center gap-4 h-20">
                                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${!isReady ? 'grayscale opacity-50' : ''}`}>
                                      <stem.icon className={`w-6 h-6 ${stem.color}`} />
                                    </div>
                                    {isReady ? (
                                      <div className="flex-1 flex items-center justify-between w-full">
                                        <div className="mr-6 hidden sm:block min-w-[80px]">
                                          <h4 className="text-sm font-black uppercase tracking-widest text-white">{stem.label}</h4>
                                        </div>
                                        <WaveformPlayer src={stems[stem.id]} color={stem.color} isPlaying={isPlaying} onTogglePlay={() => setPlayingStem(isPlaying ? null : stem.id)} />
                                      </div>
                                    ) : (
                                      <div className="flex-1 opacity-50">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-white">{stem.label}</h4>
                                        <p className="text-[10px] text-zinc-500">{stem.desc}</p>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── ACTION BUTTONS (non-PDF, non-special) ── */}
                  {!isSplitter && !isVoiceChanger && !isTTS && !isSubtitles && !isPdfTool && !isVideoBgRemover && !isFrameExtractor && (
                    <button disabled={!file} onClick={() => handleProcess()} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-20 disabled:grayscale cursor-pointer">Run Processor</button>
                  )}
                  {isSplitter && !stems && !processing && (
                    <button disabled={!file} onClick={() => handleProcess()} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-cyan-400 hover:scale-[1.01] shadow-xl transition-all disabled:opacity-20 disabled:grayscale cursor-pointer mt-8">Run Audio Splitter</button>
                  )}

                </motion.div>
              ) : (
                <motion.div key="actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`space-y-4 transition-all duration-500 ${processing ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                  {isVideoBgRemover ? (
                    <div className="space-y-4">
                      <a
                        href={resultUrl || '#'}
                        download={`${(file?.name || 'output').replace(/\.[^.]+$/, '')}_no-bg.webm`}
                        className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-3 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {processing ? 'Processing Video...' : 'Download Video'}
                      </a>
                      <button
                        onClick={handleReset}
                        className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition-all"
                      >
                        <RotateCcw className="w-4 h-4" /> Start Over
                      </button>
                    </div>
                  ) : isPaletteGenerator ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        {paletteColors.map((color, idx) => (
                          <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 group hover:border-white/20 transition-all">
                            <div className="w-10 h-10 rounded-lg shadow-inner" style={{ backgroundColor: color }} />
                            <div className="flex-1"><p className="text-sm font-bold font-mono tracking-wider">{color}</p></div>
                            <button onClick={() => handleCopyColor(color)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors relative">{copiedColor === color ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
                          </motion.div>
                        ))}
                      </div>
                      <a href={resultUrl || '#'} download="palette.json" className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download JSON</a>
                    </div>
                  ) : isRemoveBg ? (
                    <div className="space-y-5">
                      <a
                        href={compositeUrl || resultUrl || '#'}
                        download="removed-bg.png"
                        className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-3 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                      >
                        <Download className="w-4 h-4" /> Download PNG
                      </a>
                      <button onClick={handleReset} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition-all"><RotateCcw className="w-4 h-4" /> Redo</button>

                      {/* Solid color palette */}
                      <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Background Color</p>
                        <div className="grid grid-cols-6 gap-2">
                          {['transparent', '#ffffff', '#000000', '#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c', '#94a3b8', '#1e293b'].map((c) => {
                            const isTransparent = c === 'transparent';
                            const isActive = isTransparent ? (!selectedBgColor && !customBgUrl) : (selectedBgColor === c);

                            return (
                              <button
                                key={c}
                                onClick={() => {
                                  setSelectedBgColor(isTransparent ? null : (selectedBgColor === c ? null : c));
                                  setCustomBgUrl(null);
                                }}
                                className="w-full aspect-square rounded-lg border-2 transition-all relative overflow-hidden flex items-center justify-center bg-white/5"
                                style={{
                                  backgroundColor: isTransparent ? 'transparent' : c,
                                  borderColor: isActive ? '#22d3ee' : 'transparent',
                                  boxShadow: isActive ? '0 0 0 2px rgba(6,182,212,0.4)' : 'none',
                                  ...(isTransparent && {
                                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05)), repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0.05))',
                                    backgroundPosition: '0 0, 4px 4px',
                                    backgroundSize: '8px 8px'
                                  })
                                }}
                                title={isTransparent ? 'Transparent' : c}
                              >
                                {isTransparent && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-5 h-[2px] bg-red-500/80 -rotate-45 rounded-full" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom BG image upload */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Custom Background Image</p>
                        <button
                          onClick={() => customBgInputRef.current?.click()}
                          className="w-full py-3 border border-dashed border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" /> {customBgUrl ? 'Change Image' : 'Upload BG Image'}
                        </button>
                        {customBgUrl && (
                          <div className="flex items-center gap-2">
                            <img src={customBgUrl} className="w-12 h-8 object-cover rounded-lg border border-white/10" alt="Custom BG" />
                            <button onClick={() => { setCustomBgUrl(null); setSelectedBgColor(null); }} className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest">Remove</button>
                          </div>
                        )}
                        <input
                          ref={customBgInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) { setCustomBgUrl(URL.createObjectURL(f)); setSelectedBgColor(null); }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <a href={resultUrl || '#'} download={resultUrl ? `result.${options.format || 'file'}` : undefined} className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-3 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"><Download className="w-4 h-4" /> Download Result</a>
                  )}
                  {!isRemoveBg && !isVideoBgRemover && (
                    <button onClick={handleReset} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 hover:text-white transition-all"><RotateCcw className="w-4 h-4" /> Start Over</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* ── MAIN PREVIEW AREA ── */}
        {!isSplitter && (
          <main className={`ws-main flex-1 relative flex flex-col items-center justify-center ${isPdfTool ? 'p-2 md:p-4' : 'p-3 md:p-8'} bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02)_0%,_transparent_70%)]`}>

            {isTTS ? (
              <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl">
                <div className="w-full relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative w-full bg-black border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Script Input</span>
                      <span className="text-[10px] font-black uppercase text-cyan-500 tracking-widest">{textInput.length} chars</span>
                    </div>
                    <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type something here to convert to speech..." className="ws-tts-textarea w-full h-[200px] md:h-[400px] bg-transparent text-base md:text-xl font-medium text-white placeholder:text-zinc-700 focus:outline-none resize-none custom-scrollbar" />
                  </div>
                </div>
              </div>
            ) : (
              !file ? (
                <div className="w-full max-w-2xl flex flex-col items-center gap-6 z-10">
                  {/* MAIN DROPZONE */}
                  <motion.div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    whileHover={{ scale: 1.01, borderColor: 'rgba(6,182,212,0.4)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    className={`ws-dropzone w-full py-8 md:py-16 border rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-3 md:gap-5 cursor-pointer group transition-all duration-500 shadow-2xl relative overflow-hidden ${isDragging
                      ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02]'
                      : 'border-white/5 bg-white/[0.01]'
                      }`}
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                      {isPdfMultiInput ? <Layers className="w-6 h-6 md:w-8 md:h-8 text-zinc-500 group-hover:text-cyan-400 transition-colors" /> : <Upload className="w-6 h-6 md:w-8 md:h-8 text-zinc-500 group-hover:text-cyan-400 transition-colors" />}
                    </div>
                    <div className="text-center space-y-1.5 pointer-events-none">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 group-hover:text-cyan-400 transition-colors">
                        {isDragging ? 'Drop Media Here' : `Import ${isPdfMultiInput ? 'Multiple Files' : 'Source Media'}`}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                        {isDragging ? 'Release to upload' : 'Drag & Drop, Paste (Ctrl+V) or Click to Browse'}
                      </p>
                    </div>
                    <input ref={fileInputRef} type="file" multiple={isPdfMultiInput ? true : undefined} accept={getFileInputAccept()} className="hidden" onChange={(e) => e.target.files && handleFileSelect(e.target.files)} />
                  </motion.div>

                  {/* DIVIDER */}
                  {tool.category === 'image' && (
                    <div className="flex items-center w-full max-w-sm gap-4 opacity-40">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/50"></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Or</span>
                      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/50"></div>
                    </div>
                  )}

                  {/* URL INPUT BAR */}
                  {tool.category === 'image' && (
                    <form onSubmit={handleUrlSubmit} className="w-full max-w-xl relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                      <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl focus-within:border-cyan-500/50 focus-within:bg-black/60 transition-all shadow-xl">
                        <input
                          type="url"
                          placeholder="Paste image URL here..."
                          value={imageUrlInput}
                          onChange={(e) => {
                            setImageUrlInput(e.target.value);
                            setUrlError(null);
                          }}
                          className="flex-1 bg-transparent px-6 py-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none"
                        />
                        <div className="pr-2">
                          <button
                            type="submit"
                            disabled={!imageUrlInput || isFetchingUrl}
                            className="px-6 py-2.5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-cyan-400 transition-all disabled:opacity-20 flex items-center justify-center min-w-[110px] gap-2"
                          >
                            {isFetchingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : 'Load URL'}
                          </button>
                        </div>
                      </div>
                      {urlError && (
                        <p className="absolute -bottom-7 left-0 w-full text-center text-[10px] text-red-400 font-bold uppercase tracking-widest bg-black/50 py-1 rounded-lg">
                          {urlError}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                <div className={`w-full h-full flex flex-col items-center ${isPdfTool ? 'max-w-[95%]' : 'max-w-5xl'}`}>

                  {/* Metadata bar - per-tool */}
                  {!shouldHideMetadata && !isPdfTool && (
                    <div className="w-full flex justify-between mb-6 px-4">
                      <div className="flex gap-3 flex-wrap">
                        {isExifRemover && (
                          <>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mr-3">Input</span>
                              <span className="text-xs font-bold">{formatBytes(file.size)}</span>
                            </div>
                            {resultSize != null && (
                              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mr-3">Output</span>
                                <span className="text-xs font-bold text-cyan-400">{formatBytes(resultSize)}</span>
                              </div>
                            )}
                          </>
                        )}

                        {isImageConverter && (
                          <>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm flex items-center gap-3">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Input</span>
                              <span className="text-xs font-bold">{formatBytes(file.size)}</span>
                              <span className="text-zinc-700">·</span>
                              <span className="text-xs font-bold uppercase text-zinc-400">{(file.type.split('/')[1]?.replace('jpeg', 'jpg') || file.name.split('.').pop() || '—').toUpperCase()}</span>
                            </div>
                            {resultUrl && resultSize != null && (
                              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-3">
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">Output</span>
                                <span className="text-xs font-bold text-cyan-400">{formatBytes(resultSize)}</span>
                                <span className="text-cyan-700">·</span>
                                <span className="text-xs font-bold text-cyan-400 uppercase">{(options.format || 'file').toUpperCase()}</span>
                              </div>
                            )}
                          </>
                        )}

                        {isAiUpscale && (
                          <>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mr-3">Input</span>
                              <span className="text-xs font-bold">{formatBytes(file.size)}</span>
                              {imgDimensions && (
                                <span className="ml-3 text-[9px] text-zinc-400 border-l border-white/10 pl-3">{imgDimensions.w} × {imgDimensions.h}</span>
                              )}
                            </div>
                            {resultSize != null && (
                              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mr-3">Output</span>
                                <span className="text-xs font-bold text-cyan-400">{formatBytes(resultSize)}</span>
                                {imgDimensions && options.scale && (
                                  <span className="ml-3 text-[9px] text-cyan-400/70 border-l border-cyan-500/20 pl-3">{imgDimensions.w * options.scale} × {imgDimensions.h * options.scale}</span>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {!isExifRemover && !isImageConverter && !isAiUpscale && (
                          <>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mr-3">Input</span>
                              <span className="text-xs font-bold">{isPdfMultiInput && activeFile ? formatBytes(activeFile.size) : formatBytes(file.size)}</span>
                              {imgDimensions && (
                                <span className="ml-3 text-[9px] text-zinc-500 uppercase tracking-widest border-l border-white/10 pl-3 hidden md:inline">{imgDimensions.w} x {imgDimensions.h}</span>
                              )}
                            </div>
                            {resultSize != null && (
                              <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mr-3">Output</span>
                                <span className="text-xs font-bold text-cyan-400">{formatBytes(resultSize)}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className={`flex-1 w-full relative flex items-center justify-center ${isPdfTool ? 'rounded-2xl overflow-hidden bg-zinc-900 border border-white/10' : 'rounded-[2.5rem] bg-black border border-white/5 shadow-2xl overflow-hidden'}`}>
                    <div className={`w-full h-full flex items-center justify-center transition-all duration-700 ${processing ? 'blur-xl scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'}`}>

                      {/* ── PDF MANAGER INDIVIDUAL PAGE RENDER ── */}
                      {isPdfManager && activePageNode ? (
                        <div className="w-full h-full flex flex-col relative">
                          {/* Active Page Preview Canvas */}
                          <div className="flex-1 p-6 flex items-center justify-center bg-zinc-900/80 overflow-hidden checker-bg">
                            {activePageNode.sourceType === 'blank' ? (
                              <div className="bg-white shadow-2xl" style={{ width: '60%', height: '80%', transform: `rotate(${activePageNode.rotation}deg)`, transition: 'transform 0.3s ease' }} />
                            ) : (
                              <PdfSinglePageCanvas
                                key={activePageNode.id}
                                srcFile={null}
                                pageIndex={activePageNode.originalIndex}
                                rotation={activePageNode.rotation}
                                fileObject={activePageNode.sourceType === 'main' ? (file ?? undefined) : activePageNode.file}
                                sourceUrl={activePageNode.sourceUrl}
                              />
                            )}
                          </div>

                          {/* Page Controls Toolbar */}
                          <div className="ws-page-toolbar absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 p-1.5 md:p-2 rounded-xl md:rounded-2xl flex flex-wrap justify-center gap-1 md:gap-2 shadow-2xl max-w-[calc(100%-24px)]">
                            <button onClick={() => handlePdfManagerRotate('ccw')} className="px-2 md:px-4 py-1.5 md:py-2 hover:bg-white/10 rounded-lg md:rounded-xl flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors">
                              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">Rotate </span>Left
                            </button>
                            <div className="w-px bg-white/10 hidden md:block"></div>
                            <button onClick={() => handlePdfManagerRotate('cw')} className="px-2 md:px-4 py-1.5 md:py-2 hover:bg-white/10 rounded-lg md:rounded-xl flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors">
                              <span className="hidden sm:inline">Rotate </span>Right <RotateCw className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <div className="w-px bg-white/10 hidden md:block"></div>
                            <button onClick={() => handlePdfManagerExtract(activePageNode)} className="px-2 md:px-4 py-1.5 md:py-2 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg md:rounded-xl flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors">
                              <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" /> Extract
                            </button>
                          </div>
                        </div>
                      ) : tool.category === 'audio' || resultUrl?.endsWith('.mp3') || resultUrl?.endsWith('.wav') ? (
                        <div className="ws-audio-box bg-white/5 p-6 md:p-12 rounded-2xl md:rounded-3xl border border-white/10 w-full md:w-3/4 text-center">
                          <audio src={resultUrl || previewUrl!} controls className="w-full" />
                        </div>
                      ) : (
                        (displayAsPdf || (!isImage && !resultUrl?.endsWith('.png') && !resultUrl?.endsWith('.jpg') && options.format !== 'zip' && options.format !== 'png')) ? (
                          <div className={isPdfTool ? 'ws-pdf-canvas relative h-[50vh] md:h-[85vh] aspect-[1/1.414] max-w-full rounded-2xl overflow-hidden bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10' : 'relative w-full h-full flex items-center justify-center'}>
                            {displayAsPdf ? (
                              isPdfRemovePage && !resultUrl ? (
                                <iframe
                                  ref={pdfIframeRef}
                                  src={`${resultUrl || previewUrl!}#toolbar=0&view=FitH`}
                                  className="w-full h-full border-0"
                                  title="PDF Preview"
                                />
                              ) : (
                                <iframe src={`${resultUrl || previewUrl!}#toolbar=0`} className="w-full h-full border-0" />
                              )
                            ) : isPdfConverter && !['pdf'].includes(options?.format || '') ? (
                              <div className="flex flex-col items-center justify-center h-full w-full text-zinc-500 bg-white/5 rounded-2xl border border-white/10 p-8">
                                {(() => {
                                  const fmt = options?.format || '';
                                  const fmtColors: Record<string, string> = {
                                    docx: 'text-blue-400', xlsx: 'text-emerald-400', pptx: 'text-orange-400', pdf: 'text-red-400',
                                  };
                                  const fmtBg: Record<string, string> = {
                                    docx: 'bg-blue-500/10 border-blue-500/30', xlsx: 'bg-emerald-500/10 border-emerald-500/30',
                                    pptx: 'bg-orange-500/10 border-orange-500/30', pdf: 'bg-red-500/10 border-red-500/30',
                                  };
                                  const fmtLabel: Record<string, string> = {
                                    docx: 'Word Document', xlsx: 'Excel Spreadsheet', pptx: 'PowerPoint Presentation', pdf: 'PDF Document',
                                  };
                                  const color = fmtColors[fmt] || 'text-cyan-400';
                                  const bg = fmtBg[fmt] || 'bg-cyan-500/10 border-cyan-500/30';
                                  const label = fmtLabel[fmt] || fmt.toUpperCase();
                                  const srcExt = file?.name.split('.').pop()?.toUpperCase() || '?';
                                  return (
                                    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                                      <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center ${bg}`}>
                                        <FileType className={`w-9 h-9 ${color}`} />
                                      </div>
                                      <div className="text-center space-y-1">
                                        <p className={`text-xl font-black uppercase tracking-wide ${color}`}>{label}</p>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                          Converted from {srcExt} · Ready to Download
                                        </p>
                                      </div>
                                      {resultUrl && (
                                        <div className="w-full space-y-2">
                                          {resultSize && (
                                            <div className="flex justify-between items-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Output Size</span>
                                              <span className={`text-xs font-black ${color}`}>{(resultSize / (1024 * 1024)).toFixed(2)} MB</span>
                                            </div>
                                          )}
                                          <a
                                            href={resultUrl}
                                            download={`${(file?.name || 'output').replace(/\.[^.]+$/, '')}_converted.${fmt}`}
                                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all bg-emerald-500 text-black hover:bg-emerald-400`}
                                          >
                                            <Download className="w-3.5 h-3.5" /> Download .{fmt.toUpperCase()}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className={`relative w-full h-full flex items-center justify-center ${isVideoBgRemover && resultUrl ? 'checker-bg' : ''}`}
                                style={isVideoBgRemover && resultUrl ? {
                                  backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, #111111 0% 50%)',
                                  backgroundSize: '20px 20px',
                                } : undefined}
                              >
                                <video
                                  ref={videoRef}
                                  src={resultUrl || previewUrl!}
                                  controls={!processing}
                                  onPlay={() => setIsVideoStarted(true)}
                                  onSeeked={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
                                  onTimeUpdate={() => {
                                    if (videoRef.current) {
                                      setCurrentTime(videoRef.current.currentTime);
                                      if (videoRef.current.currentTime > 0) setIsVideoStarted(true);
                                    }
                                  }}
                                  className="max-h-full w-full object-contain"
                                />
                              </div>
                            )}

                            {isSubtitles && activeSubtitle && (
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={activeSubtitle.text}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none"
                                  style={{ maxWidth: '80%' }}
                                >
                                  <span className="inline-block bg-black/75 text-white text-sm font-semibold px-4 py-1.5 rounded-lg text-center leading-snug" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                                    {activeSubtitle.text}
                                  </span>
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </div>
                        ) : (
                          <div className="relative w-full h-full flex items-center justify-center flex-col gap-6">
                            {options.format === 'zip' ? (
                              <div className="flex flex-col items-center justify-center h-full w-full text-zinc-500 bg-white/5 rounded-2xl border border-white/10 p-8">
                                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                                  <div className="w-20 h-20 rounded-3xl border-2 flex items-center justify-center bg-purple-500/10 border-purple-500/30">
                                    <FileArchive className="w-9 h-9 text-purple-400" />
                                  </div>
                                  <div className="text-center space-y-1">
                                    <p className="text-xl font-black uppercase tracking-wide text-purple-400">Archive Ready</p>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                      {options.frameCount} Frames Extracted
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img src={isPaletteGenerator ? previewUrl! : (isRemoveBg ? (compositeUrl || resultUrl || previewUrl!) : (resultUrl || previewUrl!))} alt="Preview" className={isPdfTool ? 'h-[50vh] md:h-[85vh] aspect-[1/1.414] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10' : 'max-h-full max-w-full object-contain'} />
                            )}
                          </div>
                        )
                      )}
                    </div>

                    <AnimatePresence>
                      {processing && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-2xl">
                          <div className="w-64 space-y-4">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-cyan-500" animate={{ width: `${progress}%` }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-cyan-500 uppercase">
                              <span>{progress}%</span>
                              <span className="animate-pulse">Processing...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )}
          </main>
        )}
      </div>
    </div>
  );
}