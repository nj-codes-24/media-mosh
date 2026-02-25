import re

file = r'c:\Users\NISHCHAL\OneDrive\Desktop\creative_suite\src\components\UniversalWorkspace.tsx'
with open(file, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

# 1. Update getting accepted files for the tool
# Line ~889: if (tool.id === 'pdf-merger' || tool.id === 'pdf-remove-page' || isPdfCompress || isPdfConverter) return 'application/pdf';
# Change to allow pptx, docx, xlsx for isPdfConverter
for i, line in enumerate(lines):
    if "return 'application/pdf';" in line and 'isPdfConverter' in line:
        lines[i] = "    if (tool.id === 'pdf-merger' || tool.id === 'pdf-remove-page' || isPdfCompress) return 'application/pdf';\n    if (isPdfConverter) return '.pdf,.docx,.xlsx,.pptx';"

# 2. Update Run Processor / Download logic for isPdfConverter
for i, line in enumerate(lines):
    if "{/* ── PDF COMPRESS: special lifecycle ── */}" in line:
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    if "{/* ── PDF REMOVE PAGE UI ── */}" in lines[i]:
        end_idx = i - 1
        break

new_run_ui = """                      {/* ── PDF COMPRESS & FORMAT CHANGER: special lifecycle ── */}
                      {isPdfCompress || isPdfConverter ? (
                        <>
                          {!hasInitiated && (
                            <div className="flex gap-2">
                              <button
                                disabled={processing || (isPdfConverter && !options.format)}
                                onClick={() => handleProcess()}
                                className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-30 disabled:grayscale cursor-pointer flex items-center justify-center gap-2"
                              >
                                Run Processor
                              </button>
                              <button onClick={handleReset} className="px-5 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center" title="Start Over">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {hasInitiated && (
                            <div className="space-y-3">
                              {/* Download button — grey while processing, green when done */}
                              {resultUrl ? (
                                (() => {
                                  const baseName = (file?.name || 'output').replace(/\\.[^.]+$/, '');
                                  const fmt = options.format ?? 'pdf';
                                  const dlName = isPdfConverter ? `${baseName}_converted.${fmt}` : `${baseName}_compressed.pdf`;
                                  const dlLabel = isPdfConverter ? `Download .${fmt.toUpperCase()}` : 'Download Compressed PDF';
                                  return (
                                    <a
                                      href={resultUrl}
                                      download={dlName}
                                      className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
                                    >
                                      <Download className="w-4 h-4" /> {dlLabel}
                                    </a>
                                  )
                                })()
                              ) : (
                                <div className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed">
                                  {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                  {processing ? 'Processing…' : (isPdfConverter ? 'Waiting...' : 'Download Compressed PDF')}
                                </div>
                              )}
                              {/* Show result size vs original */}
                              {resultUrl && (resultSize || resultSize === 0) && (
                                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    {formatBytes(file.size)} → <span className="text-emerald-400">{formatBytes(resultSize)}</span>
                                  </div>
                                  {!isPdfConverter && (
                                    <span className="text-[9px] font-black text-emerald-400 tracking-widest">
                                      {Math.round((1 - resultSize / file.size) * 100)}% smaller
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Redo button */}
                              <button
                                onClick={handleReset}
                                className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Redo
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* ── All other PDF tools: original Run + Download ── */
                        <>
                          <div className="flex gap-2">
                            <button
                              disabled={processing || (isPdfRemovePage && pdfDetecting)}
                              onClick={() => handleProcess()}
                              className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-cyan-400 transition-all disabled:opacity-30 disabled:grayscale cursor-pointer flex items-center justify-center gap-2"
                            >
                              {processing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {processing ? 'Processing…' : 'Run Processor'}
                            </button>
                            <button onClick={handleReset} className="px-5 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center" title="Start Over">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>

                          {resultUrl && (() => {
                            const baseName = (file?.name || 'output').replace(/\\.[^.]+$/, '');
                            const dlName = `${baseName}_processed.pdf`;
                            return (
                              <a
                                href={resultUrl}
                                download={dlName}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
                              >
                                <Download className="w-4 h-4" /> Download Result PDF
                              </a>
                            );
                          })()}
                        </>
                      )}"""

lines[start_idx:end_idx] = new_run_ui.split('\n')

# 3. Replace PDF FORMAT CHANGER UI
for i, line in enumerate(lines):
    if "{/* ── PDF FORMAT CHANGER UI ── */}" in line:
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    if "{/* ── GENERIC TOOL OPTIONS ── */}" in lines[i]:
        end_idx = i
        break

new_format_ui = """                  {/* ── FILE FORMAT CHANGER UI ── */}
                  {isPdfConverter && file && !hasInitiated && (() => {
                    const ext = file.name.split('.').pop()?.toLowerCase() || '';
                    const isUnsupported = !['pdf', 'docx', 'pptx', 'xlsx'].includes(ext);
                    const fileTypeLabel = ext === 'pdf' ? 'PDF Document' : ext === 'docx' ? 'Word Document' : ext === 'pptx' ? 'PowerPoint' : ext === 'xlsx' ? 'Excel Spreadsheet' : 'Unknown File';
                    
                    return (
                      <div className="space-y-5">
                        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                          <FileType className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Detected Source</p>
                            <p className="text-xs font-black text-white">{fileTypeLabel}</p>
                          </div>
                        </div>
                        {isUnsupported && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 font-bold">
                            Unsupported file type. Please upload a PDF, DOCX, PPTX, or XLSX file.
                          </div>
                        )}
                        {!isUnsupported && (
                          <div>
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-3">Convert To</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { fmt: 'pdf', label: 'PDF', sub: 'Document' },
                                { fmt: 'docx', label: 'Word', sub: 'Document' },
                                { fmt: 'pptx', label: 'PowerPoint', sub: 'Presentation' },
                                { fmt: 'xlsx', label: 'Excel', sub: 'Spreadsheet' },
                              ].map(({ fmt, label, sub }) => {
                                const isCurrent = ext === fmt;
                                const isSelected = options.format === fmt;
                                return (
                                  <button
                                    key={fmt}
                                    disabled={isCurrent}
                                    onClick={() => setOptions({ ...options, format: fmt })}
                                    className={`py-4 border rounded-xl text-center flex flex-col items-center justify-center gap-1 transition-all ${isCurrent ? 'bg-white/5 border-white/5 text-zinc-700 cursor-not-allowed opacity-50' : isSelected ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 cursor-pointer'}`}
                                  >
                                    <FileType className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-black">{label}</span>
                                    <span className="text-[7px] font-bold uppercase tracking-wide opacity-70">{sub}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
"""

lines[start_idx:end_idx] = new_format_ui.split('\n')

with open(file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
