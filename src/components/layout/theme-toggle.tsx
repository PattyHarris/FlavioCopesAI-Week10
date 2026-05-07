"use client";

import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="ghost-button" onClick={toggleTheme} type="button">
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
