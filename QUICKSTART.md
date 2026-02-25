# Quick Start Guide - MediaProcessor

## 🚀 Get Started in 5 Minutes

### 1. Installation

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### 2. Understanding the Flow

```
User clicks tool → Tool loads in workspace → User uploads file → 
Processing happens → Result downloads
```

### 3. Key Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/lib/toolRegistry.ts` | Tool definitions | Adding new tools |
| `src/processors/*.ts` | Processing logic | Implementing tool logic |
| `src/app/page.tsx` | Main UI | Changing layout |
| `src/components/UniversalWorkspace.tsx` | Workspace component | Modifying workflow |

## 🎯 Add Your First Tool (5 Steps)

### Step 1: Add to Registry

Edit `src/lib/toolRegistry.ts`:

```typescript
export const IMAGE_TOOLS: Record<string, ToolMetadata> = {
  // ... existing tools
  'my-tool': {
    id: 'my-tool',
    name: 'My Awesome Tool',
    description: 'Does something amazing',
    category: 'image',
    icon: Sparkles, // Import from lucide-react
    inputFormats: ['image/jpeg', 'image/png'],
    outputFormats: ['image/png'],
    processingEngine: 'canvas',
    features: ['Fast', 'Easy', 'Powerful']
  }
};
```

### Step 2: Create Processor

Create `src/processors/myTool.ts`:

```typescript
import { ToolProcessor } from '@/lib/toolRegistry';
import { CanvasHelper } from '@/lib/canvasHelper';

export const myToolProcessor: ToolProcessor = {
  validate: async (file: File) => {
    return file.type.startsWith('image/');
  },

  process: async (file: File, options) => {
    // Your processing logic here
    const img = await CanvasHelper.loadImage(file);
    
    // Do something with the image...
    
    // Return a Blob
    return new Blob([/* result */], { type: 'image/png' });
  }
};
```

### Step 3: Update Main Page

Edit `src/app/page.tsx`:

```typescript
import { myToolProcessor } from '@/processors/myTool';

// In the render, add:
{selectedTool?.id === 'my-tool' && (
  <UniversalWorkspace
    tool={selectedTool}
    onProcess={myToolProcessor.process}
  />
)}
```

### Step 4: Test

1. Click on Image Tools tab
2. Find your tool in the grid
3. Click to open
4. Upload a file
5. Process!

### Step 5: Add Custom Options (Optional)

```typescript
<UniversalWorkspace
  tool={selectedTool}
  onProcess={myToolProcessor.process}
  renderOptions={(options, setOptions) => (
    <div>
      <label>My Option</label>
      <input
        value={options.myOption}
        onChange={(e) => setOptions({ ...options, myOption: e.target.value })}
      />
    </div>
  )}
  defaultOptions={{ myOption: 'default' }}
/>
```

## 📚 Common Patterns

### Image Processing (Canvas)

```typescript
import { CanvasHelper } from '@/lib/canvasHelper';

// Load image
const img = await CanvasHelper.loadImage(file);

// Compress
const compressed = await CanvasHelper.compressImage(file, { quality: 0.8 });

// Resize
const resized = await CanvasHelper.resizeImage(file, { width: 800 });

// Apply filter
const filtered = await CanvasHelper.applyFilter(file, 'grayscale', 1);
```

### Video Processing (FFmpeg)

```typescript
import { ffmpegHelper } from '@/lib/ffmpegHelper';

// Ensure loaded
if (!ffmpegHelper.isLoaded()) {
  await ffmpegHelper.load();
}

// Compress video
const compressed = await ffmpegHelper.compressVideo(file, {
  quality: 75,
  scale: 0.5
});

// Convert to GIF
const gif = await ffmpegHelper.videoToGif(file, { fps: 10 });

// Extract audio
const audio = await ffmpegHelper.extractAudio(file, 'mp3');
```

### Audio Processing (Web Audio API)

```typescript
// Load audio file
const audioContext = new AudioContext();
const arrayBuffer = await file.arrayBuffer();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

// Process...

// Export
const offlineContext = new OfflineAudioContext(
  audioBuffer.numberOfChannels,
  audioBuffer.length,
  audioBuffer.sampleRate
);
// ... render and export
```

## 🎨 UI Customization

### Tool Card Styling

Tools automatically get Bento-style sizing based on their index. To force a specific size:

```typescript
// In page.tsx, modify the grid item:
<div className="sm:col-span-2 sm:row-span-2"> {/* Large */}
  {/* Tool card */}
</div>
```

### Custom Workspace Layout

Create your own workspace by copying `UniversalWorkspace.tsx` and modifying:

```typescript
import UniversalWorkspace from '@/components/UniversalWorkspace';

// Use as-is or extend it
export default function CustomWorkspace(props) {
  return (
    <UniversalWorkspace
      {...props}
      // Add custom props
    />
  );
}
```

## 🔧 Troubleshooting

### FFmpeg Not Loading

1. Check browser console for errors
2. Ensure headers are set in `next.config.js`
3. Try clearing browser cache
4. Check CORS in production

### Memory Issues

```typescript
// Always cleanup after processing
try {
  const result = await process(file);
  return result;
} finally {
  await ffmpegHelper.cleanup();
  CanvasHelper.cleanup();
}
```

### Large Files

For files > 100MB, consider:
1. Adding file size limits
2. Showing better progress indicators
3. Using Web Workers
4. Implementing streaming processing

## 📖 Next Steps

1. **Read the README.md** for complete architecture overview
2. **Study existing processors** in `src/processors/`
3. **Check tool registry** to see all 60+ planned tools
4. **Implement your tools** following the patterns
5. **Optimize performance** using Web Workers and caching

## 🤝 Code Quality Checklist

Before committing:

- [ ] TypeScript types are correct
- [ ] Error handling is implemented
- [ ] Memory cleanup is in place
- [ ] File validation works
- [ ] Processing is tested with various file sizes
- [ ] UI is responsive
- [ ] Code follows existing patterns

## 💡 Pro Tips

1. **Use the helpers**: Don't reinvent the wheel - FFmpegHelper and CanvasHelper have many utilities
2. **Lazy load**: Only load heavy libraries when needed
3. **Progressive enhancement**: Show preview before processing
4. **Error boundaries**: Always handle errors gracefully
5. **User feedback**: Show progress, not just spinners

## 🎯 Quick Reference

### File Types

```typescript
// Image
'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

// Video
'video/mp4' | 'video/webm' | 'video/quicktime'

// Audio
'audio/mpeg' | 'audio/wav' | 'audio/ogg' | 'audio/flac'
```

### Processing Engines

- **canvas**: Simple image operations
- **tensorflow**: AI/ML features
- **ffmpeg**: Video/audio processing
- **webaudio**: Audio manipulation
- **webspeech**: Speech recognition/synthesis

---

**Happy coding! 🚀**

Questions? Check the full README.md or example implementations.
