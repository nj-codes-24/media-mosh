export const bgRemoverProcessor = {
  validate: async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    return validTypes.includes(file.type);
  },

  getDefaultOptions: () => ({
    outputType: 'image/png',
    quality: 0.8,
    debug: false
  }),

  process: async (file: File, options?: any): Promise<Blob> => {
    // ─── FIX: Configure onnxruntime-web WASM paths BEFORE importing ───
    // Without this, Webpack resolves the WASM imports as module objects
    // instead of URL strings, causing "url.replace is not a function".
    try {
      const ort = await import('onnxruntime-web');
      ort.env.wasm.wasmPaths = '/';
    } catch (e) {
      console.warn('[BG-Remover] Could not configure WASM paths:', e);
    }

    // ⚡ Dynamically import the background removal module
    const module: any = await import('@imgly/background-removal');

    // 🔍 Find the function (handles both default and named exports)
    const removeBackground = module.default || module.removeBackground || module;

    if (typeof removeBackground !== 'function') {
      console.error("Imported Module:", module);
      throw new Error("Background removal engine failed to load correctly.");
    }

    try {
      const resultBlob = await removeBackground(file, {
        output: {
          format: options?.outputType || 'image/png',
          quality: options?.quality || 0.8,
          type: 'foreground'
        },
        progress: (key: string, current: number, total: number) => {
          console.log(`[BG-Remover] ${key}: ${current}/${total}`);
        }
      });
      return resultBlob;
    } catch (error) {
      console.error("AI Processing Failed:", error);
      throw error;
    }
  }
};
