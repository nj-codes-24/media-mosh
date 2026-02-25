/**
 * Voice Changer Processor V2 - Refined
 * Features: Pitch Shifting, Ring Modulation, EQ, Distortion, and Reverb
 * Optimized for client-side web audio processing
 */

// --- DSP HELPERS ---

// 1. Reverb Impulse Generator
const createReverbImpulse = (ctx: BaseAudioContext, duration: number, decay: number) => {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i < length - 100 ? (Math.random() * 2 - 1) : 0;
        const env = Math.pow(1 - i / length, decay);
        left[i] = n * env;
        right[i] = n * env;
    }
    return impulse;
};

// --- WAV ENCODER ---
function bufferToWav(buffer: AudioBuffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const data = buffer.getChannelData(0); 
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); 
    view.setUint16(22, 1, true); 
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 1 * bytesPerSample, true);
    view.setUint16(32, 1 * bytesPerSample, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }
    
    return arrayBuffer;
}

// --- MAIN PROCESSOR ---

export const voiceChanger = async (file: File, options: any): Promise<File> => {
    if (typeof window === 'undefined') throw new Error("Client side only");

    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            // Determine pitch shift for output length calculation
            let pitchShift = 1.0;
            if (options.preset === 'demon') pitchShift = 0.65; // Lower, scarier
            if (options.preset === 'chipmunk') pitchShift = 1.6; // Higher, squeakier
            
            // Adjust output buffer length for pitch changes
            const outputLength = Math.floor(audioBuffer.length / pitchShift);
            
            // Offline Context
            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                outputLength, 
                audioBuffer.sampleRate
            );

            // Source with pitch shifting
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = pitchShift; 

            // --- EFFECTS CHAIN ---

            // 1. FILTER (Tone)
            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'allpass';
            
            // 2. MODULATOR (Ring Mod / Tremolo)
            const osc = offlineCtx.createOscillator();
            const oscGain = offlineCtx.createGain();
            const modGain = offlineCtx.createGain(); // Wet/Dry mix for mod
            
            // 3. DISTORTION
            const dist = offlineCtx.createWaveShaper();

            // 4. REVERB
            const convolver = offlineCtx.createConvolver();
            const reverbGain = offlineCtx.createGain();

            // --- PRESET CONFIGURATION ---
            
            // Default Routings
            modGain.gain.value = 0; // Mod off
            reverbGain.gain.value = 0; // Reverb off
            osc.start();

            if (options.preset === 'demon') {
                // DEMON: Lower pitch + Dark EQ + Heavy distortion + Growl + Cathedral reverb
                
                // Dark, muffled tone
                filter.type = 'lowpass';
                filter.frequency.value = 800; // Cut highs for dark sound
                filter.Q.value = 0.7;
                
                // Deep growl/rumble (layered effect)
                osc.type = 'sawtooth';
                osc.frequency.value = 40; // 40Hz deep rumble
                modGain.gain.value = 0.35; // Mix in the growl
                
                // Aggressive distortion for grit
                const curve = new Float32Array(44100);
                for(let i=0; i<44100; i++) {
                    const x = i * 2 / 44100 - 1;
                    // Harder clipping curve
                    curve[i] = Math.tanh(x * 4) * 0.9;
                }
                dist.curve = curve;
                
                // Large, dark reverb
                reverbGain.gain.value = 0.5;
                convolver.buffer = createReverbImpulse(offlineCtx, 3.0, 4.0);
            } 
            else if (options.preset === 'chipmunk') {
                // CHIPMUNK: Higher pitch + Bright, thin tone
                // The pitch shift is already applied via playbackRate
                
                // Thin, bright EQ - high shelf boost
                filter.type = 'highshelf';
                filter.frequency.value = 2000;
                filter.gain.value = 8; // Boost highs
                
                // No ring mod needed - pitch shift handles it
                modGain.gain.value = 0;
            }
            else if (options.preset === 'robot') {
                // ROBOT: Vocoder-like with ring mod + bitcrush effect
                
                // Midrange focus for synthetic voice
                filter.type = 'bandpass';
                filter.frequency.value = 800;
                filter.Q.value = 1.5;
                
                // Strong ring modulation for metallic tone
                osc.type = 'square';
                osc.frequency.value = 55; // Carrier frequency (like vocoder)
                modGain.gain.value = 0.8; // Heavy modulation
                
                // Light distortion for digital artifacts
                const curve = new Float32Array(4096);
                for(let i=0; i<4096; i++) {
                    const x = i * 2 / 4096 - 1;
                    // Bit-crush style curve
                    curve[i] = Math.round(x * 8) / 8;
                }
                dist.curve = curve;
            }
            else if (options.preset === 'telephone') {
                // TELEPHONE: Narrow bandpass + clipping + subtle noise
                
                // Classic phone frequency range (300Hz - 3.4kHz)
                filter.type = 'bandpass';
                filter.frequency.value = 1200; // Center of phone range
                filter.Q.value = 1.0; // Not too narrow
                
                // Hard clipping distortion (like analog compression)
                const curve = new Float32Array(8192);
                for(let i=0; i<8192; i++) {
                    const x = i * 2 / 8192 - 1;
                    // Hard clip with slight smoothing
                    if (x > 0.4) curve[i] = 0.4 + (x - 0.4) * 0.1;
                    else if (x < -0.4) curve[i] = -0.4 + (x + 0.4) * 0.1;
                    else curve[i] = x;
                }
                dist.curve = curve;
                
                // No ring mod for telephone
                modGain.gain.value = 0;
            }
            else if (options.preset === 'cave') {
                // CAVE: Long, spacious reverb with early reflections
                
                // Slight low-mid boost (stone reflections)
                filter.type = 'peaking';
                filter.frequency.value = 400;
                filter.Q.value = 0.7;
                filter.gain.value = 3;
                
                // Large, wet reverb
                reverbGain.gain.value = 0.7;
                convolver.buffer = createReverbImpulse(offlineCtx, 5.0, 2.5);
                
                // No ring mod
                modGain.gain.value = 0;
            }

            // --- WIRING ---
            // Clean signal path: Source -> Filter -> Dist -> [Mod/Dry Mix] -> [Reverb] -> Master
            
            const master = offlineCtx.createGain();
            master.gain.value = 0.9; // Prevent clipping
            
            // Core chain: Filter -> Distortion
            source.connect(filter);
            filter.connect(dist);
            
            // Branch 1: Ring Modulation (if enabled)
            if (modGain.gain.value > 0) {
                const modNode = offlineCtx.createGain();
                osc.connect(modNode.gain); // AM modulation
                dist.connect(modNode);
                modNode.connect(modGain);
                modGain.connect(master);
            }
            
            // Branch 2: Dry signal (adjusted for mod wet amount)
            const dryGain = offlineCtx.createGain();
            dryGain.gain.value = 1.0 - (modGain.gain.value * 0.6); // Reduce dry when mod is high
            dist.connect(dryGain);
            dryGain.connect(master);
            
            // Branch 3: Reverb (if enabled)
            if (reverbGain.gain.value > 0) {
                dist.connect(convolver);
                convolver.connect(reverbGain);
                reverbGain.connect(master);
            }

            master.connect(offlineCtx.destination);

            // --- RENDER ---
            source.start();
            if (options.onProgress) options.onProgress({ ratio: 0.5 });
            
            const renderedBuffer = await offlineCtx.startRendering();
            if (options.onProgress) options.onProgress({ ratio: 1.0 });

            const wavBuffer = bufferToWav(renderedBuffer);
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            resolve(new File([blob], `voice_${options.preset}.wav`, { type: 'audio/wav' }));

        } catch (e: any) {
            reject(new Error("Voice processing failed: " + e.message));
        }
    });
};