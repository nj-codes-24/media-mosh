/**
 * Audio Converter Processor
 * Uses Web Audio API to decode inputs and re-encode.
 */

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

const interleave = (left: Float32Array, right: Float32Array) => {
    const length = left.length + right.length;
    const result = new Float32Array(length);
    let inputIndex = 0;
    for (let index = 0; index < length; ) {
        result[index++] = left[inputIndex];
        result[index++] = right[inputIndex];
        inputIndex++;
    }
    return result;
};

export const audioConverter = async (file: File, options: any): Promise<File> => {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            
            // USE WAV ENCODER FOR 'wav' OR 'mp3' (Fallback)
            if (options.format === 'wav' || options.format === 'mp3') {
                const numChannels = audioBuffer.numberOfChannels;
                const sampleRate = audioBuffer.sampleRate;
                
                let interleaved: Float32Array;
                if (numChannels === 2) {
                    interleaved = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
                } else {
                    interleaved = audioBuffer.getChannelData(0);
                }
                
                const dataLength = interleaved.length * 2;
                const buffer = new ArrayBuffer(dataLength);
                const view = new DataView(buffer);
                for (let i = 0; i < interleaved.length; i++) {
                    let s = Math.max(-1, Math.min(1, interleaved[i]));
                    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
                
                const header = writeWavHeader(sampleRate, numChannels, dataLength);
                
                // Mime Type logic
                const mime = options.format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
                const blob = new Blob([header, view], { type: mime });
                
                if (options.onProgress) options.onProgress({ ratio: 1 });
                resolve(new File([blob], `converted_${file.name.split('.')[0]}.${options.format}`, { type: mime }));
            } 
            
            // COMPRESSED FORMATS (OGG/WEBM)
            else {
                const dest = audioCtx.createMediaStreamDestination();
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(dest);
                
                const mimeType = options.format === 'ogg' ? 'audio/ogg' : 'audio/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    // Fallback to wav if unsupported
                    return resolve(audioConverter(file, { ...options, format: 'wav' }));
                }

                const recorder = new MediaRecorder(dest.stream, { mimeType });
                const chunks: Blob[] = [];
                
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    if (options.onProgress) options.onProgress({ ratio: 1 });
                    resolve(new File([blob], `converted_${file.name.split('.')[0]}.${options.format}`, { type: mimeType }));
                };
                
                source.start();
                recorder.start();
                source.onended = () => recorder.stop();
            }

        } catch (e) {
            reject(new Error('Audio conversion failed.'));
        }
    });
};