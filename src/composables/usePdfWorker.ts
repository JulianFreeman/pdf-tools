import { onUnmounted } from 'vue';
import type { WorkerAction, WorkerMessage, WorkerResponse, MergePayload, SplitPayload, ImagesToPdfPayload } from '../types/pdf';
import PdfWorker from '../workers/pdf.worker.ts?worker';

export function usePdfWorker() {
  const worker = new PdfWorker();
  const pendingRequests = new Map<string, { resolve: (data: Uint8Array) => void, reject: (err: any) => void }>();

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const { id, success, data, error } = e.data;
    const request = pendingRequests.get(id);
    
    if (request) {
      if (success && data) {
        request.resolve(data);
      } else {
        request.reject(new Error(error || 'Operation failed'));
      }
      pendingRequests.delete(id);
    }
  };

  worker.onerror = (e) => {
    console.error('Worker Error', e);
    pendingRequests.forEach((req) => req.reject(new Error('Worker error occurred')));
    pendingRequests.clear();
  };

  const postMessageToWorker = (action: WorkerAction, payload: any): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      pendingRequests.set(id, { resolve, reject });
      
      const message: WorkerMessage = { id, action, payload };
      
      // Identify transferables to optimize performance
      // Note: Once transferred, the ArrayBuffer in the main thread becomes detached (unusable).
      // Ensure that the caller does not need the buffer anymore.
      const transfer: Transferable[] = [];
      if (action === 'MERGE_PDFS') {
         // Be careful: if the caller reuses these buffers, we shouldn't transfer.
         // But typically in this flow, we upload -> process -> done.
         // Let's transfer for performance as requested ("Performance & Threading").
        (payload as MergePayload).pdfBuffers.forEach(b => transfer.push(b));
      } else if (action === 'SPLIT_PDF') {
        transfer.push((payload as SplitPayload).pdfBuffer);
      } else if (action === 'IMAGES_TO_PDF') {
        (payload as ImagesToPdfPayload).imageBuffers.forEach(b => transfer.push(b));
      }

      worker.postMessage(message, transfer);
    });
  };

  const mergePdfs = (pdfBuffers: ArrayBuffer[]) => postMessageToWorker('MERGE_PDFS', { pdfBuffers });
  const splitPdf = (pdfBuffer: ArrayBuffer, pageIndices: number[]) => postMessageToWorker('SPLIT_PDF', { pdfBuffer, pageIndices });
  const imagesToPdf = (imageBuffers: ArrayBuffer[], options?: { mode?: 'original'|'max'|'custom', customWidthPx?: number, customHeightPx?: number }) => postMessageToWorker('IMAGES_TO_PDF', { imageBuffers, ...(options || {}) });

  const terminate = () => {
    worker.terminate();
    pendingRequests.clear();
  };

  onUnmounted(() => {
    terminate();
  });

  return {
    mergePdfs,
    splitPdf,
    imagesToPdf,
    terminate // expose if manual termination is needed
  };
}
