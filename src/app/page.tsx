'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Music, ArrowLeft, FileText, Search } from 'lucide-react';
import { toolRegistry, ToolMetadata, MediaType } from '@/lib/toolRegistry';
import UniversalWorkspace from '@/components/UniversalWorkspace';

async function loadProcessor(toolId: string) {
  try {
    switch (toolId) {
      case 'bg-remover':        return (await import('@/processors/bgremover')).bgRemoverProcessor;
      case 'exif-remover':      return (await import('@/processors/exifremover')).exifRemoverProcessor;
      case 'img-compressor':    return (await import('@/processors/imagecompressor')).imageCompressorProcessor;
      case 'palette-generator': return (await import('@/processors/paletteGenerator')).paletteGenerator;
      case 'photo-restore':     return (await import('@/processors/photoRestorer')).photoRestorer;
      case 'image-converter':   return (await import('@/processors/imageFormatConverter')).imageFormatConverter;
      case 'ai-upscale':        return (await import('@/processors/imageUpscaler')).imageUpscaler;
      case 'auto-subtitle':     return (await import('@/processors/subtitleProcessor')).subtitleProcessor;
      case 'video-compressor':  return (await import('@/processors/videocompressor')).videoCompressorProcessor;
      case 'audio-extraction':  return (await import('@/processors/audioextraction')).audioExtractionProcessor;
      case 'video-stabilizer':  return (await import('@/processors/videoStabilizer')).videoStabilizer;
      case 'video-bg-remover':  return (await import('@/processors/videoBgRemover')).videoBgRemoverProcessor;
      case 'frame-extractor':   return (await import('@/processors/frameExtractor')).frameExtractor;
      case 'audio-converter':   return (await import('@/processors/audioConverter')).audioConverter;
      case 'audio-splitter':    return (await import('@/processors/audioSplitter')).audioSplitter;
      case 'voice-changer':     return (await import('@/processors/voiceChanger')).voiceChanger;
      case 'text-to-speech':    return async (f: File | string) => f;
      case 'pdf-page-manager':  return (await import('@/processors/pdfPageManager')).pdfPageManager;
      case 'pdf-from-images': case 'pdf-merger': case 'pdf-remove-page':
      case 'pdf-split': case 'pdf-reorder': case 'pdf-rotate':
        return async (f: File | string) => f;
      case 'pdf-compress':      return (await import('@/processors/pdfCompressor')).pdfCompressor;
      case 'pdf-converter':     return (await import('@/processors/pdfFormatConverter')).pdfFormatConverter;
      default: return null;
    }
  } catch (e) { console.error(e); return null; }
}

const CATS = [
  { type: 'image' as MediaType, icon: ImageIcon, label: 'IMAGE', desc: 'AI Visual Processing' },
  { type: 'video' as MediaType, icon: Video,     label: 'VIDEO', desc: 'Professional Motion'  },
  { type: 'audio' as MediaType, icon: Music,     label: 'AUDIO', desc: 'Studio Grade Audio'   },
  { type: 'pdf'   as MediaType, icon: FileText,  label: 'PDF',   desc: 'Document Workflows'   },
];

