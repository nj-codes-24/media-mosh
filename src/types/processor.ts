export interface ToolMetadata {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: any;
  component: string;
  status: string;
}

export interface ProcessorOptions {
  onProgress?: (progress: { ratio: number }) => void;
  [key: string]: any; // Specific options for different processors
}

export type ProcessorFunction = (file: File, options: ProcessorOptions) => Promise<File | Blob | Blob[] | any>;
