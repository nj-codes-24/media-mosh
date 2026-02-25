import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@xenova/transformers';

/**
 * AI Subtitle Processor - V4 (Fixed Audio Resampling)
 * 
 * ROOT CAUSE FIX: AudioContext({ sampleRate: 16000 }) is unreliably supported
 * in browsers and silently falls back to the device's native rate (usually 44100Hz).
 * Whisper receives wrongly-sampled audio and detects only silence.
 *
 * SOLUTION: Decode at native rate, then use OfflineAudioContext to properly
 * resample down to 16000Hz before passing to Whisper.
 */

// Singleton Instance to prevent redundant model loading
let transcriberInstance: AutomaticSpeechRecognitionPipeline | null = null;

const TARGET_SAMPLE_RATE = 16000; // Whisper's required input rate

const getTranscriber = async (onProgress?: (p: any) => void) => {
    if (!transcriberInstance) {
        transcriberInstance = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', {
            quantized: true,
            progress_callback: (p: any) => {
                if (onProgress && p.status === 'progress') {
                    onProgress(p.progress / 100);
                }
            },
        }) as AutomaticSpeechRecognitionPipeline;
    }
    return transcriberInstance;
};

/**
 * Resamples an AudioBuffer to the target sample rate using OfflineAudioContext.
 * This is the correct, cross-browser way to resample — unlike passing sampleRate
 * to AudioContext(), which many browsers ignore or clamp silently.
 */
const resampleAudio = async (audioBuffer: AudioBuffer, targetRate: number): Promise<Float32Array> => {
    const numFrames = Math.ceil(audioBuffer.duration * targetRate);

    // OfflineAudioContext will render at exactly targetRate
    const offlineCtx = new OfflineAudioContext(
        1,          // mono output
        numFrames,
        targetRate
    );

    // Mix down to mono if needed by only connecting channel 0
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    // If stereo, use a channel merger to mix to mono
    if (audioBuffer.numberOfChannels > 1) {
        const splitter = offlineCtx.createChannelSplitter(audioBuffer.numberOfChannels);
        const merger = offlineCtx.createChannelMerger(1);
        source.connect(splitter);
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            splitter.connect(merger, i, 0);
        }
        merger.connect(offlineCtx.destination);
    } else {
        source.connect(offlineCtx.destination);
    }

    source.start(0);

    const rendered = await offlineCtx.startRendering();
    return rendered.getChannelData(0);
};

export const subtitleProcessor = {
    process: async (file: File, options: { onProgress?: (val: number) => void } = {}) => {
        console.log('🎬 Subtitle Processor V4 Started');
        console.log('📁 File:', file.name, file.type, file.size, 'bytes');

        try {
            // 1. Load model
            const transcriber = await getTranscriber(options.onProgress);

            // 2. Decode audio at NATIVE sample rate (don't force 16k here!)
            const nativeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await nativeCtx.decodeAudioData(arrayBuffer);

            console.log('🎤 Decoded audio (native):', {
                duration: audioBuffer.duration,
                nativeSampleRate: audioBuffer.sampleRate,
                channels: audioBuffer.numberOfChannels,
            });

            await nativeCtx.close();

            // 3. Resample to 16000Hz using OfflineAudioContext (the correct approach)
            console.log(`🔄 Resampling from ${audioBuffer.sampleRate}Hz → ${TARGET_SAMPLE_RATE}Hz...`);
            const audioData = await resampleAudio(audioBuffer, TARGET_SAMPLE_RATE);

            console.log(`✅ Resampled: ${audioData.length} samples @ ${TARGET_SAMPLE_RATE}Hz`);

            // Quick sanity check — detect if audio is silent
            const maxAmplitude = audioData.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
            console.log(`🔊 Max amplitude after resample: ${maxAmplitude.toFixed(4)}`);
            if (maxAmplitude < 0.001) {
                console.warn('⚠️ Audio appears to be nearly silent after resampling!');
            }

            // 4. Run Whisper inference
            console.log('🤖 Running Whisper inference...');
            const result = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: true,
                force_full_sequences: false,
                temperature: 0.0,
            });

            console.log('🤖 Raw Whisper Result:', JSON.stringify(result, null, 2));

            // 5. Normalize result into chunks array
            let chunks: any[] = [];

            if (result && 'chunks' in result && Array.isArray(result.chunks)) {
                chunks = result.chunks;
                console.log(`✅ Found ${chunks.length} chunks`);
            } else if (result && 'text' in result && result.text) {
                console.log('⚠️ No chunks returned, using full text fallback');
                chunks = [{
                    text: result.text,
                    timestamp: [0, audioBuffer.duration]
                }];
            } else {
                console.log('❌ No valid result from Whisper');
                return {
                    chunks: [{ text: "No speech detected.", timestamp: [0, audioBuffer.duration] }]
                };
            }

            // 6. Clean chunks
            const cleanedChunks = chunks
                .map((chunk: any) => ({
                    ...chunk,
                    text: (chunk.text || '')
                        .replace(/\[BLANK_AUDIO\]/gi, '')
                        .replace(/\[.*?\]/g, '')
                        .trim()
                }))
                .filter((chunk: any) => chunk.text.length > 0);

            console.log(`🧹 ${cleanedChunks.length} subtitle chunks after cleaning`);
            if (cleanedChunks[0]) console.log('📝 First chunk:', cleanedChunks[0]);

            if (cleanedChunks.length === 0) {
                return {
                    chunks: [{
                        text: "🎵 Background Music / Noise Only",
                        timestamp: [0, audioBuffer.duration]
                    }]
                };
            }

            return { chunks: cleanedChunks };

        } catch (error) {
            console.error("❌ Subtitle Processor Error:", error);
            throw new Error(`Failed to process subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};