import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

export const messages = {
  en,
  'zh-CN': zhCN
};

export type MessageSchema = typeof en;

// Get the user's preferred language
export const getPreferredLanguage = (): string => {
  // First check localStorage
  const saved = localStorage.getItem('app-language');
  if (saved && (saved === 'en' || saved === 'zh-CN')) {
    return saved;
  }

  // Then check browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  
  // If browser language is Chinese (simplified)
  if (browserLang.startsWith('zh')) {
    // Check if it's specifically zh-CN or just zh
    if (browserLang.toLowerCase() === 'zh-cn' || browserLang.toLowerCase() === 'zh-hans' || browserLang.toLowerCase().startsWith('zh-cn')) {
      return 'zh-CN';
    }
    // For other Chinese variants, default to English
    return 'en';
  }
  
  // If browser language is English
  if (browserLang.startsWith('en')) {
    return 'en';
  }

  // Default to English
  return 'en';
};
