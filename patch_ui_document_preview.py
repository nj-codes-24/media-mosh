import re

file = r'c:\Users\NISHCHAL\OneDrive\Desktop\creative_suite\src\components\UniversalWorkspace.tsx'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the video tag with a conditional that checks if the file is a video
old_video_block = """                            ) : (
                              <video
                                ref={videoRef}
                                src={resultUrl || previewUrl!}
                                controls={!processing}
                                onPlay={() => setIsVideoStarted(true)}
                                onSeeked={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
                                onTimeUpdate={() => {
                                  if (videoRef.current) {
                                    setCurrentTime(videoRef.current.currentTime);
                                    if (videoRef.current.currentTime > 0) setIsVideoStarted(true);
                                  }
                                }}
                                className="max-h-full w-full object-contain"
                              />
                            )}"""

new_video_block = """                            ) : isPdfConverter && !['pdf'].includes(options?.format || '') ? (
                              <div className="flex flex-col items-center justify-center h-full w-full text-zinc-500 bg-white/5 rounded-2xl border border-white/10">
                                <FileType className="w-20 h-20 mb-6 text-zinc-700" />
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-2">
                                  {options?.format ? options.format.toUpperCase() : 'DOCUMENT'} READY
                                </p>
                                <p className="text-[10px] font-bold text-zinc-500 max-w-xs text-center leading-relaxed">
                                  Preview unavailable for this format. Please download the file to view its contents.
                                </p>
                              </div>
                            ) : (
                              <video
                                ref={videoRef}
                                src={resultUrl || previewUrl!}
                                controls={!processing}
                                onPlay={() => setIsVideoStarted(true)}
                                onSeeked={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
                                onTimeUpdate={() => {
                                  if (videoRef.current) {
                                    setCurrentTime(videoRef.current.currentTime);
                                    if (videoRef.current.currentTime > 0) setIsVideoStarted(true);
                                  }
                                }}
                                className="max-h-full w-full object-contain"
                              />
                            )}"""

if old_video_block in content:
    content = content.replace(old_video_block, new_video_block)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched UniversalWorkspace.tsx UI renderer.")
else:
    print("Could not find the video block to patch.")
