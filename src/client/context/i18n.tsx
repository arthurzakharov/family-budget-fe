import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// Relative imports: the hot-reload hook below must name them exactly as imported.
import { en, type TranslationKey } from "../translations/en";
import { ru } from "../translations/ru";

export type { TranslationKey };

export const languages = { en, ru };

export type Language = keyof typeof languages;

// The texts `t` reads. In development they are swapped for the new ones when a translation file
// is saved (below), so new keys show at once instead of after restarting the dev server.
let dictionaries: Record<Language, Record<string, string>> = { ...languages };
// Providers re-render when the dictionaries change.
const dictionaryListeners = new Set<() => void>();

// Removed from production builds by Bun. Without it, saving a translation file did not reach
// the dictionaries above: this module exports more than components, so React Fast Refresh does
// not reload it, and the old texts stayed until a restart.
import.meta.hot.accept(["../translations/en", "../translations/ru"], ([newEn, newRu]) => {
  dictionaries = { en: newEn?.en ?? dictionaries.en, ru: newRu?.ru ?? dictionaries.ru };
  for (const listener of dictionaryListeners) listener();
});

type I18n = {
  language: Language;
  setLanguage: (language: Language) => void;
  // Accepts any string so server error codes can be passed in; unknown keys are shown as is.
  t: (key: TranslationKey | (string & {}), params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18n | null>(null);

const STORAGE_KEY = "language";

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in languages) return saved as Language;
  } catch {}
  return navigator.language.startsWith("ru") ? "ru" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(initialLanguage);
  // Bumped when the dictionaries are hot-reloaded, so everything using `t` re-renders.
  const [, setDictionaryVersion] = useState(0);

  useEffect(() => {
    const listener = () => setDictionaryVersion(version => version + 1);
    dictionaryListeners.add(listener);
    return () => {
      dictionaryListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
  }, [language]);

  const t: I18n["t"] = (key, params) => {
    const text: string = dictionaries[language][key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => String(params?.[name] ?? match));
  };

  return <I18nContext value={{ language, setLanguage, t }}>{children}</I18nContext>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
