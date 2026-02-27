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
    // ⚡ Dynamically import the module
    const module: any = await import('@imgly/background-removal');
    
    // 🔍 Find the function (handles both default and named exports)
    const removeBackground = module.default || module.removeBackground || module;

    if (typeof removeBackground !== 'function') {
      console.error("Imported Module:", module);
      throw new Error("Background removal engine failed to load correctly.");
    }
    
    try {
      const resultBlob = await removeBackground(file, {
        model: 'medium', 
        output: {
          type: options?.outputType || 'image/png',
          quality: options?.quality || 0.8
        }
      });
      return resultBlob;
    } catch (error) {
      console.error("AI Processing Failed:", error);
      throw error;
    }
  }
};