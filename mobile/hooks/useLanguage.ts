import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '@/constants/i18n';
import { strings } from '@/constants/i18n';

const STORAGE_KEY = 'hc_language';

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'en' || val === 'zh-CN') setLanguageState(val);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = (key: string) => strings[language][key] ?? key;

  return { language, setLanguage, t };
}
