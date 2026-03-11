import React, { createContext, useContext, useState } from 'react';
import { translate, translations as allTranslations } from '@/lib/translations';

const LanguageContext = createContext({
  language: 'ar',
  changeLanguage: () => {},
  t: (key) => key,
  dir: 'rtl'
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wasel_lang') || 'ar';
    }
    return 'ar';
  });

    const t = (key) => {
    return translate(key, language);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('wasel_lang', lang);
    window.location.reload(); 
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, dir }}>
      <div dir={dir} className={language === 'ar' ? "font-['Cairo',sans-serif]" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    console.warn('useLanguage must be used within LanguageProvider. Using default values.');
    return {
      language: 'ar',
      changeLanguage: () => {},
      t: (key) => key,
      dir: 'rtl'
    };
  }
  return context;
}