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
  // page sizing mode: 'original' = each page uses the original image size,
  // 'max' = use the maximum width/height among all images for every page,
  // 'custom' = use provided customWidthMm/customHeightMm for all pages (in millimeters)
  mode?: 'original' | 'max' | 'custom';
  customWidthMm?: number;
  customHeightMm?: number;
}
