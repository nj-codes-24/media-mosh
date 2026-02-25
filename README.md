# MediaProcessor - Professional Client-Side Media Processing Platform

A comprehensive, plugin-based media processing suite that runs entirely in the browser with **$0 operating costs**. Process images, videos, and audio files with professional-grade tools powered by FFmpeg.wasm, TensorFlow.js, and Canvas API.

## 🏗️ System Architecture

### Core Principles

1. **Client-Side First**: All processing happens in the browser using Web APIs and WASM
2. **Plugin-Based System**: Each tool is a self-contained module that plugs into the Universal Workspace
3. **Zero Server Costs**: No uploads, no backends, no servers - complete privacy and zero infrastructure costs
4. **Professional UI**: Bento-style grid layout with responsive design using Tailwind CSS

### Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                   Next.js 14 (App Router)            │
├─────────────────────────────────────────────────────┤
│  React 18  │  TypeScript  │  Tailwind CSS            │
├─────────────────────────────────────────────────────┤
│                Processing Engines                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ FFmpeg   │  │TensorFlow│  │ Canvas   │           │
│  │ .wasm    │  │   .js    │  │   API    │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐                         │
│  │Web Audio │  │Web Speech│                         │
│  │   API    │  │   API    │                         │
│  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
media-processor/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Main page with tab navigation & tool grid
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles with Tailwind
│   │
│   ├── components/
│   │   └── UniversalWorkspace.tsx # Reusable workspace component
│   │
│   ├── lib/
│   │   ├── toolRegistry.ts       # Master tool manifest (ALL tools)
│   │   ├── ffmpegHelper.ts       # FFmpeg WASM manager
│   │   └── canvasHelper.ts       # Canvas utility class
│   │
│   └── processors/               # Tool implementations
│       ├── imageCompressor.ts    # Example image processor
│       ├── videoCompressor.ts    # Example video processor
│       └── [tool-name].ts        # More processors...
│
├── package.json
├── next.config.js                # WASM & SharedArrayBuffer config
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Tool Registry System

The `toolRegistry.ts` is the central nervous system of the application. It contains metadata for all 60+ tools:

```typescript
export interface ToolMetadata {
  id: string;                      // Unique identifier
  name: string;                    // Display name
  description: string;             // Short description
  category: 'image' | 'video' | 'audio';
  icon: LucideIcon;                // Unique icon for each tool
  inputFormats: string[];          // Accepted MIME types
  outputFormats: string[];         // Output MIME types
  processingEngine: 'canvas' | 'tensorflow' | 'ffmpeg' | 'webaudio' | 'webspeech';
  features?: string[];             // Feature tags
  premium?: boolean;               // Premium feature flag
}
```

### Tool Categories

#### 🖼️ Image Tools (18 tools)
- AI-Powered: Background Remover, Magic Eraser, AI Upscaler, Photo Restorer, B&W Colorizer
- Editing: Smart Cropper, Face Blur, Perspective Corrector, Watermark Remover
- Utilities: Compressor, EXIF Remover, QR Generator, Palette Generator
- Creative: Meme Generator, PFP Maker, Image to SVG, Texture Generator, Passport Photo Maker

#### 🎥 Video Tools (19 tools)
- AI/Effects: Background Remover/Blur, Motion Tracked Blur, Stabilizer
- Conversion: Video to GIF, Format Converter, Frame Extractor
- Editing: Trimmer, Merger, Cropper, Speed Changer, Reverser, Looper
- Audio: Audio Extractor, Auto-Subtitle, Hardcode Subtitles
- Creation: Screen/Webcam Recorder, Stop Motion, Intro Maker
- Processing: Compressor, Watermark Remover

#### 🎵 Audio Tools (17 tools)
- AI/Separation: Vocal Remover, Voice Isolator
- Editing: Trimmer, Merger, Speed/Pitch Changer, Reverser
- Effects: Bass Booster, 8D Converter, Voice Changer, Volume Booster
- Analysis: BPM Finder, Spectrum Visualizer
- Utilities: Format Converter, Silence Remover, Ringtone Maker
- Creation: Text-to-Speech, Mic Recorder

## 🔧 Implementation Guide

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Understand the Processor Pattern

Each tool follows a standardized interface:

```typescript
export interface ToolProcessor {
  validate: (file: File) => Promise<boolean>;
  process: (file: File, options?: ProcessingOptions) => Promise<Blob>;
  getDefaultOptions?: () => ProcessingOptions;
}
```

### Step 3: Implement a Tool

Example: Image Compressor

```typescript
// src/processors/imageCompressor.ts
import { ToolProcessor } from '@/lib/toolRegistry';
import { CanvasHelper } from '@/lib/canvasHelper';

export const imageCompressorProcessor: ToolProcessor = {
  validate: async (file: File) => {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  },

  getDefaultOptions: () => ({
    quality: 85,
    maxWidth: 1920,
    format: 'image/jpeg'
  }),

  process: async (file: File, options) => {
    return CanvasHelper.compressImage(file, options);
  }
};
```

### Step 4: Connect to Workspace

Update the main page to load processors dynamically:

