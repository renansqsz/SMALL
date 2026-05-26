"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "campsoft_theme_mode";

type ThemeMode = "light" | "dark";

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

function getStoredTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  const datasetTheme = document.documentElement.dataset.theme;
  if (datasetTheme === "dark" || datasetTheme === "light") {
    return datasetTheme;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    const nextTheme = getStoredTheme();
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
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
