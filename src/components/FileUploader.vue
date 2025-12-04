<script setup lang="ts">
import { ref } from 'vue';
import { Upload, FileType } from 'lucide-vue-next';
import { useDropZone } from '@vueuse/core';

const props = defineProps<{
  accept?: string;
  multiple?: boolean;
  label?: string;
  description?: string;
}>();

const emit = defineEmits<{
  (e: 'files-selected', files: File[]): void;
}>();

const dropZoneRef = ref<HTMLElement>();
const fileInputRef = ref<HTMLInputElement>();

const onDrop = (files: File[] | null) => {
  if (files && files.length > 0) {
    handleFiles(files);
  }
};

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
});

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    handleFiles(Array.from(input.files));
  }
  // Reset input so same file can be selected again if needed
  input.value = '';
};

const handleFiles = (files: File[]) => {
  // Filter by accept if needed, though input handles mostly
  // Simple extension check if strictly required, but usually redundant with UI feedback
  emit('files-selected', files);
};

const triggerInput = () => {
  fileInputRef.value?.click();
};
</script>

<template>
  <div
    ref="dropZoneRef"
    @click="triggerInput"
    class="relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group"
    :class="[
      isOverDropZone 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
    ]"
  >
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      :accept="props.accept"
      :multiple="props.multiple"
      @change="onFileChange"
    />

    <div class="flex flex-col items-center gap-4">
      <div 
        class="p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 transition-transform duration-200 group-hover:scale-110"
        :class="{ 'bg-blue-100 dark:bg-blue-900/50 scale-110': isOverDropZone }"
      >
        <Upload v-if="!isOverDropZone" class="w-8 h-8" />
        <FileType v-else class="w-8 h-8" />
      </div>
      
      <div class="space-y-1">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ props.label || (isOverDropZone ? 'Drop files here' : 'Click to upload or drag and drop') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ props.description || (props.accept ? `Supported formats: ${props.accept}` : '') }}
        </p>
      </div>
    </div>
  </div>
</template>
