"use client";

import { useEffect, useState } from "react";

import { applyTheme, getStoredTheme, persistTheme, resolveTheme, type ThemeMode } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    const nextTheme = resolveTheme();
    setTheme(nextTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  return (
    <div className="theme-toggle-shell">
      <button
        className={`theme-toggle${isDark ? " is-dark" : ""}`}
        type="button"
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        aria-pressed={isDark}
        onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      >
        <span className="theme-toggle-track" aria-hidden="true">
          <span className="theme-scene theme-scene-day">
            <span className="theme-sky-cloud theme-sky-cloud-a" />
            <span className="theme-sky-cloud theme-sky-cloud-b" />
            <span className="theme-sun" />
            <span className="theme-hill theme-hill-back" />
            <span className="theme-hill theme-hill-front" />
            <span className="theme-tree">
              <span className="theme-tree-crown theme-tree-crown-left" />
              <span className="theme-tree-crown theme-tree-crown-right" />
              <span className="theme-tree-trunk" />
            </span>
          </span>

          <span className="theme-scene theme-scene-night">
            <span className="theme-moon" />
            <span className="theme-star theme-star-a" />
            <span className="theme-star theme-star-b" />
            <span className="theme-star theme-star-c" />
            <span className="theme-star theme-star-d" />
            <span className="theme-hill theme-hill-back" />
            <span className="theme-hill theme-hill-front" />
            <span className="theme-tree">
              <span className="theme-tree-crown theme-tree-crown-left" />
              <span className="theme-tree-crown theme-tree-crown-right" />
              <span className="theme-tree-trunk" />
            </span>
          </span>

          <span className="theme-toggle-thumb" />
        </span>
      </button>
    </div>
  );
}
