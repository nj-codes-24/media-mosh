import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, ChevronRight, Pencil, X } from 'lucide-react';

export const WaveformPlayer = ({
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

export const TranscriptItem = ({
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
