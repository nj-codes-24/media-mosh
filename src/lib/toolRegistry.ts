import {
  Image, Video, Music, Wand2, Scissors, Zap, Layers, Eye, Mic,
  FileAudio, Sparkles, Palette, Eraser, Maximize, ShieldCheck,
  UserSquare, Minimize, Type, MoveHorizontal, EyeOff, Mic2,
  Ghost, MessageSquareQuote, Activity, RefreshCw, BarChart3, Scaling,
  // PDF Icons
  FileText, Files, FileMinus, SplitSquareHorizontal, ArrowUpDown, RotateCw, Minimize2, FileArchive, Settings2
} from 'lucide-react';

export type MediaType = 'image' | 'video' | 'audio' | 'pdf';

export interface ToolMetadata {
  id: string;
  name: string;
  category: MediaType;
  description: string;
  icon: any;
  status: 'ready' | 'soon';
  inputFormats: string[];
  outputFormats: string[];
  processingEngine: string;
  features?: string[];
}

export const toolRegistry: ToolMetadata[] = [
  // IMAGE SUITE
  { id: 'bg-remover', name: 'Background Remover', category: 'image', description: 'AI-powered background removal', icon: Layers, status: 'ready', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png'], processingEngine: 'imgly-AI (Local WASM)', features: ['Subject Detection', 'Transparent Export', '100% Private'] },
  { id: 'palette-generator', name: 'Palette Generator', category: 'image', description: 'Extract dominant color palettes', icon: Palette, status: 'ready', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['application/json'], processingEngine: 'K-Means Clustering', features: ['Dominant Colors', 'Hex Export', 'One-click Copy'] },
  { id: 'image-converter', name: 'Image Converter', category: 'image', description: 'Convert image formats (JPG, PNG, WEBP, BMP)', icon: RefreshCw, status: 'ready', inputFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'], processingEngine: 'Browser Canvas', features: ['Instant Conversion', 'No Upload Required'] },
  { id: 'ai-upscale', name: 'AI Upscaler', category: 'image', description: 'Enhance resolution (2x, 4x) without quality loss', icon: Zap, status: 'ready', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png'], processingEngine: 'Bicubic / Neural (Simulated)', features: ['2x Super Res', '4x Ultra Res', 'Detail Enhancement'] },
  { id: 'exif-remover', name: 'EXIF Remover', category: 'image', description: 'Strip privacy metadata from files', icon: ShieldCheck, status: 'ready', inputFormats: ['image/jpeg', 'image/png'], outputFormats: ['image/jpeg', 'image/png'], processingEngine: 'Exif.js' },
  { id: 'magic-eraser', name: 'Magic Eraser', category: 'image', description: 'Remove unwanted objects from photos', icon: Wand2, status: 'soon', inputFormats: ['image/png', 'image/jpeg'], outputFormats: ['image/png'], processingEngine: 'LaMa AI', features: ['Content-aware Fill'] },
  { id: 'photo-restore', name: 'Photo Restore', category: 'image', description: 'Restore old B&W photos', icon: Sparkles, status: 'soon', inputFormats: ['image/jpeg', 'image/png', 'image/webp'], outputFormats: ['image/png'], processingEngine: 'Restoration Pipeline', features: ['Scratch Repair', 'AI Colorization'] },
  { id: 'watermark-remover', name: 'Watermark Remover', category: 'image', description: 'Remove watermarks from images', icon: Eraser, status: 'soon', inputFormats: ['image/png', 'image/jpeg'], outputFormats: ['image/png'], processingEngine: 'AI Inpainting' },
  { id: 'passport-maker', name: 'Passport Photo Maker', category: 'image', description: 'Create and edit passport-size photos', icon: UserSquare, status: 'soon', inputFormats: ['image/jpeg', 'image/png'], outputFormats: ['image/png'], processingEngine: 'Face Detection' },

  // VIDEO SUITE
  { id: 'auto-subtitle', name: 'Auto Subtitles', category: 'video', description: 'AI-powered transcription with draggable captions.', icon: Type, status: 'ready', inputFormats: ['video/mp4', 'video/webm', 'video/quicktime'], outputFormats: ['application/x-subrip', 'text/vtt'], processingEngine: 'Whisper AI (WebGPU)', features: ['Auto-Timestamp', 'Draggable Text', 'Style Presets'] },
  { id: 'video-stabilizer', name: 'Video Stabilizer', category: 'video', description: 'Smooth out shaky video footage', icon: MoveHorizontal, status: 'soon', inputFormats: ['video/mp4', 'video/webm', 'video/quicktime'], outputFormats: ['video/webm'], processingEngine: 'Optical Flow (Lucas-Kanade)', features: ['Motion Tracking', 'Camera Trajectory Smoothing'] },
  { id: 'video-bg-remover', name: 'Video BG Remover', category: 'video', description: 'Remove video background via AI', icon: Layers, status: 'soon', inputFormats: ['video/mp4', 'video/webm'], outputFormats: ['video/webm'], processingEngine: 'Transformers.js + WebCodecs', features: ['Transparent Export', 'Proxy Masking'] },
  { id: 'frame-extractor', name: 'Frame Extractor', category: 'video', description: 'Extract specific single frames or batch-extract.', icon: SplitSquareHorizontal, status: 'ready', inputFormats: ['video/mp4', 'video/webm', 'video/quicktime'], outputFormats: ['image/png', 'application/zip'], processingEngine: 'Canvas / FFmpeg.wasm', features: ['Instant Scrub', 'Batch Extraction'] },
  { id: 'video-compressor', name: 'Video Compressor', category: 'video', description: 'Reduce size without quality loss', icon: Minimize, status: 'ready', inputFormats: ['video/mp4', 'video/webm'], outputFormats: ['video/mp4'], processingEngine: 'FFmpeg.wasm' },
  { id: 'audio-extraction', name: 'Audio Extraction', category: 'video', description: 'Extract high-quality audio tracks', icon: FileAudio, status: 'ready', inputFormats: ['video/mp4'], outputFormats: ['audio/mp3'], processingEngine: 'FFmpeg.wasm' },

  // AUDIO SUITE
  { id: 'audio-converter', name: 'Audio Converter', category: 'audio', description: 'Convert format (WAV, OGG, WEBM)', icon: RefreshCw, status: 'ready', inputFormats: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/webm'], outputFormats: ['audio/wav', 'audio/ogg', 'audio/webm'], processingEngine: 'Web Audio API', features: ['Lossless WAV', 'Instant Process'] },
  { id: 'audio-splitter', name: 'Audio Splitter', category: 'audio', description: 'Isolate Vocals, Bass, and Drums', icon: Scissors, status: 'soon', inputFormats: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a'], outputFormats: ['audio/wav'], processingEngine: 'DSP Phase/Frequency Isolation', features: ['Vocal Remover', 'Stem Isolation'] },
  { id: 'voice-changer', name: 'Voice Morph', category: 'audio', description: 'Transform vocals into Robot, Demon, or Chipmunk', icon: Mic, status: 'ready', inputFormats: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a'], outputFormats: ['audio/wav'], processingEngine: 'OfflineAudioContext DSP', features: ['Pitch Shifting', 'Ring Modulation'] },
  { id: 'text-to-speech', name: 'Neural Reader', category: 'audio', description: 'Convert text into lifelike spoken audio.', icon: Mic2, status: 'ready', inputFormats: [], outputFormats: ['audio/wav'], processingEngine: 'Native SpeechSynthesis', features: ['Gender Selection', 'Pitch Control'] },

  // PDF SUITE
  { id: 'pdf-page-manager', name: 'Page Manager Studio', category: 'pdf', description: 'Reorder, rotate, delete, and insert pages or documents into a PDF.', icon: Settings2, status: 'ready', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], processingEngine: 'PDF-lib (WASM)', features: ['Visual Tree', 'Drag & Drop', 'Rotate & Insert'] },
  { id: 'pdf-from-images', name: 'Images to PDF', category: 'pdf', description: 'Convert multiple images into a single PDF document', icon: FileText, status: 'ready', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['application/pdf'], processingEngine: 'PDF-lib (WASM)' },
  { id: 'pdf-merger', name: 'Merge PDFs', category: 'pdf', description: 'Combine multiple PDF files into one', icon: Files, status: 'ready', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], processingEngine: 'PDF-lib (WASM)' },
  { id: 'pdf-remove-page', name: 'Remove Pages', category: 'pdf', description: 'Quickly delete pages by number', icon: FileMinus, status: 'soon', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], processingEngine: 'PDF-lib (WASM)' },
  { id: 'pdf-compress', name: 'Compress PDF', category: 'pdf', description: 'Reduce PDF file size by resampling embedded images', icon: Minimize2, status: 'ready', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], processingEngine: 'PDF-lib (WASM)' },
  { id: 'pdf-converter', name: 'File Format Changer', category: 'pdf', description: 'Convert between PDF, Word, Excel, and PowerPoint', icon: FileArchive, status: 'soon', inputFormats: ['.pdf', '.docx', '.xlsx', '.pptx'], outputFormats: ['.pdf', '.docx', '.xlsx', '.pptx'], processingEngine: 'Format Engine', features: ['PDF', 'Word', 'Excel'] }
];

export const getToolsByCategory = (category: MediaType) => toolRegistry.filter(tool => tool.category === category);