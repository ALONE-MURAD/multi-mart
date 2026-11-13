import React from 'react';
import { useI18n } from '../contexts/I18nContext';

export const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useI18n();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold shrink-0"
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
          lang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('bn')}
        className={`rounded-md px-2.5 py-1 transition-colors whitespace-nowrap ${
          lang === 'bn' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
};
