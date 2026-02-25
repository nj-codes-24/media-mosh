'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Video, Music, Search, ArrowLeft, FileText } from 'lucide-react';
import { toolRegistry, ToolMetadata, MediaType } from '@/lib/toolRegistry';
import UniversalWorkspace from '@/components/UniversalWorkspace';

async function loadProcessor(toolId: string) {
  try {
    switch (toolId) {
      case 'bg-remover': return (await import('@/processors/bgremover')).bgRemoverProcessor;
      case 'exif-remover': return (await import('@/processors/exifremover')).exifRemoverProcessor;
      case 'img-compressor': return (await import('@/processors/imagecompressor')).imageCompressorProcessor;
      case 'palette-generator': return (await import('@/processors/paletteGenerator')).paletteGenerator;
      case 'photo-restore': return (await import('@/processors/photoRestorer')).photoRestorer;
      case 'image-converter': return (await import('@/processors/imageFormatConverter')).imageFormatConverter;
      case 'ai-upscale': return (await import('@/processors/imageUpscaler')).imageUpscaler;
      case 'auto-subtitle': return (await import('@/processors/subtitleProcessor')).subtitleProcessor;
      case 'video-compressor': return (await import('@/processors/videocompressor')).videoCompressorProcessor;
      case 'audio-extraction': return (await import('@/processors/audioextraction')).audioExtractionProcessor;
      case 'video-stabilizer': return (await import('@/processors/videoStabilizer')).videoStabilizer;
      case 'video-bg-remover': return (await import('@/processors/videoBgRemover')).videoBgRemoverProcessor;
      case 'frame-extractor': return (await import('@/processors/frameExtractor')).frameExtractor;
      case 'audio-converter': return (await import('@/processors/audioConverter')).audioConverter;
      case 'audio-splitter': return (await import('@/processors/audioSplitter')).audioSplitter;
      case 'voice-changer': return (await import('@/processors/voiceChanger')).voiceChanger;
      case 'text-to-speech': return async (file: File | string, options: any) => { return file; };
      
      // PDF PROCESSORS
      case 'pdf-page-manager': return (await import('@/processors/pdfPageManager')).pdfPageManager;
      case 'pdf-from-images':
      case 'pdf-merger':
      case 'pdf-remove-page':
      case 'pdf-split':
      case 'pdf-reorder':
      case 'pdf-rotate':
        return async (file: File | string, options: any) => { return file; };
      case 'pdf-compress': return (await import('@/processors/pdfCompressor')).pdfCompressor;
      case 'pdf-converter': return (await import('@/processors/pdfFormatConverter')).pdfFormatConverter;

      default:
        console.error(`No processor found for tool: ${toolId}`);
        return null;
    }
  } catch (error) {
    console.error(`Failed to load processor for ${toolId}:`, error);
    return null;
  }
}

