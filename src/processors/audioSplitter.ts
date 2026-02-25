/**
 * Audio Splitter Processor V5 (Reliable Sound Edition)
 * Uses Frequency-Domain Filtering (FFT) to separate stems by frequency bands.
 */

// --- UTILITIES ---

const writeWavHeader = (sampleRate: number, numChannels: number, dataLength: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataLength, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataLength, true);
    return buffer;
};

// Simple FFT implementation
class SimpleFFT {
    size: number;
    reverseTable: Uint32Array;
    sinTable: Float32Array;
    cosTable: Float32Array;

    constructor(size: number) {
        this.size = size;
        this.reverseTable = new Uint32Array(size);
        this.sinTable = new Float32Array(size);
        this.cosTable = new Float32Array(size);

        let limit = 1;
        let bit = size >> 1;
        while (limit < size) {
            for (let i = 0; i < limit; i++) {
                this.reverseTable[i + limit] = this.reverseTable[i] + bit;
            }
            limit <<= 1;
            bit >>= 1;
        }

        for (let i = 0; i < size; i++) {
            this.sinTable[i] = Math.sin(-Math.PI / i);
            this.cosTable[i] = Math.cos(-Math.PI / i);
        }
    }

    // Standard recursive Cooley-Tukey (iterative simplified)
    transform(real: Float32Array, imag: Float32Array) {
       const n = this.size;
       
       // Bit-reversal permutation
       for (let i = 0; i < n; i++) {
          const rev = this.reverseTable[i];
          if (rev > i) {
             [real[i], real[rev]] = [real[rev], real[i]];
             [imag[i], imag[rev]] = [imag[rev], imag[i]];
          }
       }

       // Butterfly operations
       for (let size = 2; size <= n; size <<= 1) {
          const halfsize = size >> 1;
          const tablestep = n / size;
          for (let i = 0; i < n; i += size) {
             for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                const tpre =  real[j+halfsize] * Math.cos(-2 * Math.PI * k / n) - imag[j+halfsize] * Math.sin(-2 * Math.PI * k / n);
                const tpim =  real[j+halfsize] * Math.sin(-2 * Math.PI * k / n) + imag[j+halfsize] * Math.cos(-2 * Math.PI * k / n);
                
                real[j + halfsize] = real[j] - tpre;
                imag[j + halfsize] = imag[j] - tpim;
                real[j] += tpre;
                imag[j] += tpim;
             }
          }
       }
    }

    inverse(real: Float32Array, imag: Float32Array) {
        // Conjugate input
        for(let i=0; i<this.size; i++) imag[i] = -imag[i];
        
        this.transform(real, imag);
        
        // Conjugate output & scale
        for(let i=0; i<this.size; i++) {
            imag[i] = -imag[i] / this.size;
            real[i] = real[i] / this.size;
        }
    }
}

// Helper to pause execution
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

