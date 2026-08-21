"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "theme";
const DEFAULT: Theme = "dark";

const ThemeCtx = createContext<{
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}>({ theme: DEFAULT, toggle: () => {}, set: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return DEFAULT;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return saved === "light" || saved === "dark" ? saved : DEFAULT;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme(p => p === "dark" ? "light" : "dark"), []);
  const set = useCallback((t: Theme) => setTheme(t), []);

  return (
    <ThemeCtx.Provider value={{ theme, toggle, set }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
