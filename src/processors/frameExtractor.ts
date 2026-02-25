import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import JSZip from 'jszip';

export const frameExtractor = async (file: File, options: any) => {
  const { frameCount = 10, startTime = 0, endTime = 10, onProgress } = options;
  
  const ffmpeg = new FFmpeg();
  
  // Load ffmpeg
  await ffmpeg.load();

  const inputName = 'input_video.mp4';
  await ffmpeg.writeFile(inputName, await fetchFile(file));

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
    
    // Fixed: Cast data as 'any' to bypass the strict Uint8Array/string union type error
    const blob = new Blob([data as any], { type: 'image/png' });
    
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