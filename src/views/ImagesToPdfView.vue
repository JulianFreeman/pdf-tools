<script setup lang="ts">
import { ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { Image as ImageIcon, X, Download } from 'lucide-vue-next';
import FileUploader from '@/components/FileUploader.vue';
import { usePdfWorker } from '@/composables/usePdfWorker';
import { useAppStore } from '@/stores/app';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  name: string;
}

const store = useAppStore();
const { imagesToPdf } = usePdfWorker();

const images = ref<ImageFile[]>([]);
const isProcessing = ref(false);

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
      alert(`Skipped ${file.name}: Not an image`);
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

    // Call worker
    const resultPdf = await imagesToPdf(buffers);

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
    alert('Failed to convert images to PDF.');
  } finally {
    isProcessing.value = false;
    store.setLoading(false);
  }
};
</script>

<template>
  <div class="space-y-8">
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Images to PDF</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-2">Convert and combine images into a single PDF.</p>
    </div>

    <FileUploader 
      accept="image/*" 
      :multiple="true"
      label="Drop Images here"
      description="Supports JPG, PNG, WEBP"
      @files-selected="handleFilesSelected"
    />

    <div v-if="images.length > 0" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Images ({{ images.length }})</h3>
        <button 
          @click="images = []" 
          class="text-sm text-red-500 hover:text-red-600 dark:text-red-400"
        >
          Clear All
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
          {{ isProcessing ? 'Converting...' : 'Convert to PDF' }}
        </button>
      </div>
    </div>
  </div>
</template>