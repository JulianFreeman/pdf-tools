<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Image as ImageIcon, X, Download } from 'lucide-vue-next';
import FileUploader from '@/components/FileUploader.vue';
import { usePdfWorker } from '@/composables/usePdfWorker';
import { useAppStore } from '@/stores/app';
import { messages } from '@/i18n';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  name: string;
}

const store = useAppStore();
const t = computed(() => messages[store.currentLanguage]);
const { imagesToPdf } = usePdfWorker();

const images = ref<ImageFile[]>([]);
const isProcessing = ref(false);
// Page sizing options
const sizeMode = ref<'original' | 'max' | 'custom'>('original');
const customWidthPx = ref<number>(2480); // default ~A4 width at 96 DPI (approx)
const customHeightPx = ref<number>(3508); // default ~A4 height at 96 DPI (approx)
const preset = ref<'none' | 'A4' | 'A3' | 'Letter'>('none');

// helpers for presets (convert mm -> px at 96 DPI)
const mmToPx = (mm: number) => Math.round((mm * 96) / 25.4);
const applyPreset = (p: string) => {
  if (p === 'A4') {
    customWidthPx.value = mmToPx(210);
    customHeightPx.value = mmToPx(297);
    sizeMode.value = 'custom';
  } else if (p === 'A3') {
    customWidthPx.value = mmToPx(297);
    customHeightPx.value = mmToPx(420);
    sizeMode.value = 'custom';
  } else if (p === 'Letter') {
    // Letter 8.5in x 11in -> mm
    const wMm = 8.5 * 25.4;
    const hMm = 11 * 25.4;
    customWidthPx.value = mmToPx(wMm);
    customHeightPx.value = mmToPx(hMm);
    sizeMode.value = 'custom';
  } else {
    // none
    preset.value = 'none';
  }
};

const handleFilesSelected = (selectedFiles: File[]) => {
  for (const file of selectedFiles) {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      images.value.push({
        id: crypto.randomUUID(),
        file,
        url,
        name: file.name
      });
    } else {
      alert(t.value.imagesToPdf.skipError.replace('{{filename}}', file.name));
    }
  }
};

const removeImage = (id: string) => {
  const img = images.value.find(i => i.id === id);
  if (img) {
    URL.revokeObjectURL(img.url);
    images.value = images.value.filter(i => i.id !== id);
  }
};

const handleConvert = async () => {
  if (images.value.length === 0) return;

  isProcessing.value = true;
  store.setLoading(true);

  try {
    // Convert to buffers
    const buffers: ArrayBuffer[] = [];
    for (const img of images.value) {
      const buffer = await img.file.arrayBuffer();
      buffers.push(buffer);
    }

    // Build options
    const options: any = { mode: sizeMode.value };
    if (sizeMode.value === 'custom') {
      options.customWidthPx = customWidthPx.value;
      options.customHeightPx = customHeightPx.value;
    }

    // Call worker
    const resultPdf = await imagesToPdf(buffers, options);

    // Download
    const blob = new Blob([resultPdf as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `images_converted_${new Date().toISOString().slice(0,10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Conversion failed', error);
    alert(t.value.imagesToPdf.conversionError);
  } finally {
    isProcessing.value = false;
    store.setLoading(false);
  }
};
</script>

<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ t.imagesToPdf.title }}</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">{{ t.imagesToPdf.description }}</p>
    </div>

    <FileUploader 
      accept="image/*" 
      :multiple="true"
      :label="t.imagesToPdf.uploadLabel"
      :description="t.imagesToPdf.uploadDescription"
      @files-selected="handleFilesSelected"
    />

    <!-- Page size options -->
    <div class="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap items-center gap-4">
        <div class="inline-flex rounded-md shadow-sm -space-x-px">
          <button
            type="button"
            @click="sizeMode = 'original'"
            :class="[
              'relative inline-flex items-center px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-purple-500',
              sizeMode === 'original'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600',
              'rounded-l-md'
            ]"
          >
            {{ t.imagesToPdf.sizeOriginal }}
          </button>
          <button
            type="button"
            @click="sizeMode = 'max'"
            :class="[
              'relative inline-flex items-center px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-purple-500',
              sizeMode === 'max'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600'
            ]"
          >
            {{ t.imagesToPdf.sizeMax }}
          </button>
          <button
            type="button"
            @click="sizeMode = 'custom'"
            :class="[
              'relative inline-flex items-center px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-purple-500',
              sizeMode === 'custom'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600',
              'rounded-r-md'
            ]"
          >
            {{ t.imagesToPdf.sizeCustom }}
          </button>
        </div>

        <template v-if="sizeMode === 'custom'">
          <div class="flex items-center gap-4">
            <label class="text-sm text-gray-600 dark:text-gray-300">{{ t.imagesToPdf.sizePresetLabel }}</label>
            <select v-model="preset" @change="applyPreset(preset)" 
              class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300
                     focus:outline-none focus:ring-2 focus:ring-purple-500" >
              <option value="none">{{ t.imagesToPdf.presetNone || 'None' }}</option>
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Letter">Letter</option>
            </select>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">{{ t.imagesToPdf.customWidthLabel }}</label>
              <input type="number" v-model.number="customWidthPx" min="1" 
                class="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <span class="text-xs text-gray-500 dark:text-gray-400">px</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-300">{{ t.imagesToPdf.customHeightLabel }}</label>
              <input type="number" v-model.number="customHeightPx" min="1" 
                class="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-purple-500" />
              <span class="text-xs text-gray-500 dark:text-gray-400">px</span>
            </div>
          </div>
        </template>
      </div>
    </div>
    
    <div v-if="images.length > 0" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ t.imagesToPdf.images }} ({{ images.length }})</h3>
        <button 
          @click="images = []" 
          class="text-sm text-red-500 hover:text-red-600 dark:text-red-400"
        >
          {{ t.common.clearAll }}
        </button>
      </div>

      <VueDraggable
        v-model="images"
        :animation="150"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        handle=".drag-handle"
      >
        <div 
          v-for="(img, index) in images" 
          :key="img.id"
          class="relative group aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
        >
            <img :src="img.url" class="w-full h-full object-cover drag-handle cursor-move" />
            
            <div class="absolute inset-x-0 bottom-0 bg-black/60 text-white p-2 text-xs truncate">
                {{ index + 1 }}. {{ img.name }}
            </div>

            <button 
                @click="removeImage(img.id)" 
                class="absolute top-2 right-2 p-1.5 bg-white/90 text-gray-600 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X class="w-4 h-4" />
            </button>
        </div>
      </VueDraggable>

      <div class="pt-6 flex justify-center">
        <button
          @click="handleConvert"
          :disabled="images.length === 0 || isProcessing"
          class="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Download v-if="!isProcessing" class="w-5 h-5" />
          <span v-if="isProcessing" class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
          {{ isProcessing ? t.imagesToPdf.processing : t.imagesToPdf.convertButton }}
        </button>
      </div>
    </div>
  </div>
</template>