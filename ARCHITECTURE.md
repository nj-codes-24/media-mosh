# MediaProcessor - System Architecture Documentation

## 🏛️ Architecture Overview

MediaProcessor follows a **Plugin-Based Architecture** where each media processing tool is a self-contained module that integrates with a universal workspace component.

## 📊 System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Tab Nav     │  │  Bento Grid  │  │  Workspace   │      │
│  │  (3 tabs)    │  │  (60+ tools) │  │  (Universal) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                   │              │
│         └─────────────────┴───────────────────┘              │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────┐       │
│  │           Tool Registry (toolRegistry.ts)         │       │
│  │  • 60+ Tool Definitions                          │       │
│  │  • Metadata Management                           │       │
│  │  • Category Organization                         │       │
│  └────────────────────────┬─────────────────────────┘       │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────┐       │
│  │           Processor Layer (processors/)           │       │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │       │
│  │  │   Image    │  │   Video    │  │   Audio    │ │       │
│  │  │ Processors │  │ Processors │  │ Processors │ │       │
│  │  └────────────┘  └────────────┘  └────────────┘ │       │
│  └────────────────────────┬─────────────────────────┘       │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                    PROCESSING ENGINE LAYER                   │
│                           │                                  │
│  ┌───────────┬────────────┴──────┬──────────┬──────────┐    │
│  │           │                   │          │          │    │
│  ▼           ▼                   ▼          ▼          ▼    │
│  FFmpeg   TensorFlow           Canvas    Web       Web      │
│  Helper      .js               Helper   Audio     Speech    │
│  (WASM)    (WebGL/WASM)       (Native)   API       API      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Request Flow (User Uploads File)

```
User Selects File
       │
       ├─→ [File Validation]
       │         │
       │         ├─→ Valid? → Continue
       │         └─→ Invalid? → Show Error
       │
       ├─→ [Generate Preview]
       │         │
       │         ├─→ Image: Create data URL
       │         ├─→ Video: Create object URL
       │         └─→ Audio: Create object URL
       │
       └─→ [Display in Workspace]
                 │
                 ▼
           [User Adjusts Options]
                 │
                 ▼
           [User Clicks Process]
```

### Processing Flow

```
Start Processing
       │
       ├─→ [Load Processing Engine]
       │         │
       │         ├─→ FFmpeg: Load WASM if needed
       │         ├─→ TensorFlow: Load model if needed
       │         └─→ Canvas: Ready immediately
       │
       ├─→ [Execute Processor]
       │         │
       │         ├─→ Read file
       │         ├─→ Apply transformations
       │         ├─→ Generate output
       │         └─→ Return Blob
       │
       ├─→ [Create Download URL]
       │
       ├─→ [Show Result Preview]
       │
       └─→ [Enable Download Button]
```

### Memory Management Flow

```
Processing Complete
       │
       ├─→ [Cleanup Phase]
       │         │
       │         ├─→ Revoke object URLs
       │         ├─→ Delete FFmpeg temp files
       │         ├─→ Clear canvas buffers
       │         └─→ Release TensorFlow tensors
       │
       └─→ [Ready for Next File]
```

## 🧩 Component Architecture

### Universal Workspace Component

```
UniversalWorkspace
│
├─── Props
│    ├─── tool: ToolMetadata
│    ├─── onProcess: (file, options) => Promise<Blob>
│    ├─── renderOptions?: (options, setOptions) => ReactNode
│    └─── defaultOptions?: ProcessingOptions
│
├─── State
│    ├─── file: File | null
│    ├─── preview: string | null
│    ├─── processing: boolean
│    ├─── progress: number
│    ├─── result: Blob | null
│    ├─── resultUrl: string | null
│    ├─── error: string | null
│    └─── options: ProcessingOptions
│
└─── Lifecycle
     ├─── Upload → Validate → Preview
     ├─── Process → Progress → Result
     └─── Download → Reset → Ready
```

## 🗂️ File Organization Pattern

```
src/
│
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main page (Tool Selector)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── [category]/               # Dynamic routes (future)
│       └── [toolId]/
│           └── page.tsx
│
├── components/                   # Reusable UI components
│   ├── UniversalWorkspace.tsx    # Main workspace component
│   ├── ToolCard.tsx              # Tool grid card (future)
│   ├── FileUploader.tsx          # File upload component (future)
│   └── ProgressBar.tsx           # Progress indicator (future)
│
├── lib/                          # Core utilities
│   ├── toolRegistry.ts           # Tool definitions (60+ tools)
│   ├── ffmpegHelper.ts           # FFmpeg WASM manager
│   ├── canvasHelper.ts           # Canvas operations
│   ├── tensorflowHelper.ts       # TensorFlow operations (future)
│   └── audioHelper.ts            # Web Audio operations (future)
│
├── processors/                   # Tool implementations
│   ├── image/
│   │   ├── compressor.ts
│   │   ├── bgRemover.ts
│   │   ├── upscaler.ts
│   │   └── ...
│   ├── video/
│   │   ├── compressor.ts
│   │   ├── trimmer.ts
│   │   ├── converter.ts
│   │   └── ...
│   └── audio/
│       ├── vocalRemover.ts
│       ├── trimmer.ts
│       └── ...
│
└── types/                        # TypeScript types
    ├── tool.ts
    ├── processing.ts
    └── media.ts
```

## 🔌 Plugin System Design

### Tool Registration

```typescript
// 1. Define Tool Metadata
const toolMetadata: ToolMetadata = {
  id: 'unique-id',
  name: 'Tool Name',
  category: 'image' | 'video' | 'audio',
  processingEngine: 'canvas' | 'ffmpeg' | 'tensorflow',
  // ... other metadata
};

// 2. Implement Processor
const toolProcessor: ToolProcessor = {
  validate: (file) => Promise<boolean>,
  process: (file, options) => Promise<Blob>,
  getDefaultOptions: () => ProcessingOptions
};

// 3. Register in System
TOOL_REGISTRY[toolMetadata.id] = toolMetadata;
```

