"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { isTheme, THEME_STORAGE_KEY, type Theme } from "@/components/theme/theme-config";

export type { Theme } from "@/components/theme/theme-config";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolvePreferredTheme(): Theme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (isTheme(savedTheme)) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const applyTheme = (nextTheme: Theme) => {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  };

  useLayoutEffect(() => {
    applyTheme(resolvePreferredTheme());
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        applyTheme(isTheme(event.newValue) ? event.newValue : resolvePreferredTheme());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        const documentTheme = document.documentElement.dataset.theme;
        const currentTheme = isTheme(documentTheme) ? documentTheme : theme;
        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
      }
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