```typescript
// src/app/page.tsx
import UniversalWorkspace from '@/components/UniversalWorkspace';
import { imageCompressorProcessor } from '@/processors/imageCompressor';

// In the render:
{selectedTool?.id === 'img-compressor' && (
  <UniversalWorkspace
    tool={selectedTool}
    onProcess={imageCompressorProcessor.process}
    defaultOptions={imageCompressorProcessor.getDefaultOptions()}
  />
)}
```

## 🛠️ Helper Classes

### FFmpegHelper

Manages FFmpeg.wasm lifecycle with memory leak prevention:

```typescript
import { ffmpegHelper } from '@/lib/ffmpegHelper';

// Compress video
const result = await ffmpegHelper.compressVideo(file, {
  quality: 75,
  scale: 0.5,
  fps: 30
});

// Convert to GIF
const gif = await ffmpegHelper.videoToGif(file, {
  fps: 10,
  scale: 0.5
});

// Extract audio
const audio = await ffmpegHelper.extractAudio(file, 'mp3');
```

Key Features:
- Singleton pattern for memory efficiency
- Automatic cleanup to prevent memory leaks
- Shared buffer management
- Progress callbacks
- Pre-built methods for common operations

### CanvasHelper

Optimized Canvas operations for image processing:

```typescript
import { CanvasHelper } from '@/lib/canvasHelper';

// Compress image
const compressed = await CanvasHelper.compressImage(file, {
  quality: 0.85,
  maxWidth: 1920
});

// Resize
const resized = await CanvasHelper.resizeImage(file, {
  width: 800,
  fit: 'contain'
});

// Add text
const withText = await CanvasHelper.addText(file, 'My Text', {
  x: 100,
  y: 100,
  fontSize: 48
});

// Extract color palette
const colors = await CanvasHelper.extractPalette(file, 5);
```

## 🎨 UI Components

### Bento Grid Layout

The tool selection uses a variable-sized Bento grid pattern:

```typescript
const isLarge = index % 7 === 0 || index % 7 === 3;
const isMedium = index % 7 === 1 || index % 7 === 5;

<div className={`
  ${isLarge ? 'sm:col-span-2 sm:row-span-2' : ''}
  ${isMedium ? 'sm:col-span-2' : ''}
`}>
  {/* Tool card */}
</div>
```

### Universal Workspace

The workspace handles:
- File upload (drag & drop + click)
- File validation
- Progress tracking
- Result preview
- Download functionality
- Error handling

## 🚀 Running the Application

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Deploy

Compatible with:
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- Any static hosting

**Note**: Ensure CORS headers are properly configured for SharedArrayBuffer support.

## 🔐 Security & Privacy

- **No Server Uploads**: Files never leave the user's device
- **No Analytics**: Complete privacy by default
- **EXIF Stripping**: Built-in metadata removal tools
- **Isolated Processing**: Each tool runs in isolated context

## 📊 Performance Optimization

### Memory Management

```typescript
// FFmpegHelper automatically cleans up
await ffmpegHelper.cleanup();

// Canvas cleanup
CanvasHelper.cleanup();
```

### Lazy Loading

```typescript
// Load FFmpeg only when needed
if (!ffmpegHelper.isLoaded()) {
  await ffmpegHelper.load(onProgress);
}
```

### Web Workers (Future Enhancement)

For CPU-intensive tasks, offload to Web Workers:

```typescript
const worker = new Worker('/workers/imageProcessor.js');
worker.postMessage({ file, action: 'process' });
```

## 🎯 Scaling the Platform

### Adding a New Tool

1. **Add to Registry** (`toolRegistry.ts`)
```typescript
'new-tool': {
  id: 'new-tool',
  name: 'New Tool',
  description: 'Tool description',
  category: 'image',
  icon: ToolIcon,
  inputFormats: ['image/jpeg'],
  outputFormats: ['image/png'],
  processingEngine: 'canvas'
}
```

2. **Create Processor** (`processors/newTool.ts`)
```typescript
export const newToolProcessor: ToolProcessor = {
  validate: async (file) => { /* ... */ },
  process: async (file, options) => { /* ... */ }
};
```

3. **Connect in UI** (`app/page.tsx`)
```typescript
{selectedTool?.id === 'new-tool' && (
  <UniversalWorkspace
    tool={selectedTool}
    onProcess={newToolProcessor.process}
  />
)}
```

## 🧪 Testing Checklist

- [ ] File upload validation
- [ ] Processing with various file sizes
- [ ] Memory cleanup after processing
- [ ] Error handling for unsupported formats
- [ ] Mobile responsiveness
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] WASM loading in production

## 📝 Future Enhancements

- [ ] Batch processing support
- [ ] Cloud storage integration (Google Drive, Dropbox)
- [ ] Advanced AI models (object detection, style transfer)
- [ ] Real-time preview during processing
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] PWA support for offline use
- [ ] WebGPU acceleration

## 🤝 Contributing

This is a production-ready foundation. To add new tools:

1. Study the existing processor patterns
2. Implement the `ToolProcessor` interface
3. Add tool metadata to registry
4. Create UI integration
5. Test thoroughly

## 📄 License

MIT License - feel free to use this architecture for your projects!

---

**Built with** ❤️ **using Next.js, Tailwind CSS, FFmpeg.wasm, and modern web technologies**
