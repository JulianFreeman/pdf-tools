<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { FileText, X, GripVertical, Download } from 'lucide-vue-next';
import FileUploader from '@/components/FileUploader.vue';
import { usePdfWorker } from '@/composables/usePdfWorker';
import { useAppStore } from '@/stores/app';
import { messages } from '@/i18n';

interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer?: ArrayBuffer;
}

const store = useAppStore();
const t = computed(() => messages[store.currentLanguage]);
const { mergePdfs } = usePdfWorker();

const files = ref<PdfFile[]>([]);
const isProcessing = ref(false);

const handleFilesSelected = async (selectedFiles: File[]) => {
  for (const file of selectedFiles) {
    if (file.type === 'application/pdf') {
      files.value.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size
      });
    } else {
      alert(t.value.merge.skipError.replace('{{filename}}', file.name));
    }
  }
};

const removeFile = (id: string) => {
  files.value = files.value.filter(f => f.id !== id);
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const handleMerge = async () => {
  if (files.value.length < 2) return;
  
  isProcessing.value = true;
  store.setLoading(true);

  try {
    // Convert files to ArrayBuffers
    const buffers: ArrayBuffer[] = [];
    for (const pdf of files.value) {
      const buffer = await pdf.file.arrayBuffer();
      buffers.push(buffer);
    }

    // Send to worker
    const resultPdf = await mergePdfs(buffers);

    // Download
    const blob = new Blob([resultPdf as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `merged_${new Date().toISOString().slice(0,10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Merge failed', error);
    alert(t.value.merge.mergeError);
  } finally {
    isProcessing.value = false;
    store.setLoading(false);
  }
};
</script>

<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ t.merge.title }}</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">{{ t.merge.description }}</p>
    </div>

    <FileUploader 
      accept=".pdf" 
      :multiple="true"
      :label="t.merge.uploadLabel"
      :description="t.merge.uploadDescription"
      @files-selected="handleFilesSelected"
    />

    <div v-if="files.length > 0" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ t.merge.title }} ({{ files.length }})</h3>
        <button 
          @click="files = []" 
          class="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          {{ t.common.clearAll }}
        </button>
      </div>

      <VueDraggable
        v-model="files"
        :animation="150"
        handle=".drag-handle"
        class="space-y-3"
      >
        <div 
          v-for="item in files" 
          :key="item.id"
          class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group"
        >
          <button class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <GripVertical class="w-5 h-5" />
          </button>
          
          <FileText class="w-8 h-8 text-red-500" />
          
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ item.name }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatSize(item.size) }}
            </p>
          </div>

          <button 
            @click="removeFile(item.id)" 
            class="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </VueDraggable>

      <div class="pt-6 flex justify-center">
        <button
          @click="handleMerge"
          :disabled="files.length < 2 || isProcessing"
          class="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Download v-if="!isProcessing" class="w-5 h-5" />
          <span v-if="isProcessing" class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
          {{ isProcessing ? t.merge.processing : t.merge.mergeButton }}
        </button>
      </div>
    </div>
  </div>
</template>