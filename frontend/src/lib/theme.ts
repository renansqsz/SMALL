export const THEME_STORAGE_KEY = "campsoft_theme_mode";
export const THEME_SESSION_STORAGE_KEY = "campsoft_theme_mode_session";

export type ThemeMode = "light" | "dark";

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark";
}

function readStorage(getValue: () => string | null): string | null {
  try {
    return getValue();
  } catch {
    return null;
  }
}

function writeStorage(setValue: () => void) {
  try {
    setValue();
  } catch {
    // Ignore storage sync failures and keep the theme applied in memory.
  }
}

export function getThemeFromDocument(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  const datasetTheme = document.documentElement.dataset.theme;
  if (isThemeMode(datasetTheme)) {
    return datasetTheme;
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const sessionTheme = readStorage(() => window.sessionStorage.getItem(THEME_SESSION_STORAGE_KEY));
  if (isThemeMode(sessionTheme)) {
    return sessionTheme;
  }

  const localTheme = readStorage(() => window.localStorage.getItem(THEME_STORAGE_KEY));
  if (isThemeMode(localTheme)) {
    return localTheme;
  }

  return getThemeFromDocument();
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}

export function persistTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  writeStorage(() => window.localStorage.setItem(THEME_STORAGE_KEY, theme));
  writeStorage(() => window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, theme));
}

export function resolveTheme(): ThemeMode {
  const theme = getStoredTheme();
  applyTheme(theme);
  persistTheme(theme);
  return theme;
}
