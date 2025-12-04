import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core';
import { getPreferredLanguage } from '@/i18n';

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

  const currentLanguage = ref<'en' | 'zh-CN'>(
    (localStorage.getItem('app-language') as 'en' | 'zh-CN') || getPreferredLanguage() as 'en' | 'zh-CN'
  );

  const setLanguage = (lang: 'en' | 'zh-CN') => {
    currentLanguage.value = lang;
    localStorage.setItem('app-language', lang);
  };

  const toggleLanguage = () => {
    const newLang = currentLanguage.value === 'en' ? 'zh-CN' : 'en';
    setLanguage(newLang);
  };

  return {
    isDark,
    toggleDark,
    isLoading,
    setLoading,
    currentLanguage,
    setLanguage,
    toggleLanguage
  };
});
