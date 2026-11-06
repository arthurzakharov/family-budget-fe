import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { en, type TranslationKey } from "@client/translations/en";
import { ru } from "@client/translations/ru";

export type { TranslationKey };

export const languages = { en, ru };

export type Language = keyof typeof languages;

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

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {}
  }, [language]);

  const t: I18n["t"] = (key, params) => {
    const text: string = (languages[language] as Record<string, string>)[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => String(params?.[name] ?? match));
  };

  return <I18nContext value={{ language, setLanguage, t }}>{children}</I18nContext>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
