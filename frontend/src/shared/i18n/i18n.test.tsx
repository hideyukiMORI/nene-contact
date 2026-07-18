import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '@/shared/i18n';
import { ja, type MessageKey } from '@/shared/i18n/messages/ja';
import { en } from '@/shared/i18n/messages/en';

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return <I18nProvider>{children}</I18nProvider>;
}

beforeEach(() => {
  globalThis.localStorage.clear();
});

afterEach(() => {
  globalThis.localStorage.clear();
});

describe('useI18n / t()', () => {
  it('defaults to ja and translates a known key', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe('ja');
    expect(result.current.t('common.loading')).toBe(ja['common.loading']);
  });

  it('interpolates {vars} and leaves an unmatched placeholder intact', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    // ja['home.role'] === 'ロール: {role}'
    expect(result.current.t('home.role', { role: 'admin' })).toBe('ロール: admin');
    // A var name that is not in the template's placeholders leaves the placeholder literal.
    expect(result.current.t('home.role', { nope: 'x' })).toBe(ja['home.role']);
  });

  it('switches locale, reflects it in t(), and persists it to storage + <html lang>', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });

    act(() => {
      result.current.setLocale('en');
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t('common.loading')).toBe(en['common.loading']);
    expect(globalThis.localStorage.getItem('nene-locale')).toBe('en');
    expect(globalThis.document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('falls back to the authoritative ja when a key is missing from en (ADR 0011)', () => {
    // en is intentionally incomplete (see #310); a missing key must resolve to ja, not blank.
    const jaOnlyKey = (Object.keys(ja) as MessageKey[]).find((k) => !(k in en));
    expect(jaOnlyKey).toBeDefined();
    const key = jaOnlyKey as MessageKey;

    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => {
      result.current.setLocale('en');
    });

    expect(result.current.t(key)).toBe(ja[key]);
  });

  it('restores a persisted locale on mount', () => {
    globalThis.localStorage.setItem('nene-locale', 'en');
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe('en');
  });

  it('ignores an unsupported persisted value and uses the default locale', () => {
    globalThis.localStorage.setItem('nene-locale', 'fr');
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.locale).toBe('ja');
  });
});
