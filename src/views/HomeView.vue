<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { FileInput, Combine, Images } from 'lucide-vue-next';
import { useAppStore } from '@/stores/app';
import { messages } from '@/i18n';
import { computed } from 'vue';

const store = useAppStore();
const t = computed(() => messages[store.currentLanguage]);
</script>

<template>
  <div class="max-w-4xl mx-auto text-center space-y-8">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
      {{ t.home.title }}
    </h1>
    <p class="text-lg text-gray-600 dark:text-gray-400">
      {{ t.home.description }}
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <RouterLink to="/split" class="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-800 group">
        <div class="flex flex-col items-center gap-4">
          <FileInput class="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform" />
          <h2 class="text-xl font-semibold dark:text-white">{{ t.home.splitPdf }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.home.splitDescription }}</p>
        </div>
      </RouterLink>
      
      <RouterLink to="/merge" class="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors bg-white dark:bg-gray-800 group">
        <div class="flex flex-col items-center gap-4">
          <Combine class="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform" />
          <h2 class="text-xl font-semibold dark:text-white">{{ t.home.mergePdfs }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.home.mergeDescription }}</p>
        </div>
      </RouterLink>
      
      <RouterLink to="/images-to-pdf" class="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors bg-white dark:bg-gray-800 group">
        <div class="flex flex-col items-center gap-4">
          <Images class="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform" />
          <h2 class="text-xl font-semibold dark:text-white">{{ t.home.imagesToPdf }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.home.imagesToPdfDescription }}</p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
