<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { FileText, Check, Download, RotateCw } from 'lucide-vue-next';
import FileUploader from '@/components/FileUploader.vue';
import { usePdfRenderer } from '@/composables/usePdfRenderer';
import { usePdfWorker } from '@/composables/usePdfWorker';
import { useAppStore } from '@/stores/app';

interface PdfPage {
  index: number;
  thumbnail: string;
  selected: boolean;
}

const store = useAppStore();
const { getDocumentProxy, renderPageFromProxy } = usePdfRenderer();
const { splitPdf } = usePdfWorker();

const currentFile = ref<File | null>(null);
const currentBuffer = ref<ArrayBuffer | null>(null);
const pages = ref<PdfPage[]>([]);
const isProcessing = ref(false);

const handleFileSelected = async (files: File[]) => {
  if (files.length === 0) return;
  
  const file = files[0];
  if (!file || file.type !== 'application/pdf') {
    alert('Please select a valid PDF file.');
    return;
  }

  isProcessing.value = true;
  store.setLoading(true);
  currentFile.value = file;
  pages.value = []; // Clear previous

  try {
    const buffer = await file.arrayBuffer();
    currentBuffer.value = buffer;
    
    const pdfDoc = await getDocumentProxy(buffer);
    const numPages = pdfDoc.numPages;

    // Render thumbnails in chunks to avoid blocking UI too much
    // We'll do sequential rendering for now.
    const newPages: PdfPage[] = [];
    for (let i = 0; i < numPages; i++) {
      const thumb = await renderPageFromProxy(pdfDoc, i, 0.3); // low scale for thumbnail
      newPages.push({
        index: i,
        thumbnail: thumb,
        selected: false
      });
    }
    pages.value = newPages;

  } catch (error) {
    console.error('Error loading PDF', error);
    alert('Could not load PDF. It might be encrypted or corrupted.');
    currentFile.value = null;
    currentBuffer.value = null;
  } finally {
    isProcessing.value = false;
    store.setLoading(false);
  }
};

const togglePage = (index: number) => {
  const page = pages.value.find(p => p.index === index);
  if (page) {
    page.selected = !page.selected;
  }
};

const selectAll = () => pages.value.forEach(p => p.selected = true);
const deselectAll = () => pages.value.forEach(p => p.selected = false);
const invertSelection = () => pages.value.forEach(p => p.selected = !p.selected);

const handleSplit = async () => {
  const selectedIndices = pages.value.filter(p => p.selected).map(p => p.index);
  
  if (selectedIndices.length === 0 || !currentBuffer.value) return;

  isProcessing.value = true;
  store.setLoading(true);

  try {
    // Call worker
    // Note: arrayBuffer might be detached if transferred previously. 
    // In our implementation, we copy buffer if we need it multiple times or manage it carefully.
    // Since we might split multiple times from same source, let's ensure we send a copy if we want to keep source.
    // But our worker logic implementation currently assumes valid buffer.
    
    // Wait, in `usePdfWorker` we transferred the buffer if it was SPLIT_PDF.
    // If we transfer `currentBuffer.value`, it becomes unusable for subsequent splits.
    // We should send a copy.
    const bufferCopy = currentBuffer.value.slice(0);

    const resultPdf = await splitPdf(bufferCopy, selectedIndices);

    // Download
    const blob = new Blob([resultPdf as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentFile.value?.name.replace('.pdf', '')}_extracted.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Split failed', error);
    alert('Failed to extract pages.');
  } finally {
    isProcessing.value = false;
    store.setLoading(false);
  }
};

const reset = () => {
  currentFile.value = null;
  currentBuffer.value = null;
  pages.value = [];
};
</script>

<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Split PDF</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Extract specific pages from your PDF.</p>
    </div>

    <div v-if="!currentFile">
      <FileUploader 
        accept=".pdf" 
        :multiple="false"
        label="Upload PDF to Split"
        @files-selected="handleFileSelected"
      />
    </div>

    <div v-else class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-500">
            <FileText class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-medium text-gray-900 dark:text-white">{{ currentFile.name }}</h3>
            <p class="text-xs text-gray-500">{{ pages.length }} pages detected</p>
          </div>
        </div>
        <div class="flex gap-2">
           <button @click="reset" class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Change File
           </button>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
        <button @click="selectAll" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Select All</button>
        <button @click="deselectAll" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Deselect All</button>
        <button @click="invertSelection" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Invert</button>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div 
          v-for="page in pages" 
          :key="page.index"
          @click="togglePage(page.index)"
          class="relative group cursor-pointer"
        >
          <div 
            class="relative rounded-lg overflow-hidden border-2 transition-all duration-200 shadow-sm aspect-[1/1.414]"
            :class="page.selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'"
          >
            <img :src="page.thumbnail" class="w-full h-full object-contain bg-white" loading="lazy" />
            
            <!-- Overlay -->
            <div 
              class="absolute inset-0 bg-blue-500/10 transition-opacity duration-200"
              :class="page.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            ></div>

            <!-- Checkmark -->
            <div 
              class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              :class="page.selected ? 'bg-blue-500 text-white scale-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'"
            >
              <Check class="w-4 h-4" />
            </div>

            <!-- Page Number -->
            <div class="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              Page {{ page.index + 1 }}
            </div>
          </div>
        </div>
      </div>

      <div class="pt-6 flex justify-center sticky bottom-6 pointer-events-none">
        <div class="pointer-events-auto shadow-xl rounded-xl">
            <button
            @click="handleSplit"
            :disabled="!pages.some(p => p.selected) || isProcessing"
            class="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
            <Download v-if="!isProcessing" class="w-5 h-5" />
            <span v-if="isProcessing" class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
            {{ isProcessing ? 'Processing...' : `Extract ${pages.filter(p => p.selected).length} Pages` }}
            </button>
        </div>
      </div>
    </div>
  </div>
</template>