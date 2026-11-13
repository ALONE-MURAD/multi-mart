import React, { createContext, useContext, useState } from 'react';
import { TRANSLATIONS, type TranslationDict } from '../i18n';
import type { Language } from '../types';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationDict;
  pickText: (en?: string, bn?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('multimart_lang') : null;
    return saved === 'bn' ? 'bn' : 'en';
  });

  const setLang = (next: Language) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('multimart_lang', next);
    }
  };

  const pickText = (en?: string, bn?: string) => {
    if (lang === 'bn' && bn && bn.trim()) return bn;
    return en || bn || '';
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang], pickText }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