// ─── Marquee ──────────────────────────────────────────────────────────────────
function Marquee() {
  const items = ['BG REMOVAL','AI UPSCALE','VIDEO COMPRESS','AUDIO SPLIT','PDF MERGE','VOICE CHANGER','FRAME EXTRACT','PHOTO RESTORE','FORMAT CONVERT','AUTO SUBTITLE'];
  const all = [...items,...items,...items,...items];
  return (
    <div style={{ overflow:'hidden', whiteSpace:'nowrap', display:'flex', width:'100%' }}>
      <motion.div style={{ display:'flex', gap:28, alignItems:'center', flexShrink:0 }}
        animate={{ x:['0%','-50%'] }} transition={{ duration:28, ease:'linear', repeat:Infinity }}>
        {all.map((t,i) => (
          <span key={i} style={{ fontSize:10, fontFamily:'DM Mono,monospace', fontWeight:700, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', gap:16 }}>
            {t}<span style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,68,0,0.45)', display:'inline-block' }}/>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Ambient Background ───────────────────────────────────────────────────────
function AmbientBg() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'42%', left:'60%', transform:'translate(-50%,-50%)', width:720, height:580, background:'radial-gradient(ellipse,rgba(255,68,0,0.07) 0%,transparent 70%)', filter:'blur(60px)', borderRadius:'50%' }}/>
      <svg width="100%" height="100%" style={{ position:'absolute', inset:0 }} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="ob"><feGaussianBlur stdDeviation="3"/></filter>
          <filter id="dg"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g transform="translate(900,445)">
          <ellipse cx="0" cy="0" rx="340" ry="128" fill="none" stroke="rgba(255,68,0,0.07)" strokeWidth="14" filter="url(#ob)" transform="rotate(-15)"/>
          <ellipse cx="0" cy="0" rx="340" ry="128" fill="none" stroke="rgba(255,68,0,0.38)" strokeWidth="1" transform="rotate(-15)"/>
          <motion.g animate={{ rotate:[0,360] }} transition={{ duration:14, repeat:Infinity, ease:'linear' }}>
            <circle cx="340" cy="0" r="8" fill="rgba(255,130,30,0.9)" filter="url(#dg)"/>
            <circle cx="340" cy="0" r="3.5" fill="white" opacity="0.95"/>
            <line x1="295" y1="-6" x2="335" y2="-0.5" stroke="rgba(255,100,20,0.45)" strokeWidth="3.5" strokeLinecap="round"/>
          </motion.g>
        </g>
        <g transform="translate(900,455)">
          <ellipse cx="0" cy="0" rx="230" ry="86" fill="none" stroke="rgba(255,68,0,0.04)" strokeWidth="10" filter="url(#ob)" transform="rotate(10)"/>
          <ellipse cx="0" cy="0" rx="230" ry="86" fill="none" stroke="rgba(255,68,0,0.25)" strokeWidth="0.8" transform="rotate(10)"/>
          <motion.g animate={{ rotate:[360,0] }} transition={{ duration:20, repeat:Infinity, ease:'linear' }}>
            <circle cx="230" cy="0" r="5.5" fill="rgba(255,120,30,0.85)" filter="url(#dg)"/>
            <circle cx="230" cy="0" r="2" fill="white" opacity="0.9"/>
          </motion.g>
        </g>
        <g transform="translate(900,440)">
          <ellipse cx="0" cy="0" rx="136" ry="52" fill="none" stroke="rgba(255,68,0,0.2)" strokeWidth="0.7" transform="rotate(-25)"/>
          <motion.g animate={{ rotate:[0,360] }} transition={{ duration:9, repeat:Infinity, ease:'linear' }}>
            <circle cx="136" cy="0" r="4" fill="rgba(255,140,40,0.9)" filter="url(#dg)"/>
            <circle cx="136" cy="0" r="1.5" fill="white" opacity="0.9"/>
          </motion.g>
        </g>
        {Array.from({length:10}).map((_,i)=><line key={i} x1={0} y1={520+i*38} x2={1440} y2={520+i*38} stroke={`rgba(255,68,0,${0.025*(1-i/10)})`} strokeWidth="0.4"/>)}
        {Array.from({length:18}).map((_,i)=><line key={i} x1={i*90} y1={520} x2={i*90} y2={900} stroke={`rgba(255,68,0,${0.018*(1-Math.abs(i-9)/9)})`} strokeWidth="0.4"/>)}
        <g stroke="rgba(255,68,0,0.18)" strokeWidth="1.2" fill="none">
          <path d="M22 22L22 52M22 22L52 22"/><path d="M1418 22L1418 52M1418 22L1388 22"/>
          <path d="M22 878L22 848M22 878L52 878"/><path d="M1418 878L1418 848M1418 878L1388 878"/>
        </g>
        <g opacity="0.12">
          <circle cx="1310" cy="140" r="24" fill="none" stroke="#FF4400" strokeWidth="0.8"/>
          <circle cx="1310" cy="140" r="15" fill="none" stroke="#FF4400" strokeWidth="0.4"/>
          <line x1="1286" y1="140" x2="1300" y2="140" stroke="#FF4400" strokeWidth="0.8"/>
          <line x1="1320" y1="140" x2="1334" y2="140" stroke="#FF4400" strokeWidth="0.8"/>
          <line x1="1310" y1="116" x2="1310" y2="130" stroke="#FF4400" strokeWidth="0.8"/>
          <line x1="1310" y1="150" x2="1310" y2="164" stroke="#FF4400" strokeWidth="0.8"/>
        </g>
      </svg>
      <div className="grain-overlay" style={{ position:'absolute', inset:0, opacity:0.04 }}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA SVG
// ═══════════════════════════════════════════════════════════════════════════════
function Camera({ onSelect }: { onSelect: (t: MediaType) => void }) {
  const [hov, setHov] = useState<string|null>(null);

  const VW = 800, VH = 500;
  const DW = 720, DH = 450;
  const scale = DW / VW;

  const LCD = { x: 36, y: 94, w: 500, h: 356 };

  return (
    <div style={{ position:'relative', width:DW, height:DH }}>
      <div style={{ position:'absolute', inset:0, filter:'drop-shadow(0 28px 60px rgba(0,0,0,0.95)) drop-shadow(0 0 50px rgba(255,68,0,0.07))' }}>
        <svg width={DW} height={DH} viewBox={`0 0 ${VW} ${VH}`} style={{ display:'block' }}>
          <defs>
            <linearGradient id="body" x1="0%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#2e2b28"/><stop offset="50%" stopColor="#1a1815"/><stop offset="100%" stopColor="#0d0c0b"/>
            </linearGradient>
            <linearGradient id="topplate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#383330"/><stop offset="100%" stopColor="#1e1b18"/>
            </linearGradient>
            <linearGradient id="grip" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a0908"/><stop offset="100%" stopColor="#161412"/>
            </linearGradient>
            <radialGradient id="shutter-btn" cx="38%" cy="28%" r="72%">
              <stop offset="0%" stopColor="#FF6633"/><stop offset="100%" stopColor="#BB1800"/>
            </radialGradient>
            <linearGradient id="dial-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3c3830"/><stop offset="100%" stopColor="#211f1b"/>
            </linearGradient>
            <linearGradient id="lcd-screen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f0d0a"/><stop offset="100%" stopColor="#040302"/>
            </linearGradient>
            <filter id="glow-soft">
              <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="lcd-glow">
              <feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* MAIN BODY */}
          <rect x="2" y="72" width="796" height="408" rx="18" fill="url(#body)"/>
          <rect x="2" y="72" width="796" height="3" rx="2" fill="rgba(255,255,255,0.045)"/>
          <rect x="8" y="462" width="784" height="14" rx="7" fill="rgba(0,0,0,0.6)"/>

          {/* GRIP */}
          <path d="M600,72 Q642,72 668,92 L694,135 L710,480 L600,480 Z" fill="url(#grip)"/>
          <path d="M602,74 Q638,74 663,94 L689,137 L705,478 L602,478 Z" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>

          {/* TOP PLATE */}
          <rect x="2" y="2" width="796" height="72" rx="14" fill="url(#topplate)"/>
          <rect x="2" y="62" width="796" height="12" fill="rgba(0,0,0,0.38)"/>
          <rect x="2" y="2" width="796" height="2.5" rx="1.5" fill="rgba(255,255,255,0.08)"/>

          {/* VIEWFINDER HUMP */}
          <rect x="170" y="0" width="148" height="32" rx="8" fill="#1c1a17"/>
          <rect x="180" y="2" width="128" height="24" rx="5" fill="#111009" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
          <rect x="188" y="5" width="112" height="16" rx="4" fill="rgba(16,24,44,0.95)" stroke="rgba(255,68,0,0.16)" strokeWidth="0.8"/>
          <rect x="194" y="7" width="28" height="3" rx="1" fill="rgba(255,255,255,0.05)"/>
          <rect x="266" y="7" width="28" height="3" rx="1" fill="rgba(255,255,255,0.05)"/>

          <rect x="218" y="0" width="68" height="6" rx="1.5" fill="#2a2720" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
          {[226,234,242,250,258,266,274,282].map((x,i)=>(
            <line key={i} x1={x} y1="0" x2={x} y2="6" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>
          ))}

          {/* MODE DIAL */}
          <circle cx="96" cy="38" r="34" fill="url(#dial-grad)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4"/>
          <circle cx="96" cy="38" r="28" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="0.8"/>
          {Array.from({length:20}).map((_,i)=>{
            const a=(i/20)*Math.PI*2-Math.PI/2;
            return <line key={i} x1={96+26*Math.cos(a)} y1={38+26*Math.sin(a)} x2={96+33*Math.cos(a)} y2={38+33*Math.sin(a)} stroke="rgba(255,255,255,0.1)" strokeWidth="1.3"/>;
          })}
          <circle cx="96" cy="38" r="18" fill="#131110" stroke="rgba(255,68,0,0.3)" strokeWidth="1"/>
          <text x="96" y="44" textAnchor="middle" fill="rgba(255,68,0,0.95)" fontSize="13" fontFamily="DM Mono,monospace" fontWeight="700">M</text>
          {[['A',-78],['S',-48],['P',-16],['C1',18],['C2',50],['AUTO',82]].map(([lbl,deg],i)=>{
            const a=(Number(deg)-90)*Math.PI/180;
            return <text key={i} x={96+42*Math.cos(a)} y={38+42*Math.sin(a)+3} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="6.5" fontFamily="DM Mono,monospace">{lbl as string}</text>;
          })}
          <line x1="96" y1="6" x2="96" y2="10" stroke="rgba(255,68,0,0.8)" strokeWidth="2" strokeLinecap="round"/>

          {/* SHUTTER BUTTON */}
          <circle cx="626" cy="34" r="24" fill="#232019" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2"/>
          <circle cx="626" cy="34" r="18" fill="url(#shutter-btn)"/>
          <circle cx="626" cy="34" r="12" fill="rgba(255,50,0,0.72)"/>
          <ellipse cx="620" cy="28" rx="6" ry="3.5" fill="rgba(255,255,255,0.24)" transform="rotate(-22 620 28)"/>

          {/* EXPOSURE DIAL */}
          <circle cx="680" cy="38" r="20" fill="#1c1b17" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
          {Array.from({length:14}).map((_,i)=>{
            const a=(i/14)*Math.PI*2;
            return <line key={i} x1={680+14*Math.cos(a)} y1={38+14*Math.sin(a)} x2={680+19*Math.cos(a)} y2={38+19*Math.sin(a)} stroke="rgba(255,255,255,0.08)" strokeWidth="1.3"/>;
          })}
          <circle cx="680" cy="38" r="9" fill="#131211" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>

          {/* TOP-RIGHT BUTTONS */}
          {[[574,22,10],[544,20,9],[516,20,9]].map(([cx,cy,r],i)=>(
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="#1e1c18" stroke="rgba(255,255,255,0.1)" strokeWidth="0.9"/>
            </g>
          ))}
          <text x="574" y="26" textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="7" fontFamily="DM Mono,monospace">▶</text>
          <text x="544" y="24" textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="6.5" fontFamily="DM Mono,monospace">MENU</text>
          <text x="516" y="24" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="6.5" fontFamily="DM Mono,monospace">INFO</text>

          {/* TOP LCD PANEL */}
          <rect x="420" y="10" width="112" height="50" rx="5" fill="#070707" stroke="rgba(255,68,0,0.24)" strokeWidth="0.9"/>
          <rect x="424" y="14" width="104" height="42" rx="3" fill="rgba(255,68,0,0.02)"/>
          <text x="476" y="32" textAnchor="middle" fill="rgba(255,68,0,0.72)" fontSize="12" fontFamily="DM Mono,monospace" letterSpacing="1">1/250</text>
          <text x="428" y="48" fill="rgba(255,255,255,0.28)" fontSize="8.5" fontFamily="DM Mono,monospace">f/2.8</text>
          <text x="478" y="48" fill="rgba(255,255,255,0.22)" fontSize="8.5" fontFamily="DM Mono,monospace">ISO800</text>

          {/* D-pad ring */}
          <circle cx="686" cy="330" r="36" fill="#0d0d0d" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2"/>
          <circle cx="686" cy="330" r="15" fill="#0b0a09" stroke="rgba(255,68,0,0.22)" strokeWidth="1"/>
          {[['▲',686,302],['▼',686,358],['◀',658,330],['▶',714,330]].map(([s,x,y])=>(
            <text key={s as string} x={x as number} y={(y as number)+3.5} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="sans-serif">{s as string}</text>
          ))}
          <text x="686" y="334.5" textAnchor="middle" fill="rgba(255,68,0,0.6)" fontSize="8.5" fontFamily="DM Mono,monospace" fontWeight="700">OK</text>

          {/* Scroll wheel / rear dial */}
          <circle cx="752" cy="258" r="30" fill="#151412" stroke="rgba(255,255,255,0.09)" strokeWidth="1.1"/>
          {Array.from({length:20}).map((_,i)=>{
            const a=(i/20)*Math.PI*2;
            return <line key={i} x1={752+23*Math.cos(a)} y1={258+23*Math.sin(a)} x2={752+29*Math.cos(a)} y2={258+29*Math.sin(a)} stroke="rgba(255,255,255,0.09)" strokeWidth="1.5"/>;
          })}
          <circle cx="752" cy="258" r="13" fill="#0d0c0b" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>
          <text x="752" y="262.5" textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="6" fontFamily="DM Mono,monospace">DIAL</text>

          {/* Small function buttons */}
          {[[582,380,13],[618,374,11.5],[652,380,12.5]].map(([cx,cy,r],i)=>(
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="#141312" stroke="rgba(255,255,255,0.09)" strokeWidth="0.8"/>
            </g>
          ))}
          <text x="582" y="384" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="DM Mono,monospace">AE-L</text>
          <text x="618" y="378" textAnchor="middle" fill="rgba(255,255,255,0.13)" fontSize="6" fontFamily="DM Mono,monospace">AF-L</text>
          <text x="652" y="384" textAnchor="middle" fill="rgba(255,68,0,0.38)" fontSize="7" fontFamily="DM Mono,monospace">AF</text>

          {/* LARGE LEFT/CENTER LCD SCREEN BEZEL */}
          <rect x={LCD.x-4} y={LCD.y-4} width={LCD.w+8} height={LCD.h+8} rx="10" fill="#0c0a08" stroke="rgba(255,68,0,0.38)" strokeWidth="1.8"/>
          <rect x={LCD.x} y={LCD.y} width={LCD.w} height={LCD.h} rx="7" fill="url(#lcd-screen)"/>
          <rect x={LCD.x-4} y={LCD.y-4} width={LCD.w+8} height={LCD.h+8} rx="10" fill="none" stroke="rgba(255,68,0,0.1)" strokeWidth="10" filter="url(#lcd-glow)"/>
          <rect x={LCD.x+2} y={LCD.y+2} width={LCD.w-4} height={LCD.h*0.3} rx="6" fill="rgba(255,255,255,0.022)"/>

          {/* SD / PORT DOOR */}
          <rect x="774" y="200" width="22" height="88" rx="7" fill="#161412" stroke="rgba(255,255,255,0.07)" strokeWidth="0.9"/>
          <line x1="785" y1="214" x2="785" y2="278" stroke="rgba(255,255,255,0.04)" strokeWidth="0.9" strokeDasharray="4 8"/>
          <text x="784" y="218" textAnchor="middle" fill="rgba(255,255,255,0.08)" fontSize="6.5" fontFamily="DM Mono,monospace" transform="rotate(90 784 218)">SD</text>

          {/* BOTTOM PLATE */}
          <rect x="2" y="474" width="796" height="24" rx="10" fill="#0d0c0b" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
          <text x="28" y="489" fill="rgba(255,255,255,0.05)" fontSize="7" fontFamily="DM Mono,monospace" letterSpacing="1.5">SN: MM-X1-2025  MADE FOR CREATORS</text>
          <circle cx="330" cy="486" r="8.5" fill="#090808" stroke="rgba(255,255,255,0.1)" strokeWidth="0.9"/>
          <line x1="323" y1="486" x2="337" y2="486" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9"/>
          <line x1="330" y1="479" x2="330" y2="493" stroke="rgba(255,255,255,0.14)" strokeWidth="0.9"/>
          <rect x="380" y="476" width="52" height="18" rx="4" fill="#0b0a09" stroke="rgba(255,255,255,0.08)" strokeWidth="0.7"/>
          <text x="406" y="488" textAnchor="middle" fill="rgba(255,255,255,0.07)" fontSize="6" fontFamily="DM Mono,monospace">BATT</text>
        </svg>
      </div>

      {/* HTML LCD OVERLAY */}
      <div style={{
        position: 'absolute',
        left:  Math.round(LCD.x * scale),
        top:   Math.round(LCD.y * scale),
        width: Math.round(LCD.w * scale),
        height:Math.round(LCD.h * scale),
        borderRadius: 6,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 40% 30%, #0e0c09 0%, #040302 100%)',
      }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,0,0,0.065) 0px,rgba(0,0,0,0.065) 1px,transparent 1px,transparent 4px)', pointerEvents:'none', zIndex:10 }}/>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'30%', background:'linear-gradient(180deg,rgba(255,255,255,0.03) 0%,transparent 100%)', pointerEvents:'none', zIndex:11 }}/>

        <div style={{ position:'relative', zIndex:20, display:'flex', flexDirection:'column', height:'100%', padding:'20px 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <motion.span animate={{ opacity:[1,0.15,1] }} transition={{ duration:1.5, repeat:Infinity }}
                style={{ width:5, height:5, borderRadius:'50%', background:'#FF4400', boxShadow:'0 0 8px #FF4400', display:'inline-block' }}/>
              <span style={{ fontSize:7, fontFamily:'DM Mono,monospace', letterSpacing:'0.4em', color:'rgba(255,68,0,0.65)', textTransform:'uppercase' }}>Select Mode</span>
            </div>
            <span style={{ fontSize:6, fontFamily:'DM Mono,monospace', color:'rgba(255,255,255,0.12)', letterSpacing:'0.22em' }}>MM-STUDIO</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16, flex:1, margin:'2px 0' }}>
            {CATS.map((cat, i) => (
              <motion.button
                key={cat.type}
                initial={{ opacity:0, scale:0.92 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay:i*0.05, duration:0.3, ease:[0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setHov(cat.type)}
                onMouseLeave={() => setHov(null)}
                onClick={() => onSelect(cat.type)}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.96, transition: { duration: 0.1, ease: 'easeOut' } }}
                style={{
                  background: hov===cat.type ? 'rgba(255,68,0,0.15)' : 'rgba(255,255,255,0.035)',
                  border: `1px solid ${hov===cat.type ? 'rgba(255,68,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex', flexDirection:'column', alignItems:'flex-start', justifyContent: 'center', gap:10,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: hov===cat.type ? '0 0 24px rgba(255,68,0,0.15)' : 'none',
                  textAlign: 'left',
                  position: 'relative', overflow:'hidden',
                }}
              >
                {/* Continuous glassy shimmer effect to signify clickability */}
                <div className="shimmer-container" style={{ animationDelay: `${i * 0.15}s` }} />
                
                {hov===cat.type && <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,68,0,0.08) 0%,transparent 55%)', pointerEvents:'none' }}/>}
                <cat.icon style={{ width:18, height:18, color:hov===cat.type?'#FF4400':'rgba(255,255,255,0.42)', transition:'color 0.2s ease', flexShrink:0, marginBottom:2, position:'relative', zIndex:2 }}/>
                <div style={{ position:'relative', zIndex:2 }}>
                  <div style={{ fontSize:15, fontFamily:'Bebas Neue,sans-serif', letterSpacing:'0.14em', color:hov===cat.type?'#FF4400':'rgba(255,255,255,0.88)', lineHeight:1, transition:'color 0.2s ease' }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize:6.5, fontFamily:'DM Mono,monospace', letterSpacing:'0.18em', color:'rgba(255,255,255,0.22)', textTransform:'uppercase', marginTop:8 }}>
                    {cat.desc}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
            <span style={{ fontSize:5.5, fontFamily:'DM Mono,monospace', color:'rgba(255,255,255,0.09)', letterSpacing:'0.18em' }}>30+ TOOLS READY</span>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ duration:2.2, repeat:Infinity }}
                style={{ width:4, height:4, borderRadius:'50%', background:'#34d399', boxShadow:'0 0 6px #34d399', display:'inline-block' }}/>
              <span style={{ fontSize:5.5, fontFamily:'DM Mono,monospace', color:'rgba(52,211,153,0.52)', letterSpacing:'0.18em' }}>LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────
function Landing({ onEnter }: { onEnter: (t: MediaType) => void }) {
  return (
    <motion.div key="landing" initial={{ opacity:0 }} animate={{ opacity:1 }}
      exit={{ scale:1.2, opacity:0, filter:'blur(20px)', transition:{ duration:0.65, ease:[0.4,0,0.2,1] } }}
      style={{ height:'100vh', background:'#080808', color:'white', overflow:'hidden', display:'flex', flexDirection:'column', fontFamily:"'DM Sans',sans-serif", position:'relative' }}
    >
      <AmbientBg/>

      {/* Top Nav completely empty for ultra-clean landing page */}
      <motion.nav initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.5 }}
        style={{ position:'relative', zIndex:60, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 44px', flexShrink:0, minHeight: 80 }}
      />

      <div style={{ flex:1, display:'flex', alignItems:'center', position:'relative', zIndex:20, minHeight:0, padding:'0 44px', overflow:'hidden' }}>
        <div style={{ width:'38%', flexShrink:0 }}>
          <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.18, duration:0.5 }}
            style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}
          >
            <div style={{ height:1, width:32, background:'#FF4400' }}/>
            <span style={{ fontSize:9.5, fontFamily:'DM Mono,monospace', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.44em', color:'#FF4400' }}>All-in-one platform</span>
          </motion.div>
          <div style={{ overflow:'hidden' }}>
            <motion.h1 initial={{ y:110 }} animate={{ y:0 }} transition={{ delay:0.22, duration:0.85, ease:[0.22,1,0.36,1] }}
              style={{ margin:0, fontFamily:'Bebas Neue,sans-serif', fontSize:'clamp(96px,12vw,165px)', fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', color:'white', lineHeight:0.86 }}
            >MEDIA</motion.h1>
          </div>
          <div style={{ overflow:'hidden' }}>
            <motion.h1 initial={{ y:110 }} animate={{ y:0 }} transition={{ delay:0.33, duration:0.85, ease:[0.22,1,0.36,1] }}
              style={{ margin:0, fontFamily:'Bebas Neue,sans-serif', fontSize:'clamp(96px,12vw,165px)', fontWeight:900, textTransform:'uppercase', letterSpacing:'-0.01em', lineHeight:0.86, WebkitTextStroke:'2.5px rgba(255,255,255,0.13)', color:'transparent' }}
            >MOSH</motion.h1>
          </div>
        </div>

        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minWidth:0, position:'relative' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:720, height:500, background:'radial-gradient(ellipse,rgba(255,68,0,0.065) 0%,transparent 68%)', filter:'blur(55px)', borderRadius:'50%', pointerEvents:'none' }}/>
          <motion.div animate={{ y:[0,-9,0] }} transition={{ duration:5, repeat:Infinity, ease:'easeInOut' }}>
            <Camera onSelect={onEnter}/>
          </motion.div>
        </div>
      </div>

      <div style={{ position:'relative', zIndex:20, borderTop:'1px solid rgba(255,255,255,0.05)', padding:'11px 0', flexShrink:0 }}>
        <Marquee/>
      </div>
    </motion.div>
  );
}

// ─── Corner Reticle (Uses standard absolute HTML divs to guarantee perfect sizing) ───
function CornerMarks({ color = 'rgba(255,255,255,0.15)', size = 10, thickness = 1.5 }: { color?: string; size?: number; thickness?: number }) {
  const t = thickness; 
  const l = size;  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Top Left */}
      <div style={{ position:'absolute', top:0, left:0, width:l, height:t, background:color }} />
      <div style={{ position:'absolute', top:0, left:0, width:t, height:l, background:color }} />
      {/* Top Right */}
      <div style={{ position:'absolute', top:0, right:0, width:l, height:t, background:color }} />
      <div style={{ position:'absolute', top:0, right:0, width:t, height:l, background:color }} />
      {/* Bottom Left */}
      <div style={{ position:'absolute', bottom:0, left:0, width:l, height:t, background:color }} />
      <div style={{ position:'absolute', bottom:0, left:0, width:t, height:l, background:color }} />
      {/* Bottom Right */}
      <div style={{ position:'absolute', bottom:0, right:0, width:l, height:t, background:color }} />
      <div style={{ position:'absolute', bottom:0, right:0, width:t, height:l, background:color }} />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ activeTab, setActiveTab, selectedTool, setSelectedTool, processor, setProcessor, searchQuery, setSearchQuery, isLoading, setIsLoading, onHome }: {
  activeTab: MediaType; setActiveTab: (t: MediaType) => void;
  selectedTool: ToolMetadata | null; setSelectedTool: (t: ToolMetadata | null) => void;
  processor: any; setProcessor: (p: any) => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
  isLoading: boolean; setIsLoading: (v: boolean) => void;
  onHome: () => void;
}) {
  const tools = toolRegistry.filter(t=>t.category===activeTab).filter(t=>t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortedTools = [...tools.filter(t=>t.status==='ready'), ...tools.filter(t=>t.status==='soon')];

  const handleToolSelect = async (tool: ToolMetadata) => {
    setSelectedTool(tool); setIsLoading(true);
    try {
      const lp = await loadProcessor(tool.id);
      setProcessor(typeof lp==='function' ? { process:lp } : lp);
    } catch(e) { console.error(e); setProcessor(null); }
    finally { setIsLoading(false); }
  };

  const handleTabChange = (tab: MediaType) => {
    setActiveTab(tab); setSelectedTool(null); setProcessor(null); setSearchQuery('');
  };

  return (
    <motion.div key="dashboard"
      initial={{ opacity:0, scale:0.97, filter:'blur(14px)' }}
      animate={{ opacity:1, scale:1, filter:'blur(0px)', transition:{ duration:0.55, ease:[0.22,1,0.36,1] } }}
      exit={{ opacity:0, transition:{ duration:0.25 } }}
      style={{ display:'flex', height:'100vh', background:'#070707' }}
    >

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <aside style={{
        width: 228,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        background: 'linear-gradient(180deg,#0e0e0e 0%,#090909 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
      }}>
        <div style={{ position:'absolute', top:0, right:0, width:1, height:'100%', background:'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)', pointerEvents:'none' }}/>

        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {/* Viewfinder Logo (Interactive for Home Button) */}
          <button onClick={onHome} className="logo-btn" style={{ background:'none', border:'none', cursor:'pointer', padding:0, textAlign:'left', outline:'none', display:'block', width:'100%' }}>
            <div style={{ position: 'relative', padding: '12px 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width:'100%' }}>
              
              {/* Permanent Orange Viewfinder Corners */}
              <div className="logo-c" style={{ position:'absolute', top:0, left:0, width:10, height:1.5, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', top:0, left:0, width:1.5, height:10, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', top:0, right:0, width:10, height:1.5, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', top:0, right:0, width:1.5, height:10, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', bottom:0, left:0, width:10, height:1.5, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', bottom:0, left:0, width:1.5, height:10, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', bottom:0, right:0, width:10, height:1.5, background:'#FF4400', transition:'all 0.2s' }} />
              <div className="logo-c" style={{ position:'absolute', bottom:0, right:0, width:1.5, height:10, background:'#FF4400', transition:'all 0.2s' }} />

              <span className="logo-label" style={{ position:'relative', zIndex:2, fontSize:11, fontFamily:'DM Mono,monospace', fontWeight:700, letterSpacing:'0.36em', textTransform:'uppercase', color:'rgba(255,255,255,0.7)', transition:'color 0.2s' }}>Media Mosh</span>
            </div>
          </button>
        </div>

        <div style={{ padding:'18px 20px 8px' }}>
          <p style={{ fontSize:7.5, fontFamily:'DM Mono,monospace', textTransform:'uppercase', letterSpacing:'0.4em', color:'rgba(255,255,255,0.18)' }}>Tools</p>
        </div>

        <div className="cscroll" style={{ flex:1, overflowY:'auto', padding:'2px 0 24px', display:'flex', flexDirection:'column', gap:0 }}>
          {toolRegistry.filter(t=>t.category===activeTab).map(tool => {
            const active = selectedTool?.id === tool.id;
            const soon   = tool.status === 'soon';
            return (
              <button key={tool.id} disabled={soon} onClick={()=>!soon && handleToolSelect(tool)}
                style={{
                  width:'100%', textAlign:'left',
                  padding:'10px 20px 10px 24px',
                  fontSize:12.5, fontWeight:500, letterSpacing:'-0.005em',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  background: 'none',
                  borderLeft: '2px solid transparent',
                  borderRight:'none', borderTop:'none', borderBottom:'none',
                  color: active ? 'rgba(255,255,255,0.92)' : soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  cursor: soon ? 'default' : 'pointer',
                  transition:'all 0.15s',
                  position:'relative',
                }}
                onMouseEnter={e=>{ if(!soon && !active){ e.currentTarget.style.color='rgba(255,255,255,0.92)'; e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}}
                onMouseLeave={e=>{ if(!soon && !active){ e.currentTarget.style.color='rgba(255,255,255,0.6)'; e.currentTarget.style.background='none'; }}}
              >
                <span style={{ fontFamily:"'DM Sans',sans-serif" }}>{tool.name}</span>
                
                {/* Clean, greyed-out SOON text for the sidebar to remain understated */}
                {soon && (
                  <span style={{ 
                    fontSize: 7.5, fontFamily: "'DM Mono', monospace", 
                    letterSpacing: '0.2em', color: 'rgba(255, 255, 255, 0.25)' 
                  }}>SOON</span>
                )}
                
                {active && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width:5, height:5, borderRadius:'50%', background:'#FF4400', boxShadow:'0 0 6px rgba(255,68,0,0.5)', flexShrink:0 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <main style={{ flex:1, overflowY:'auto', position:'relative', display:'flex', flexDirection:'column',
        background:'radial-gradient(ellipse at 60% 0%, rgba(255,68,0,0.055) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(255,68,0,0.025) 0%, transparent 45%), #080808',
      }}>
        <div className="grain-overlay" style={{ position:'absolute', inset:0, opacity:0.025, pointerEvents:'none', zIndex:0 }}/>

        {/* Top bar */}
        <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0,
          background:'rgba(8,8,8,0.7)', backdropFilter:'blur(12px)',
        }}>
          <div style={{
            display:'flex', alignItems:'center', gap:1,
            background:'rgba(0,0,0,0.55)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8,
            padding:'3px',
            boxShadow:'inset 0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}>
            {(['image','video','audio','pdf'] as MediaType[]).map(tab => {
              const active = activeTab === tab;
              return (
                <button key={tab} onClick={()=>handleTabChange(tab)}
                  style={{
                    padding:'6px 20px', borderRadius:5,
                    fontSize:9, fontFamily:'DM Mono,monospace', textTransform:'uppercase', letterSpacing:'0.26em', fontWeight:700,
                    background: active
                      ? 'linear-gradient(180deg, #FF5500 0%, #CC2200 100%)'
                      : 'none',
                    color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)',
                    border:'none', cursor:'pointer',
                    boxShadow: active
                      ? '0 1px 8px rgba(255,68,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset'
                      : 'inset 0 1px 3px rgba(0,0,0,0.5)',
                    transition:'all 0.18s',
                    position:'relative',
                  }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='rgba(255,255,255,0.28)'; }}
                >
                  {tab}
                  {active && (
                    <span style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'rgba(255,200,180,0.7)', display:'block' }}/>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ position:'relative' }}>
            <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', width:12, height:12, color:'rgba(255,255,255,0.2)' }}/>
            <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search tools…"
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.09)',
                borderRadius:6,
                padding:'8px 14px 8px 32px',
                fontSize:12.5, width:200, outline:'none',
                color:'rgba(255,255,255,0.75)',
                fontFamily:'DM Mono,monospace',
                letterSpacing:'0.03em',
                caretColor:'#FF4400',
                transition:'border-color 0.2s, box-shadow 0.2s',
                boxShadow:'inset 0 1px 4px rgba(0,0,0,0.4)',
              }}
              onFocus={e=>{ e.currentTarget.style.borderColor='rgba(255,68,0,0.45)'; e.currentTarget.style.boxShadow='inset 0 1px 4px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,68,0,0.1)'; }}
              onBlur={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow='inset 0 1px 4px rgba(0,0,0,0.4)'; }}
            />
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', position:'relative', zIndex:1 }}>
          <AnimatePresence mode="wait">
            {!selectedTool ? (
              <motion.div key={`grid-${activeTab}`}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                transition={{ duration:0.22 }}
                style={{ padding:'26px 32px 48px' }}
              >
                
                {/* Fresh, New Creative Category Text Style */}
                <div style={{ marginBottom:36, display:'flex', alignItems:'center' }}>
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: 50 }} 
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{ width: 6, background: '#FF4400', borderRadius: 4, boxShadow: '0 0 16px rgba(255,68,0,0.6)', marginRight: 24 }} 
                  />
                  <h2 style={{
                    fontFamily:'Bebas Neue,sans-serif',
                    fontSize: 'clamp(56px, 7vw, 84px)',
                    textTransform:'uppercase',
                    lineHeight:1,
                    letterSpacing:'0.04em',
                    margin:0,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center'
                  }}>
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ duration: 0.3 }}
                      style={{ color: '#FFFFFF', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
                    >{activeTab}</motion.span>
                    <motion.span 
                      initial={{ opacity: 0, x: 10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ duration: 0.3, delay: 0.1 }}
                      style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(255,255,255,0.15)' }}
                    >WORKSPACE</motion.span>
                  </h2>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                  {sortedTools.map((tool, i) => {
                    const soon = tool.status === 'soon';
                    return (
                      <motion.button key={tool.id}
                        className="tool-card" 
                        initial={{ opacity:0, y:12 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.03, duration:0.24 }}
                        whileHover={!soon ? { y:-4, transition:{ duration:0.15 } } : {}}
                        onClick={()=>!soon && handleToolSelect(tool)}
                        style={{
                          borderRadius: 12, 
                          border: `1px solid ${soon ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`, 
                          padding:'32px 24px', 
                          display:'flex', flexDirection:'column',
                          alignItems:'flex-start', textAlign:'left',
                          background: soon
                            ? 'rgba(255,255,255,0.005)'
                            : 'rgba(255,255,255,0.015)', 
                          cursor: soon ? 'default' : 'pointer',
                          opacity: soon ? 0.35 : 1, 
                          filter: soon ? 'grayscale(100%)' : 'none', 
                          position:'relative', overflow:'hidden',
                          minHeight: 240, 
                          transition:'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                          boxShadow: soon ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                        }}
                      >
                        {/* HTML Corner marks - completely fixed size */}
                        <CornerMarks color={soon ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.12)'} size={10} thickness={1.5} />

                        {/* SOON badge with custom glass shimmer effect */}
                        {soon && (
                          <div style={{ 
                            position:'absolute', top:16, right:16,
                            background:'rgba(255,255,255,0.03)',
                            border:'1px solid rgba(255,255,255,0.08)',
                            borderRadius:4, padding:'4px 8px',
                            overflow:'hidden'
                          }}>
                            <div className="shimmer-soon" />
                            <span style={{ 
                              position:'relative', zIndex:2,
                              fontSize:9, fontFamily:"'DM Sans',sans-serif", fontWeight: 600,
                              letterSpacing:'0.05em', color:'rgba(255,255,255,0.3)', 
                            }}>SOON</span>
                          </div>
                        )}

                        {/* Icon container */}
                        <div className="tool-icon-box" style={{
                          width:48, height:48, borderRadius:10,
                          background: soon ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)', 
                          border: `1px solid ${soon ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`, 
                          display:'flex', alignItems:'center', justifyContent:'center',
                          marginBottom:'auto',
                          flexShrink: 0,
                        }}>
                          <tool.icon className="tool-icon" style={{ width:24, height:24, color: soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)' }}/>
                        </div>

                        {/* Highly readable Name + description */}
                        <div style={{ width:'100%', marginTop:24 }}>
                          <h3 className="tool-title" style={{
                            fontSize:16, 
                            fontWeight:600,
                            fontFamily:"'DM Sans',sans-serif",
                            letterSpacing:'0.01em',
                            color: soon ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)',
                            marginBottom:8, lineHeight:1.2,
                            transition: 'color 0.2s'
                          }}>{tool.name}</h3>
                          <p style={{ 
                            fontSize:13, 
                            fontFamily:"'DM Sans',sans-serif", 
                            color: soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)', 
                            lineHeight:1.5, 
                            margin:0, 
                            fontWeight:400 
                          }}>{tool.description}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {sortedTools.length === 0 && (
                  <div style={{ textAlign:'center', padding:'80px 40px' }}>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.18)', fontFamily:'DM Mono,monospace', textTransform:'uppercase', letterSpacing:'0.3em' }}>No tools found</p>
                  </div>
                )}
              </motion.div>

            ) : (
              <motion.div key="workspace"
                initial={{ opacity:0, scale:0.99 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.22 }}
                style={{ padding:'26px 32px 48px', maxWidth:980, margin:'0 auto', width: '100%' }}
              >
                <div style={{
                  background:'linear-gradient(160deg, #0e0e0e 0%, #080808 100%)',
                  border:'1px solid rgba(255,255,255,0.09)',
                  borderRadius:8,
                  overflow:'hidden',
                  boxShadow:'0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
                  position:'relative',
                }}>
                  <CornerMarks color="rgba(255,68,0,0.2)" size={12} thickness={1.2} />
                  {isLoading ? (
                    <div style={{ height:560, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:18 }}>
                      <div style={{ width:28, height:28, border:'2px solid rgba(255,68,0,0.2)', borderTopColor:'#FF4400', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                      <p style={{ fontSize:8.5, fontFamily:'DM Mono,monospace', textTransform:'uppercase', letterSpacing:'0.36em', color:'rgba(255,255,255,0.18)' }}>Loading processor…</p>
                    </div>
                  ) : processor ? (
                    <UniversalWorkspace key={selectedTool.id} tool={selectedTool}
                      onProcess={async (file:File,opts:any)=>{
                        if(typeof processor.process==='function') return await processor.process(file,opts);
                        if(typeof processor==='function') return await processor(file,opts);
                        throw new Error('Invalid processor');
                      }}
                    />
                  ) : (
                    <div style={{ height:560, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <p style={{ fontSize:8.5, fontFamily:'DM Mono,monospace', textTransform:'uppercase', letterSpacing:'0.3em', color:'rgba(255,80,80,0.35)' }}>Processor not available</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function MediaMosh() {
  const [view,         setView]         = useState<'landing'|'dashboard'>('landing');
  const [activeTab,    setActiveTab]    = useState<MediaType>('image');
  const [selectedTool, setSelectedTool] = useState<ToolMetadata|null>(null);
  const [processor,    setProcessor]    = useState<any>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isLoading,    setIsLoading]    = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html:`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500;700&family=DM+Sans:wght@300;400;500;600;700;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#080808;overflow:hidden;}
        @keyframes spin{to{transform:rotate(360deg);}}
        
        /* Shimmer Animation for Camera Options */
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .shimmer-container {
          position: absolute;
          top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: shimmer 3s infinite;
          pointer-events: none;
        }

        /* Continuous Shimmer on Tile Badges */
        @keyframes shimmer-soon {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .shimmer-soon {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer-soon 2s infinite;
          pointer-events: none;
        }

        .grain-overlay{
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:180px 180px;mix-blend-mode:overlay;
        }
        .cscroll::-webkit-scrollbar{width:2px;}
        .cscroll::-webkit-scrollbar-track{background:transparent;}
        .cscroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:10px;}
        .cscroll::-webkit-scrollbar-thumb:hover{background:rgba(255,68,0,0.35);}
        
        /* Tool Card Custom Hover States (Orange activates ONLY on hover) */
        .tool-card .tool-icon { transition: color 0.2s ease; }
        .tool-card:hover:not(:disabled) .tool-icon { color: #FF4400 !important; }
        
        .tool-card .tool-icon-box { transition: background 0.2s ease, border-color 0.2s ease; }
        .tool-card:hover:not(:disabled) .tool-icon-box {
          background: rgba(255,68,0,0.1) !important;
          border-color: rgba(255,68,0,0.4) !important;
        }
        
        .tool-card:hover:not(:disabled) .tool-title { color: rgba(255,255,255,0.95) !important; }

        .tool-card:hover:not(:disabled) {
          background: linear-gradient(145deg, rgba(255,68,0,0.06) 0%, rgba(255,255,255,0.02) 100%) !important;
          border-color: rgba(255,68,0,0.4) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }

        /* Logo Viewfinder Hover Styles */
        .logo-btn:hover .logo-c { box-shadow: 0 0 8px #FF4400, 0 0 16px #FF4400 !important; }
        .logo-btn:hover .logo-label { color: #FFFFFF !important; text-shadow: 0 0 12px rgba(255,68,0,0.5); }
      `}}/>
      <div style={{ minHeight:'100vh', background:'#080808', color:'white', overflow:'hidden', fontFamily:"'DM Sans',sans-serif" }}>
        <AnimatePresence mode="wait">
          {view==='landing' ? (
            <Landing key="landing" onEnter={(tab)=>{ setActiveTab(tab); setView('dashboard'); }}/>
          ) : (
            <Dashboard key="dashboard"
              activeTab={activeTab} setActiveTab={setActiveTab}
              selectedTool={selectedTool} setSelectedTool={setSelectedTool}
              processor={processor} setProcessor={setProcessor}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              isLoading={isLoading} setIsLoading={setIsLoading}
              onHome={()=>{ setView('landing'); setSelectedTool(null); setProcessor(null); }}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}