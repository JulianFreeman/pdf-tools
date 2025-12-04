import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';

export const useAppStore = defineStore('app', () => {
  const isDark = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: '',
  });
  const toggleDark = useToggle(isDark);

  const isLoading = ref(false);
  const setLoading = (val: boolean) => isLoading.value = val;

  return {
    isDark,
    toggleDark,
    isLoading,
    setLoading
  };
});
