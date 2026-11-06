import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

// Applies the theme to <html data-theme="..."> and remembers the choice.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
