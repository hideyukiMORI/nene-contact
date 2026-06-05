import { useCallback, useEffect, useState } from 'react';

// Light/dark theme for the admin console (Design System v2). The choice is mirrored
// onto <html data-theme> so the centralized CSS tokens flip, and persisted so the
// next visit (and the login screen, before the toggle mounts) keeps it.
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'nc_theme';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

export function readInitialTheme(): Theme {
  const stored = globalThis.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  globalThis.localStorage.setItem(STORAGE_KEY, theme);
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
