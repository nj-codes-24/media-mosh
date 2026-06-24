import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Layers, Loader2 } from 'lucide-react';
import { ToolMetadata } from '@/lib/toolRegistry';

interface MediaDropzoneProps {
  tool: ToolMetadata;
  isTTS: boolean;
  isPdfMultiInput: boolean;
  isDragging: boolean;
  textInput: string;
  setTextInput: (val: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  getFileInputAccept: () => string | undefined;
  handleFileSelect: (files: FileList) => void;
  handleUrlSubmit: (e: React.FormEvent) => void;
  imageUrlInput: string;
  setImageUrlInput: (val: string) => void;
  setUrlError: (val: string | null) => void;
  isFetchingUrl: boolean;
  urlError: string | null;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  tool,
  isTTS,
  isPdfMultiInput,
  isDragging,
  textInput,
  setTextInput,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  fileInputRef,
  getFileInputAccept,
  handleFileSelect,
  handleUrlSubmit,
  imageUrlInput,
  setImageUrlInput,
  setUrlError,
  isFetchingUrl,
  urlError,
}) => {
  if (isTTS) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center max-w-4xl">
        <div className="w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative w-full bg-black border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Script Input</span>
              <span className="text-[10px] font-black uppercase text-cyan-500 tracking-widest">{textInput.length} chars</span>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type something here to convert to speech..."
              className="ws-tts-textarea w-full h-[200px] md:h-[400px] bg-transparent text-base md:text-xl font-medium text-white placeholder:text-zinc-700 focus:outline-none resize-none custom-scrollbar"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
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
        <input
          ref={fileInputRef as any}
          type="file"
          multiple={isPdfMultiInput ? true : undefined}
          accept={getFileInputAccept()}
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        />
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
  );
};
