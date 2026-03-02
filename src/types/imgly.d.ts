// src/types/imgly.d.ts
declare module '@imgly/background-removal' {
  interface Config {
    publicPath?: string;
    model?: 'isnet' | 'isnet_fp16' | 'isnet_quint8';
    device?: 'cpu' | 'gpu';
    output?: {
      format?: string;
      quality?: number;
      type?: 'foreground' | 'background' | 'mask';
    };
    debug?: boolean;
    progress?: (key: string, current: number, total: number) => void;
  }

  function removeBackground(
    source: string | URL | File | Blob | ArrayBuffer | Uint8Array,
    config?: Config
  ): Promise<Blob>;

  export default removeBackground;
}
