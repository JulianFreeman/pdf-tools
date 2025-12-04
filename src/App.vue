<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { Moon, Sun, Home, Globe } from 'lucide-vue-next';
import { messages } from '@/i18n';
import { computed, watch } from 'vue';

const store = useAppStore();
const t = computed(() => messages[store.currentLanguage]);

// Update page title when language changes
watch(() => store.currentLanguage, () => {
  document.title = t.value.common.pdfTools;
}, { immediate: true });
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <nav class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <RouterLink to="/" class="flex items-center gap-2 font-bold text-xl dark:text-white">
          <Home class="w-6 h-6" />
          {{ t.common.pdfTools }}
        </RouterLink>
        
        <div class="flex items-center gap-2">
          <button 
            @click="store.toggleLanguage()" 
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white"
            :title="store.currentLanguage === 'en' ? '切换到中文' : 'Switch to English'"
          >
            <Globe class="w-5 h-5" />
          </button>
          <button 
            @click="store.toggleDark()" 
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-white"
          >
            <Moon v-if="!store.isDark" class="w-5 h-5" />
            <Sun v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>