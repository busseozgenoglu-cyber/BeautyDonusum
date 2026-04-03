import React, { createContext, useContext, useState } from 'react';
import translations, { LangKey } from '../utils/i18n';

type LangContextType = {
  lang: LangKey;
  t: (key: string) => string;
  setLang: (l: LangKey) => void;
};

const LanguageContext = createContext<LangContextType>({ lang: 'tr', t: (k) => k, setLang: () => {} });
export const useLang = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangKey>('tr');
  const t = (key: string) => translations[lang]?.[key] || translations['tr']?.[key] || key;
  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}
