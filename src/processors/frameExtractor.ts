import { ffmpegHelper } from '@/lib/ffmpegHelper';
import JSZip from 'jszip';

export const frameExtractor = async (file: File, options: any) => {
  const { frameCount = 10, startTime = 0, endTime = 10, onProgress } = options;
  
  // Use the shared FFmpeg singleton instead of creating a new instance each time.
  // This avoids re-downloading the ~30MB WASM binary on every invocation.
  const ffmpeg = await ffmpegHelper.load();

  const inputName = 'input_video.mp4';
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

  // Calculate the interval between frames
  const duration = endTime - startTime;
  const interval = duration / (frameCount > 1 ? frameCount - 1 : 1);

  const zip = new JSZip();
  const folder = zip.folder("extracted_frames");

  for (let i = 0; i < frameCount; i++) {
    const currentTime = startTime + (i * interval);
    const outputName = `frame_${(i + 1).toString().padStart(3, '0')}.png`;
    
    onProgress?.({ ratio: i / frameCount });

    // Extract exactly 1 frame at the specific timestamp (-ss)
    await ffmpeg.exec([
      '-ss', currentTime.toFixed(6),
      '-i', inputName,
      '-frames:v', '1',
      '-q:v', '2', // High quality
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    
    const blob = new Blob([data as Uint8Array], { type: 'image/png' });
    
    folder?.file(outputName, blob);
    
    // Clean up frame from memory
    await ffmpeg.deleteFile(outputName);
  }

  onProgress?.({ ratio: 0.95 });

  // Generate the final zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Clean up input
  await ffmpeg.deleteFile(inputName);
  onProgress?.({ ratio: 1 });

  return zipBlob;
};