import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@/shared/i18n/locales';
import { ja, type MessageKey } from '@/shared/i18n/messages/ja';
import { en } from '@/shared/i18n/messages/en';

const catalogs = { ja, en } as const;

const STORAGE_KEY = 'nene-locale';

function translate(
  locale: SupportedLocale,
  key: MessageKey,
  vars?: Record<string, string>,
): string {
  const template = catalogs[locale][key] ?? ja[key];
  if (vars === undefined) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
}

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(): SupportedLocale {
  const stored = globalThis.localStorage.getItem(STORAGE_KEY);
  return stored !== null && isSupportedLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }): ReactNode {
  const [locale, setLocaleState] = useState<SupportedLocale>(readInitialLocale);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    globalThis.localStorage.setItem(STORAGE_KEY, next);
    globalThis.document.documentElement.setAttribute('lang', next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Context + hook colocated by design; the hook export is not a fast-refresh component.
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (ctx === null) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
