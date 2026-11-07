import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

export const themes = ["light", "dark"] as const;

export type Theme = (typeof themes)[number];

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (themes.includes(saved as Theme)) return saved as Theme;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Puts the theme on <html>. HeroUI reads either the data-theme attribute or the class, so set both.
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

// Applies the theme to <html data-theme="..."> and remembers the choice.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(initialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Switching crossfades the whole page from the old colours to the new ones (the duration is in
  // index.css). Browsers without view transitions, and people who asked for less motion, get
  // the switch at once.
  const setTheme = (next: Theme) => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (next === theme || reduceMotion || !document.startViewTransition) {
      setThemeState(next);
      return;
    }
    document.startViewTransition(() => {
      // The new look must be in place when the callback returns, so apply it right away.
      applyTheme(next);
      flushSync(() => setThemeState(next));
    });
  };

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
