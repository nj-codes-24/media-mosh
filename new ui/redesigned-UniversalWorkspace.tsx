'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, X, Loader2, Settings, Play, Check, AlertCircle } from 'lucide-react';
import { ToolMetadata, ProcessingOptions } from '@/lib/toolRegistry';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkspaceProps {
  tool: ToolMetadata;
  onProcess: (file: File, options?: ProcessingOptions) => Promise<Blob>;
  renderOptions?: (
    options: ProcessingOptions,
    setOptions: (options: ProcessingOptions) => void
  ) => React.ReactNode;
  defaultOptions?: ProcessingOptions;
}

export default function UniversalWorkspace({
  tool,
  onProcess,
  renderOptions,
  defaultOptions = {}
}: WorkspaceProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ProcessingOptions>(defaultOptions);
  const [showOptions, setShowOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      const isValidType = tool.inputFormats.some((format) =>
        selectedFile.type.startsWith(format.split('/')[0])
      );

      if (!isValidType) {
        setError(
          `Invalid file type. Accepted formats: ${tool.inputFormats.join(', ')}`
        );
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
      setResultUrl(null);

      // Generate preview
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      } else if (selectedFile.type.startsWith('audio/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      }
    },
    [tool.inputFormats]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleProcess = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const resultBlob = await onProcess(file, options);

      clearInterval(progressInterval);
      setProgress(100);

      setResult(resultBlob);
      const url = URL.createObjectURL(resultBlob);
      setResultUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !resultUrl) return;

    const extension = tool.outputFormats[0].split('/')[1];
    const filename = `processed_${Date.now()}.${extension}`;

    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = filename;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setOptions(defaultOptions);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 px-6 py-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 rounded-lg shadow-lg shadow-violet-500/20">
              <tool.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {tool.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{tool.description}</p>
            </div>
          </div>

          {renderOptions && file && !result && (
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                showOptions
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Options</span>
            </button>
          )}
        </div>
      </div>

      {/* Options Panel - Progressive Disclosure */}
      <AnimatePresence>
        {showOptions && renderOptions && file && !result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden"
          >
            <div className="px-6 py-5">
              {renderOptions(options, setOptions)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {!file ? (
              /* Upload Area */
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative group border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-16 text-center hover:border-violet-400 dark:hover:border-violet-600 transition-all cursor-pointer bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-violet-500/20 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Drop your file here
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    or click to browse
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      {tool.inputFormats.join(', ')}
                    </span>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={tool.inputFormats.join(',')}
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  className="hidden"
                />
              </motion.div>
            ) : (
              /* Processing Area */
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* File Preview */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        Input File
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{file.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {preview && (
                    <div className="mt-4 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      {tool.category === 'image' && (
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-h-96 mx-auto"
                        />
                      )}
                      {tool.category === 'video' && (
                        <video
                          src={preview}
                          controls
                          className="max-h-96 mx-auto"
                        />
                      )}
                      {tool.category === 'audio' && (
                        <div className="p-8">
                          <audio src={preview} controls className="w-full" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Process Button */}
                {!result && (
                  <button
                    onClick={handleProcess}
                    disabled={processing}
                    className="w-full group relative overflow-hidden py-4 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing... {progress}%</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Processing</span>
                      </>
                    )}
                  </button>
                )}

                {/* Progress Bar */}
                {processing && (
                  <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-600"
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">Error</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Result */}
                {result && resultUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                            Processing Complete!
                          </h3>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            {(result.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-500/20"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                    </div>

                    {/* Result Preview */}
                    {tool.category === 'image' && (
                      <div className="mt-4 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900">
                        <img
                          src={resultUrl}
                          alt="Result"
                          className="max-h-96 mx-auto"
                        />
                      </div>
                    )}
                    {tool.category === 'video' && (
                      <div className="mt-4 rounded-xl overflow-hidden bg-black border border-emerald-200 dark:border-emerald-900">
                        <video
                          src={resultUrl}
                          controls
                          className="max-h-96 mx-auto"
                        />
                      </div>
                    )}
                    {tool.category === 'audio' && (
                      <div className="mt-4 p-8 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900">
                        <audio src={resultUrl} controls className="w-full" />
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      className="w-full mt-4 py-3 bg-white dark:bg-zinc-900 border border-emerald-600 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors font-medium"
                    >
                      Process Another File
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 px-6 py-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="font-mono">{tool.processingEngine}</span>
            <span>•</span>
            <span>100% Client-Side</span>
          </div>
          {tool.features && (
            <div className="hidden sm:flex items-center gap-2">
              {tool.features.slice(0, 3).map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-1 bg-violet-500/10 text-violet-700 dark:text-violet-400 rounded border border-violet-500/20 text-[10px] font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
