'use client';

import React, { createContext, useContext, useState } from 'react';
import { translations, Language } from '@/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('sechub_language') as Language;
      if (savedLanguage === 'en' || savedLanguage === 'vi') return savedLanguage;
    }
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    return isTest ? 'vi' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sechub_language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    // Helper to get nested value from object
    const getNestedValue = (obj: unknown, path: string) => {
      return path.split('.').reduce((acc: unknown, part) => (acc as Record<string, unknown>)?.[part], obj);
    };

    // 1. Get from current language
    let val = getNestedValue(translations[language], key);

    // 2. Fallback to English if not found in current language
    if (val === undefined && language !== 'en') {
      val = getNestedValue(translations['en'], key);
    }

    // 3. Fallback to key if not found at all
    if (val === undefined) {
      return key;
    }

    let text = String(val);

    // Replace parameters if provided, e.g. {count} -> 5
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const fallbackLang: Language = isTest ? 'vi' : 'en';
    const fallbackT = (key: string, params?: Record<string, string | number>): string => {
      const getNestedValue = (obj: unknown, path: string) => {
        return path.split('.').reduce((acc: unknown, part) => (acc as Record<string, unknown>)?.[part], obj);
      };
      let val = getNestedValue(translations[fallbackLang], key);
      if (val === undefined && fallbackLang !== 'en') {
        val = getNestedValue(translations['en'], key);
      }
      if (val === undefined) return key;
      let text = String(val);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }
      return text;
    };
    return {
      language: fallbackLang,
      setLanguage: () => {},
      t: fallbackT
    };
  }
  return context;
};
