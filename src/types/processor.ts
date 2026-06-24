// ToolMetadata has been moved to toolRegistry.ts

export interface ProcessorOptions {
  onProgress?: (progress: { ratio: number }) => void;
  [key: string]: any; // Specific options for different processors
}

export type ProcessorFunction = (file: File | File[], options: ProcessorOptions) => Promise<File | Blob | Blob[] | any>;
