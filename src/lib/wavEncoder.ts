/**
 * Shared WAV Encoder Utility
 * Single source of truth for WAV file creation, replacing 3 duplicated implementations
 * across audioConverter.ts, audioSplitter.ts, and voiceChanger.ts.
 */

/**
 * Creates a WAV file header (44 bytes) for PCM 16-bit audio.
 */
export function createWavHeader(sampleRate: number, numChannels: number, dataLengthBytes: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  const bytesPerSample = 2; // 16-bit PCM

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false);                             // "RIFF"
  view.setUint32(4, 36 + dataLengthBytes, true);                    // File size - 8
  view.setUint32(8, 0x57415645, false);                             // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false);                            // "fmt "
  view.setUint32(16, 16, true);                                     // Sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true);                                      // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true);                             // Number of channels
  view.setUint32(24, sampleRate, true);                              // Sample rate
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // Byte rate
  view.setUint16(32, numChannels * bytesPerSample, true);            // Block align
  view.setUint16(34, bytesPerSample * 8, true);                     // Bits per sample

  // data sub-chunk
  view.setUint32(36, 0x64617461, false);                            // "data"
  view.setUint32(40, dataLengthBytes, true);                        // Data size

  return buffer;
}

/**
 * Interleaves two mono Float32Arrays (left + right channels) into a single stereo array.
 */
export function interleaveChannels(left: Float32Array, right: Float32Array): Float32Array {
  const length = left.length + right.length;
  const result = new Float32Array(length);
  let inputIndex = 0;
  for (let index = 0; index < length; ) {
    result[index++] = left[inputIndex];
    result[index++] = right[inputIndex];
    inputIndex++;
  }
  return result;
}

/**
 * Converts a Float32Array of audio samples (-1.0 to 1.0) to a 16-bit PCM Int16Array.
 */
export function float32ToPcm16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm;
}

/**
 * Creates a complete WAV Blob from an AudioBuffer (mono output).
 * Convenience function for simple use cases.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const data = buffer.getChannelData(0);
  const pcm = float32ToPcm16(data);
  const header = createWavHeader(buffer.sampleRate, 1, pcm.byteLength);
  return new Blob([header, pcm as any], { type: 'audio/wav' });
}

/**
 * Creates a complete WAV File from a Float32Array of mono samples.
 */
export function samplesToWavFile(
  samples: Float32Array,
  sampleRate: number,
  filename: string
): File {
  const pcm = float32ToPcm16(samples);
  const header = createWavHeader(sampleRate, 1, pcm.byteLength);
  return new File([header, pcm as any], filename, { type: 'audio/wav' });
}
