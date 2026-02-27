export const exifRemoverProcessor = {
  validate: async (file: File) => file.type === 'image/jpeg',
  getDefaultOptions: () => ({}),
  process: async (file: File): Promise<Blob> => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 1.0));
  }
};