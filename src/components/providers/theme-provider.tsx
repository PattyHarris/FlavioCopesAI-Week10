"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("wn-theme") as Theme | null;
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme ?? (preferredDark ? "dark" : "light");

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const value = {
    theme,
    toggleTheme() {
      setTheme((currentTheme) => {
        const nextTheme = currentTheme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem("wn-theme", nextTheme);
        return nextTheme;
      });
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