export default function MarvelousStudio() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<MediaType>('image');
  const [selectedTool, setSelectedTool] = useState<ToolMetadata | null>(null);
  const [processor, setProcessor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProcessor, setIsLoadingProcessor] = useState(false);

  const tools = toolRegistry
    .filter(t => t.category === activeTab)
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleToolSelect = async (tool: ToolMetadata) => {
    setSelectedTool(tool);
    setIsLoadingProcessor(true);
    try {
      const loadedProcessor = await loadProcessor(tool.id);
      const processorInstance = typeof loadedProcessor === 'function' ? { process: loadedProcessor } : loadedProcessor;
      setProcessor(processorInstance);
    } catch (error) {
      console.error('Failed to load processor:', error);
      setProcessor(null);
    } finally {
      setIsLoadingProcessor(false);
    }
  };

  const handleTabChange = (tab: MediaType) => {
    setActiveTab(tab);
    setSelectedTool(null);
    setProcessor(null);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 overflow-hidden relative font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.section key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }} transition={{ duration: 0.8 }} className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-20">
              <h1 className="text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">CREative suite</h1>
              <div className="h-1 w-24 bg-cyan-500 mx-auto rounded-full shadow-[0_0_20px_rgba(6,182,212,0.8)]" />
            </motion.div>

            <div className="flex gap-10 max-w-6xl w-full">
              {[{ type: 'image', icon: ImageIcon, desc: 'AI Visual Processing' }, { type: 'video', icon: Video, desc: 'Professional Motion Tools' }, { type: 'audio', icon: Music, desc: 'Studio Grade Audio' }, { type: 'pdf', icon: FileText, desc: 'Document Workflows' }].map((item) => (
                <motion.button key={item.type} layoutId={`card-${item.type}`} whileHover={{ y: -15, rotateX: 5, rotateY: -5 }} onClick={() => { setActiveTab(item.type as MediaType); setView('dashboard'); }} className="flex-1 aspect-[3/4] rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-10 flex flex-col items-center justify-between group shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><item.icon className="w-10 h-10 text-white" /></div>
                  <div className="text-center relative z-10">
                    <h2 className="text-4xl font-black uppercase tracking-widest">{item.type}</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase mt-3 tracking-[0.3em]">{item.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex h-screen">
            <aside className="w-80 border-r border-white/10 bg-black/40 backdrop-blur-3xl p-8 flex flex-col z-20">
              <button onClick={() => { setView('landing'); setSelectedTool(null); setProcessor(null); }} className="flex items-center gap-3 text-zinc-500 hover:text-white transition-all mb-16 group text-[10px] font-black uppercase tracking-[0.3em]"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return Home</button>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {toolRegistry.filter(t => t.category === activeTab).map(tool => (
                  <button key={tool.id} disabled={tool.status === 'soon'} onClick={() => tool.status === 'ready' && handleToolSelect(tool)} className={`w-full text-left px-6 py-4 rounded-2xl text-[13px] font-bold transition-all border flex items-center justify-between ${selectedTool?.id === tool.id ? 'bg-white text-black border-white shadow-[0_0_40px_rgba(255,255,255,0.15)]' : tool.status === 'soon' ? 'bg-white/5 text-zinc-800 border-white/5 opacity-40 cursor-not-allowed' : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/20 hover:text-white'}`}>
                    {tool.name}
                    {tool.status === 'soon' && <span className="text-[8px] opacity-50 uppercase">Soon</span>}
                  </button>
                ))}
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-16 relative">
              <AnimatePresence mode="wait">
                {!selectedTool ? (
                  <motion.div key={`grid-${activeTab}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
                    <div className="flex items-center justify-between mb-20">
                      <nav className="flex gap-16">
                        {(['image', 'video', 'audio', 'pdf'] as MediaType[]).map((tab) => (
                          <button key={tab} onClick={() => handleTabChange(tab)} className={`text-xs font-black uppercase tracking-[0.4em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                            {tab}
                            {activeTab === tab && <motion.div layoutId="nav-line" className="absolute -bottom-4 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />}
                          </button>
                        ))}
                      </nav>
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-cyan-500 transition-colors" />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm w-80 focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700 font-bold" placeholder="Search tools..." />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                      {tools.map((tool) => (
                        <motion.button key={tool.id} whileHover={tool.status === 'ready' ? { scale: 1.03, y: -10 } : {}} onClick={() => tool.status === 'ready' && handleToolSelect(tool)} className={`group h-[340px] rounded-[3.5rem] border p-12 flex flex-col justify-between items-start text-left relative overflow-hidden backdrop-blur-md transition-all ${tool.status === 'ready' ? 'bg-white/5 border-white/10 hover:border-cyan-500/50 shadow-2xl hover:shadow-cyan-500/10' : 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'}`}>
                          {tool.status === 'soon' && (
                            <div className="absolute top-8 right-8 overflow-hidden rounded-full bg-zinc-900 border border-white/10 px-3 py-1">
                              <span className="relative z-10 text-[10px] font-black uppercase tracking-widest text-zinc-500">Soon</span>
                              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
                            </div>
                          )}
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border transition-all duration-500 ${tool.status === 'ready' ? 'bg-white/5 border-white/10 group-hover:bg-white group-hover:text-black' : 'bg-zinc-900 border-white/5'}`}><tool.icon className="w-7 h-7" /></div>
                          <div>
                            <h3 className={`text-2xl font-black tracking-tight mb-3 transition-colors ${tool.status === 'ready' ? 'group-hover:text-cyan-400' : 'text-zinc-600'}`}>{tool.name}</h3>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed line-clamp-2">{tool.description}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="workspace" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }} className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-12">
                      <button onClick={() => { setSelectedTool(null); setProcessor(null); }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Suite</button>
                      <div className="flex items-center gap-3 px-6 py-2 bg-white text-black rounded-full text-xs font-black tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]"><Sparkles className="w-4 h-4" /> {selectedTool.name}</div>
                    </div>

                    <div className="bg-black border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl relative">
                      {isLoadingProcessor ? (
                        <div className="h-[600px] flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <div className="w-12 h-12 mx-auto border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Loading Processor...</p>
                          </div>
                        </div>
                      ) : processor ? (
                        <UniversalWorkspace
                          key={selectedTool.id}
                          tool={selectedTool}
                          onProcess={async (file: File, opts: any) => {
                            try {
                              if (typeof processor.process === 'function') { return await processor.process(file, opts); }
                              else if (typeof processor === 'function') { return await processor(file, opts); }
                              else { throw new Error("Invalid processor structure"); }
                            } catch (error) { console.error('Processing error:', error); throw error; }
                          }}
                        />
                      ) : (
                        <div className="h-[600px] flex items-center justify-center">
                          <div className="text-center space-y-4">
                            <p className="text-xs font-black uppercase tracking-wider text-red-500">Processor not available</p>
                            <p className="text-xs text-zinc-600">Please check console for errors</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        @keyframes shine { to { transform: translateX(200%); } }
        .animate-shine { animation: shine 2s infinite; }
      `}</style>
    </div>
  );
}