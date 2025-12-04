export type WorkerAction = 'MERGE_PDFS' | 'SPLIT_PDF' | 'IMAGES_TO_PDF';

export interface WorkerMessage {
  id: string;
  action: WorkerAction;
  payload: any;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  data?: Uint8Array; // serialized PDF
  error?: string;
}

export interface MergePayload {
  pdfBuffers: ArrayBuffer[];
}

export interface SplitPayload {
  pdfBuffer: ArrayBuffer;
  pageIndices: number[]; // 0-based
}

export interface ImagesToPdfPayload {
  imageBuffers: ArrayBuffer[];
}
