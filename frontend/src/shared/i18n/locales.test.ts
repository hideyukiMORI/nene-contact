import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from '@/shared/i18n/locales';

describe('locales', () => {
  it('supports exactly ja and en, with ja authoritative (ADR 0011)', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ja', 'en']);
    expect(DEFAULT_LOCALE).toBe('ja');
  });

  it('recognises supported locales and rejects everything else', () => {
    expect(isSupportedLocale('ja')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
    // Case-sensitive: a stored value must match exactly to be honoured.
    expect(isSupportedLocale('JA')).toBe(false);
  });
});
