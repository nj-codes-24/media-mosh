'use client';

import React, { useState } from 'react';
import { MediaType, getToolsByCategory, ToolMetadata } from '@/lib/toolRegistry';
import { Image, Video, Music, ArrowLeft, Sparkles } from 'lucide-react';
import UniversalWorkspace from '@/components/UniversalWorkspace';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic processor loader with async support
async function getProcessorForTool(toolId: string) {
  switch (toolId) {
    // IMAGE PROCESSORS
    case 'img-compressor':
      return (await import('@/processors/imagecompressor')).imageCompressorProcessor;
    case 'exif-remover':
      return (await import('@/processors/exifremover')).exifRemoverProcessor;
    case 'smart-cropper':
      return (await import('@/processors/imageresizer')).imageResizerProcessor;
    case 'palette-generator':
      return (await import('@/processors/paletteGenerator')).paletteGeneratorProcessor;
    
    // VIDEO PROCESSORS (async dynamic imports)
    case 'video-compressor':
      return (await import('@/processors/videocompressor')).videoCompressorProcessor;
    case 'video-trimmer':
      return (await import('@/processors/videotrimmer')).videoTrimmerProcessor;
    case 'video-to-gif':
      return (await import('@/processors/videotogif')).videoToGifProcessor;
    
    // AUDIO PROCESSORS (async dynamic imports)
    case 'audio-extractor':
      return (await import('@/processors/audioextraction')).audioExtractorProcessor;
    
    default:
      return null;
  }
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<MediaType>('image');
  const [selectedTool, setSelectedTool] = useState<ToolMetadata | null>(null);
  const [processor, setProcessor] = useState<any>(null);
  const [isLoadingProcessor, setIsLoadingProcessor] = useState(false);

  const tabs: Array<{ id: MediaType; label: string; icon: React.ReactNode }> = [
    { id: 'image', label: 'Image', icon: <Image className="w-4 h-4" /> },
    { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', icon: <Music className="w-4 h-4" /> },
  ];

  const tools = getToolsByCategory(activeTab);

  // Handle tool selection with dynamic processor loading
  const handleToolSelect = async (tool: ToolMetadata) => {
    setSelectedTool(tool);
    setIsLoadingProcessor(true);
    
    try {
      const loadedProcessor = await getProcessorForTool(tool.id);
      setProcessor(loadedProcessor);
    } catch (error) {
      console.error('Failed to load processor:', error);
    } finally {
      setIsLoadingProcessor(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    setSelectedTool(null);
    setProcessor(null);
  };

  // Bento grid sizing logic
  const getBentoSize = (index: number) => {
    // Create an interesting pattern
    if (index % 11 === 0 || index % 11 === 5) {
      return 'lg:col-span-2 lg:row-span-2'; // Large
    } else if (index % 11 === 2 || index % 11 === 7) {
      return 'lg:col-span-2'; // Wide
    }
    return ''; // Regular
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-zinc-100 dark:from-zinc-950 dark:via-slate-950 dark:to-zinc-900">
      {/* Header with backdrop blur */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 rounded-xl blur-md opacity-50 -z-10" />
              </div>
              <div>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
                  MediaProcessor
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Client-side processing powerhouse
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  $0 Operating Cost
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedTool(null);
                  setProcessor(null);
                }}
                className={`group flex items-center gap-2 px-5 py-3.5 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <span className={`transition-transform ${activeTab === tab.id ? 'scale-100' : 'scale-90 group-hover:scale-95'}`}>
                  {tab.icon}
                </span>
                <span className="text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
        <AnimatePresence mode="wait">
          {!selectedTool ? (
            /* Tool Grid */
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent mb-3">
                  {activeTab === 'image' && 'Image Processing'}
                  {activeTab === 'video' && 'Video Processing'}
                  {activeTab === 'audio' && 'Audio Processing'}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm lg:text-base">
                  Professional-grade tools powered by WebAssembly and modern web APIs
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {tools.map((tool, index) => {
                  const bentoSize = getBentoSize(index);
                  const isImplemented = [
                    'img-compressor',
                    'exif-remover',
                    'smart-cropper',
                    'palette-generator',
                    'video-compressor',
                    'video-trimmer',
                    'video-to-gif',
                    'audio-extractor'
                  ].includes(tool.id);

                  return (
                    <motion.button
                      key={tool.id}
                      onClick={() => isImplemented && handleToolSelect(tool)}
                      disabled={!isImplemented}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={isImplemented ? { scale: 1.02, y: -2 } : {}}
                      whileTap={isImplemented ? { scale: 0.98 } : {}}
                      className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900 p-6 text-left transition-all ${bentoSize} ${
                        isImplemented
                          ? 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950/50 cursor-pointer'
                          : 'border-zinc-100 dark:border-zinc-900 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-violet-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative">
                        {/* Icon */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 group-hover:from-blue-500/10 group-hover:to-purple-600/10 transition-all">
                            <tool.icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                          </div>
                          
                          {isImplemented ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                Ready
                              </span>
                            </div>
                          ) : (
                            <div className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                                Soon
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <h3 className="text-base lg:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                          {tool.description}
                        </p>

                        {/* Features */}
                        {tool.features && (
                          <div className="flex flex-wrap gap-1.5">
                            {tool.features.slice(0, 3).map((feature) => (
                              <span
                                key={feature}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono">
                            {tool.processingEngine}
                          </span>
                          {isImplemented && (
                            <span className="text-xs text-violet-600 dark:text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Open →
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* Tool Workspace */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={handleBack}
                className="group mb-6 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Back to {activeTab} tools</span>
              </button>

              {/* Workspace Container */}
              <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-200/50 dark:shadow-zinc-950/50">
                {/* Decorative gradient */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
                
                <div className="h-[calc(100vh-240px)]">
                  {isLoadingProcessor ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 mx-auto mb-4 animate-pulse" />
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Loading processor...
                        </p>
                      </div>
                    </div>
                  ) : processor ? (
                    <UniversalWorkspace
                      tool={selectedTool}
                      onProcess={processor.process as any}
                      renderOptions={getOptionsRenderer(selectedTool.id)}
                      defaultOptions={processor.getDefaultOptions?.()}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <selectedTool.icon className="w-16 h-16 mx-auto text-zinc-400 mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          {selectedTool.name}
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Processor not available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 text-sm">
                MediaProcessor
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Professional media processing suite running entirely in your browser. Zero servers, maximum privacy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 text-sm">
                Technology
              </h4>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-violet-500" />
                  FFmpeg.wasm for Video/Audio
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-violet-500" />
                  Canvas API for Images
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-violet-500" />
                  100% Client-Side Processing
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3 text-sm">
                Features
              </h4>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  No file uploads required
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  Complete privacy
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  $0 operating costs
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Built with Next.js, Tailwind CSS, and WebAssembly • Powered by modern web standards
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Options renderers for each tool
function getOptionsRenderer(toolId: string) {
  switch (toolId) {
    case 'img-compressor':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Quality: <span className="text-violet-600 dark:text-violet-400 font-semibold">{options.quality}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={options.quality || 85}
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Max Width
              </label>
              <input
                type="number"
                value={options.maxWidth || 1920}
                onChange={(e) => setOptions({ ...options, maxWidth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Max Height
              </label>
              <input
                type="number"
                value={options.maxHeight || 1920}
                onChange={(e) => setOptions({ ...options, maxHeight: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Output Format
            </label>
            <select
              value={options.format || 'image/jpeg'}
              onChange={(e) => setOptions({ ...options, format: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </div>
      );

    case 'exif-remover':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Output Format
            </label>
            <select
              value={options.format || 'same'}
              onChange={(e) => setOptions({ ...options, format: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            >
              <option value="same">Same as input</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
            </select>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🔒 Privacy Protection
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• GPS location data</li>
              <li>• Camera make and model</li>
              <li>• Date and time taken</li>
              <li>• All other metadata</li>
            </ul>
          </div>
        </div>
      );

    case 'smart-cropper':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Width
              </label>
              <input
                type="number"
                value={options.width || 1920}
                onChange={(e) => setOptions({ ...options, width: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Height
              </label>
              <input
                type="number"
                value={options.height || 1080}
                onChange={(e) => setOptions({ ...options, height: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.maintainAspectRatio !== false}
                onChange={(e) => setOptions({ ...options, maintainAspectRatio: e.target.checked })}
                className="w-4 h-4 text-violet-600 rounded focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Maintain aspect ratio
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Resize Mode
            </label>
            <select
              value={options.fit || 'contain'}
              onChange={(e) => setOptions({ ...options, fit: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            >
              <option value="contain">Contain (fit inside)</option>
              <option value="cover">Cover (fill entire area)</option>
              <option value="fill">Fill (stretch to exact size)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOptions({ ...options, width: 1920, height: 1080 })}
              className="px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium"
            >
              Full HD
            </button>
            <button
              onClick={() => setOptions({ ...options, width: 1080, height: 1080 })}
              className="px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium"
            >
              Square
            </button>
          </div>
        </div>
      );

    case 'palette-generator':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Number of Colors: <span className="text-violet-600 dark:text-violet-400 font-semibold">{options.numColors || 5}</span>
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={options.numColors || 5}
              onChange={(e) => setOptions({ ...options, numColors: parseInt(e.target.value) })}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Output Type
            </label>
            <select
              value={options.outputType || 'visual'}
              onChange={(e) => setOptions({ ...options, outputType: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            >
              <option value="visual">Visual Palette</option>
              <option value="json">JSON Data</option>
            </select>
          </div>
        </div>
      );

    case 'video-compressor':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Quality: <span className="text-violet-600 dark:text-violet-400 font-semibold">{options.quality}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={options.quality || 75}
              onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Scale: <span className="text-violet-600 dark:text-violet-400 font-semibold">{((options.scale || 1) * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.25"
              max="1"
              step="0.05"
              value={options.scale || 1}
              onChange={(e) => setOptions({ ...options, scale: parseFloat(e.target.value) })}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>
        </div>
      );

    case 'video-trimmer':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Start Time (seconds)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={options.startTime || 0}
              onChange={(e) => setOptions({ ...options, startTime: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              End Time (seconds)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={options.endTime || 10}
              onChange={(e) => setOptions({ ...options, endTime: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Duration: <span className="font-semibold">{((options.endTime || 10) - (options.startTime || 0)).toFixed(1)}s</span>
            </p>
          </div>
        </div>
      );

    case 'video-to-gif':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Frame Rate: <span className="text-violet-600 dark:text-violet-400 font-semibold">{options.fps || 10} FPS</span>
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={options.fps || 10}
              onChange={(e) => setOptions({ ...options, fps: parseInt(e.target.value) })}
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Quality
            </label>
            <select
              value={options.quality || 'medium'}
              onChange={(e) => setOptions({ ...options, quality: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            >
              <option value="low">Low (smallest file)</option>
              <option value="medium">Medium</option>
              <option value="high">High (best quality)</option>
            </select>
          </div>
        </div>
      );

    case 'audio-extractor':
      return (options: any, setOptions: any) => (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Output Format
            </label>
            <select
              value={options.format || 'mp3'}
              onChange={(e) => setOptions({ ...options, format: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            >
              <option value="mp3">MP3 (Compressed)</option>
              <option value="wav">WAV (Uncompressed)</option>
              <option value="ogg">OGG (Compressed)</option>
            </select>
          </div>

          {(options.format === 'mp3' || options.format === 'ogg') && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Bitrate: <span className="text-violet-600 dark:text-violet-400 font-semibold">{options.quality || 192} kbps</span>
              </label>
              <input
                type="range"
                min="64"
                max="320"
                step="32"
                value={options.quality || 192}
                onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>
          )}
        </div>
      );

    default:
      return undefined;
  }
}