// --- MAIN FUNCTION FIXED ---
export const audioSplitter = async (file: File, options: any): Promise<Record<string, File>> => {
    // 1. Guard against Server-Side Rendering (SSR) issues
    if (typeof window === 'undefined') {
        throw new Error("Audio processing must run on the client side.");
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // 2. Safe AudioContext initialization
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
            throw new Error("Web Audio API not supported in this browser.");
        }
        
        const audioCtx = new AudioContextClass();
        
        // 3. Decode Audio
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        // Convert to Mono for processing
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // FFT Config
        const bufferSize = 4096;
        const fft = new SimpleFFT(bufferSize);
        const outputBufferLength = channelData.length;
        
        // Initialize outputs for stems
        const stems = {
            vocals: new Float32Array(outputBufferLength),
            drums: new Float32Array(outputBufferLength),
            bass: new Float32Array(outputBufferLength),
            music: new Float32Array(outputBufferLength)
        };
        
        // Overlap-Add Window
        const windowArr = new Float32Array(bufferSize);
        for(let i=0; i<bufferSize; i++) {
            windowArr[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (bufferSize - 1)); // Hanning
        }

        // --- PROCESSING LOOP ---
        const hopSize = bufferSize / 2; // 50% overlap
        const numSteps = Math.floor((channelData.length - bufferSize) / hopSize);

        for (let i = 0; i < numSteps; i++) {
            // Yield UI update every 500 steps
            if (i % 500 === 0) {
                await yieldToMain();
                if (options.onProgress) options.onProgress({ ratio: i / numSteps });
            }

            const offset = i * hopSize;
            
            // 1. Prepare Frame
            const real = new Float32Array(bufferSize);
            const imag = new Float32Array(bufferSize);
            for (let j = 0; j < bufferSize; j++) {
                real[j] = channelData[offset + j] * windowArr[j];
            }

            // 2. FFT
            fft.transform(real, imag);

            // 3. Filter Masks (Frequency Domain)
            // We create copies of Real/Imag for each stem
            const stemFFT = {
                vocals: { r: new Float32Array(real), i: new Float32Array(imag) },
                drums:  { r: new Float32Array(real), i: new Float32Array(imag) },
                bass:   { r: new Float32Array(real), i: new Float32Array(imag) },
                music:  { r: new Float32Array(real), i: new Float32Array(imag) }
            };

            for (let k = 0; k < bufferSize / 2; k++) {
                const freq = k * sampleRate / bufferSize;
                
                // --- MASKS ---
                // BASS: Low frequencies (< 250Hz)
                if (freq > 250) {
                    stemFFT.bass.r[k] = 0; stemFFT.bass.i[k] = 0;
                    stemFFT.bass.r[bufferSize-k] = 0; stemFFT.bass.i[bufferSize-k] = 0;
                }

                // VOCALS: Mid frequencies (300Hz - 3500Hz)
                if (freq < 300 || freq > 3500) {
                    stemFFT.vocals.r[k] *= 0.1; stemFFT.vocals.i[k] *= 0.1;
                    stemFFT.vocals.r[bufferSize-k] *= 0.1; stemFFT.vocals.i[bufferSize-k] *= 0.1;
                } else {
                    // Enhance vocals slightly
                    stemFFT.vocals.r[k] *= 1.2; stemFFT.vocals.i[k] *= 1.2;
                    stemFFT.vocals.r[bufferSize-k] *= 1.2; stemFFT.vocals.i[bufferSize-k] *= 1.2;
                }

                // DRUMS: High frequencies + Sub (Simple approximation)
                if ((freq > 100 && freq < 4000)) {
                        stemFFT.drums.r[k] *= 0.2; stemFFT.drums.i[k] *= 0.2;
                        stemFFT.drums.r[bufferSize-k] *= 0.2; stemFFT.drums.i[bufferSize-k] *= 0.2;
                }

                // MUSIC: Cut vocals center
                if (freq > 300 && freq < 3000) {
                    stemFFT.music.r[k] *= 0.1; stemFFT.music.i[k] *= 0.1;
                    stemFFT.music.r[bufferSize-k] *= 0.1; stemFFT.music.i[bufferSize-k] *= 0.1;
                }
            }

            // 4. IFFT & Overlap-Add for each stem
            const stemKeys = ['vocals', 'drums', 'bass', 'music'] as const;
            
            for(const key of stemKeys) {
                fft.inverse(stemFFT[key].r, stemFFT[key].i);
                
                // Accumulate windowed output
                for(let j=0; j<bufferSize; j++) {
                    stems[key][offset + j] += stemFFT[key].r[j]; 
                }
            }
        }

        // --- CONVERT TO WAV ---
        const createWav = (data: Float32Array, name: string) => {
            // Normalize
            let max = 0;
            for(let i=0; i<data.length; i++) if(Math.abs(data[i]) > max) max = Math.abs(data[i]);
            const gain = max > 0 ? 0.9 / max : 1;

            const pcmData = new Int16Array(data.length);
            for(let i=0; i<data.length; i++) {
                let s = data[i] * gain;
                s = Math.max(-1, Math.min(1, s));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            const wavHeader = writeWavHeader(sampleRate, 1, pcmData.byteLength);
            return new File([wavHeader, pcmData], `${name}_stem.wav`, { type: 'audio/wav' });
        };

        const resultFiles: Record<string, File> = {
            vocals: createWav(stems.vocals, 'vocals'),
            drums: createWav(stems.drums, 'drums'),
            bass: createWav(stems.bass, 'bass'),
            music: createWav(stems.music, 'music')
        };

        return resultFiles;

    } catch (e) {
        console.error(e);
        throw e;
    }
};