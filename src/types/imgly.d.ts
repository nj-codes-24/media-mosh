// src/types/imgly.d.ts
declare module '@imgly/background-removal' {
  interface Config {
    model?: 'small' | 'medium';
    output?: {
      type?: string;
      quality?: number;
    };
    debug?: boolean;
  }

  function removeBackground(
    source: string | URL | File | Blob | ArrayBuffer | Uint8Array,
    config?: Config
  ): Promise<Blob>;

  export default removeBackground;
}