"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fr, type Translations } from "./translations/fr";
import { en } from "./translations/en";

export type Locale = "fr" | "en";

const STORAGE_KEY = "hi_locale";

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType>({
  locale: "fr",
  setLocale: () => {},
  t: fr,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  // Read locale from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "en" || stored === "fr") {
        setLocaleState(stored);
      }
    } catch {}
  }, []);

  // Sync the HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }

  const t = locale === "en" ? en : fr;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLanguage() {
  return useContext(I18nContext);
}
