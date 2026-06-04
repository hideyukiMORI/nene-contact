// ja + en only (ADR 0011). ja is authoritative; do not add a third locale without
// superseding ADR 0011.
export const SUPPORTED_LOCALES = ['ja', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'ja';

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
