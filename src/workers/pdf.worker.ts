import { PDFDocument } from 'pdf-lib';
import type { WorkerMessage, WorkerResponse, MergePayload, SplitPayload, ImagesToPdfPayload } from '../types/pdf';

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, action, payload } = e.data;

  try {
    let resultBytes: Uint8Array;

    switch (action) {
      case 'MERGE_PDFS':
        resultBytes = await mergePdfs((payload as MergePayload).pdfBuffers);
        break;
      case 'SPLIT_PDF':
        resultBytes = await splitPdf((payload as SplitPayload).pdfBuffer, (payload as SplitPayload).pageIndices);
        break;
      case 'IMAGES_TO_PDF':
        resultBytes = await imagesToPdf((payload as ImagesToPdfPayload).imageBuffers);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response: WorkerResponse = {
      id,
      success: true,
      data: resultBytes
    };

    // Cast self to any to avoid TS lib issues with Worker types
    (self as any).postMessage(response, [resultBytes.buffer]);

  } catch (error: any) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error.message || 'Unknown error in PDF worker'
    };
    self.postMessage(response);
  }
};

async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const buffer of pdfBuffers) {
    // Convert to Uint8Array for better compatibility
    const uint8Buffer = new Uint8Array(buffer);
    
    // Load with error tolerance
    let pdf;
    try {
       pdf = await PDFDocument.load(uint8Buffer, { ignoreEncryption: true });
    } catch (e) {
       // If load fails, sometimes it's a catastrophic failure we can't fix easily without more advanced tools.
       // But often the warning is just a warning.
       throw e; 
    }

    // "Scrub" the PDF to fix XRef tables and invalid objects if we detect potential issues.
    // We do this by saving it once to normalize the structure.
    // This is expensive but fixes many "blank page" issues on malformed PDFs.
    // To optimize, we could try-catch the copyPages or check for warnings, but pdf-lib doesn't expose warnings easily.
    // Let's do it blindly for robustness given the user report.
    const scrubbedBytes = await pdf.save();
    const scrubbedPdf = await PDFDocument.load(scrubbedBytes, { ignoreEncryption: true });

    const copiedPages = await mergedPdf.copyPages(scrubbedPdf, scrubbedPdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

async function splitPdf(pdfBuffer: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array> {
  const uint8Buffer = new Uint8Array(pdfBuffer);
  
  // 1. Initial Load
  const srcPdf = await PDFDocument.load(uint8Buffer, { ignoreEncryption: true });
  
  // 2. "Scrub" / Normalize the PDF. 
  // This rebuilds the XRef table and fixes broken object references which cause blank pages.
  const scrubbedBytes = await srcPdf.save();
  const scrubbedSrcPdf = await PDFDocument.load(scrubbedBytes, { ignoreEncryption: true });

  // 3. Create new doc and copy from the CLEAN source
  const newPdf = await PDFDocument.create();
  
  const copiedPages = await newPdf.copyPages(scrubbedSrcPdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

async function imagesToPdf(imageBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const buffer of imageBuffers) {
    let image;
    const header = new Uint8Array(buffer.slice(0, 4));
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
    
    if (isPng) {
      image = await pdf.embedPng(buffer);
    } else {
      image = await pdf.embedJpg(buffer);
    }

    const page = pdf.addPage();
    const { width, height } = image.scale(1);
    
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    page.setSize(A4_WIDTH, A4_HEIGHT);
    
    const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    
    page.drawImage(image, {
      x: (A4_WIDTH - drawWidth) / 2,
      y: (A4_HEIGHT - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdf.save();
}