### Processor Interface

All processors must implement:

```typescript
interface ToolProcessor {
  // Validate if file can be processed
  validate(file: File): Promise<boolean>;
  
  // Main processing function
  process(
    file: File, 
    options?: ProcessingOptions
  ): Promise<Blob>;
  
  // Optional: Default options
  getDefaultOptions?(): ProcessingOptions;
}
```

## 🚦 State Management

### Application State Flow

```
┌─────────────────────────────────────────────────┐
│           Global State (React State)            │
├─────────────────────────────────────────────────┤
│  • activeTab: 'image' | 'video' | 'audio'       │
│  • selectedTool: ToolMetadata | null            │
│  • searchQuery: string                          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│        Workspace State (Component State)        │
├─────────────────────────────────────────────────┤
│  • file: File | null                            │
│  • processing: boolean                          │
│  • result: Blob | null                          │
│  • options: ProcessingOptions                   │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│          Engine State (Singleton)               │
├─────────────────────────────────────────────────┤
│  • FFmpegHelper.loaded: boolean                 │
│  • TensorFlowHelper.modelsLoaded: Map           │
│  • CanvasHelper.canvas: HTMLCanvasElement       │
└─────────────────────────────────────────────────┘
```

## 🎯 Processing Engine Details

### FFmpeg Helper (Video/Audio)

```
Features:
├── Singleton Pattern (memory efficient)
├── WASM Loading Management
├── Shared Buffer Handling
├── Automatic Cleanup
├── Progress Callbacks
└── Pre-built Operations
    ├── compressVideo()
    ├── videoToGif()
    ├── extractAudio()
    ├── trimVideo()
    ├── mergeVideos()
    └── changeSpeed()
```

### Canvas Helper (Images)

```
Features:
├── Static Methods (no instantiation needed)
├── Image Loading
├── Format Conversion
├── Compression
├── Filters & Effects
└── Utilities
    ├── compressImage()
    ├── resizeImage()
    ├── cropImage()
    ├── addText()
    ├── rotateImage()
    ├── extractPalette()
    └── createCircularPFP()
```

### TensorFlow Helper (AI Features - Future)

```
Planned Features:
├── Model Loading & Caching
├── Background Removal
├── Image Upscaling
├── Object Detection
├── Style Transfer
└── Face Detection
```

## 🔒 Security Considerations

### Client-Side Processing Benefits

```
✅ No server uploads
   └─→ Files never leave user's device

✅ No data storage
   └─→ Processing happens in memory

✅ No analytics tracking
   └─→ Complete privacy

✅ CORS isolated
   └─→ Each session is independent
```

### Safety Measures

```
├── File Type Validation
│   └─→ Strict MIME type checking
│
├── File Size Limits
│   └─→ Warn for files > 100MB
│
├── Memory Management
│   └─→ Automatic cleanup after processing
│
├── Error Boundaries
│   └─→ Graceful error handling
│
└── EXIF Stripping
    └─→ Remove metadata from images
```

## 📈 Performance Optimization Strategy

### Loading Strategy

```
┌─────────────────────────────────────────────┐
│            Initial Page Load                │
│  • Load React & Next.js                     │
│  • Load UI components                       │
│  • Load tool registry (metadata only)       │
│  Total: ~200KB                              │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         User Selects Tool                   │
│  • Load processor module                    │
│  • Load required engine                     │
│    - FFmpeg: ~30MB (one-time)               │
│    - TensorFlow: varies by model            │
│    - Canvas: already loaded                 │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         Processing Phase                    │
│  • Execute in main thread                   │
│  • Show progress indicator                  │
│  • Clean up after completion                │
└─────────────────────────────────────────────┘
```

### Future: Web Worker Architecture

```
Main Thread                 Web Worker Thread
     │                             │
     ├──── Send File ─────────────→│
     │                             │
     │                      Load Processor
     │                             │
     │                      Process File
     │                             │
     │←──── Progress Updates ──────┤
     │                             │
     │←──── Result Blob ───────────┤
     │                             │
     └──── Update UI               │
```

## 🎨 UI/UX Architecture

### Responsive Breakpoints

```
Mobile:     < 640px   → 1 column
Tablet:     640-1024px → 2 columns
Desktop:    1024-1536px → 3 columns
Large:      > 1536px   → 4 columns
```

### Bento Grid Algorithm

```typescript
// Variable sizing based on index
const getCardSize = (index: number) => {
  if (index % 7 === 0 || index % 7 === 3) {
    return 'large';  // 2x2 grid
  } else if (index % 7 === 1 || index % 7 === 5) {
    return 'medium'; // 2x1 grid
  } else {
    return 'small';  // 1x1 grid
  }
};
```

## 🔄 Future Architecture Enhancements

1. **Microservices for Heavy Tasks**
   - Offload complex AI to optional cloud workers
   - Keep client-side as default

2. **Progressive Web App**
   - Service worker for offline support
   - Cache processed results

3. **WebGPU Acceleration**
   - Use GPU for faster processing
   - Fallback to CPU when unavailable

4. **Streaming Processing**
   - Process large files in chunks
   - Show real-time preview

5. **Plugin Marketplace**
   - Community-contributed processors
   - Sandboxed execution environment

---

This architecture is designed to be:
- **Scalable**: Easy to add new tools
- **Maintainable**: Clear separation of concerns
- **Performant**: Lazy loading and memory management
- **Extensible**: Plugin-based system
- **User-Friendly**: Consistent UX across all tools
