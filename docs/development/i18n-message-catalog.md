# i18n Message Catalog (binding)

Language switching (`ja` / `en`, ADR 0011) is a product premise. **Every user-facing string
on every screen lives in a per-locale message-catalog file** and is rendered through a
lookup (`t(key)`) — never hardcoded. Switching locale is then **instant and complete**: the
catalog is already in the bundle, so a locale change re-renders text with no network round
trip and no reload.

Grounded in NeNe Records' working `frontend/src/shared/i18n/`, adapted to Contact
(**`ja` authoritative**) and Contact's public **embed widget**.

> **Enforcement:** a hardcoded user-facing string (text not resolved via `t()`), or a
> catalog key referenced in code but missing from a catalog, **blocks merge**. Locales stay
> `ja` / `en` only (ADR 0011); a third locale needs a superseding ADR. Deviations require an
> ADR (self-authority, ADR 0012 model).

Read with: [`frontend-standards.md`](./frontend-standards.md),
[`naming-conventions.md`](./naming-conventions.md), ADR 0011,
[ADR 0008](../adr/0008-english-only-repository-documentation.md).

---

## 1. Module layout (`frontend/src/shared/i18n/`)

```text
shared/i18n/
  locales.ts            # SupportedLocale, LOCALES meta, DEFAULT_LOCALE, resolveLocale()
  messages/
    ja.ts               # AUTHORITATIVE catalog — defines MessageCatalog (every key present)
    en.ts               # Partial<MessageCatalog> — falls back to ja
    index.ts            # getMessages(locale)
  translate.ts          # MessageKey = keyof MessageCatalog, translate() (+ {{param}})
  i18n-context.tsx      # I18nProvider (detect → persist → apply <html lang>)
  use-translation.ts    # useTranslation() → { t, locale, setLocale }
  locales.test.ts       # catalog parity / completeness test
```

```ts
// locales.ts
export type SupportedLocale = 'ja' | 'en'           // ADR 0011 — exactly these
export const DEFAULT_LOCALE: SupportedLocale = 'ja'  // ja authoritative
```

```ts
// translate.ts — ja is the complete catalog; en falls back to ja
import { ja, type MessageCatalog } from './messages/ja'
export type MessageKey = keyof MessageCatalog
export type MessageParams = Record<string, string | number>

export function translate(messages: Partial<MessageCatalog>, key: MessageKey, params?: MessageParams): string {
  const raw = messages[key] ?? ja[key]
  if (!params) return raw
  return raw.replace(/\{\{(\w+)\}\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}
```

- **`ja.ts` is the single source of truth for the key set** (`MessageCatalog`). `en.ts` is
  `Partial<MessageCatalog>`; any key it omits falls back to Japanese at runtime.
- **Flat, dotted keys** map to strings; `{{param}}` placeholders are interpolated. No nested
  objects, no JSX in catalogs.

---

## 2. The no-hardcoded-string rule

- **No user-facing literal** appears in a component, hook, page, or widget. Every label,
  button, heading, placeholder, empty-state copy, error message, confirm-dialog text,
  tooltip, and `aria-label` comes from `t('...')`.
- Components call `const { t } = useTranslation()` and render `t('admin.submissions.title')`.
- Pluralization / parameters use `{{param}}`: `t('admin.submissions.count', { n })`.
- The only non-catalog text is **operator-authored data** (§5) and machine identifiers
  (slugs, codes) that are never shown as prose.

---

## 3. Key naming convention

`{scope}.{feature}.{element}` — lowercase dot-separated, stable. Registered namespaces:

| Prefix | Use |
| --- | --- |
| `common.*` | Shared atoms — `common.actions.save`, `common.error.forbidden`, `common.dialog.close` |
| `admin.nav.*` | Admin navigation labels |
| `admin.{feature}.*` | Admin screens — `admin.submissions.title`, `admin.contactForms.empty` |
| `embed.*` | Public embed widget chrome — `embed.submit`, `embed.success`, `embed.consent`, `embed.error.required` |

Keys are **stable identifiers** (like `operationId`): never rename a shipped key; add a new
one and remove the old in the same PR if truly retired. Register namespaces in
`terminology.md`.

---

## 4. Smooth switching mechanics

```text
I18nProvider (app root)
  detect: localStorage['nene-locale'] → navigator.language → resolveLocale → DEFAULT_LOCALE
  state: locale
  setLocale(next): persist 'nene-locale' → set <html lang> → setState  (instant re-render)
  provide: { t, locale, setLocale }
```

- Catalogs are **bundled** (imported, not fetched), so switching is a synchronous state
  change — **no reload, no flash, no network**.
- `setLocale` persists to `localStorage['nene-locale']` and updates
  `document.documentElement.lang` for accessibility/SEO.
- **Server data that contains operator-authored localized fields** is re-derived for the
  active locale: TanStack Query keys include the `locale` so a switch refetches/derives the
  right `ja`/`en` field values (§5). UI chrome needs no refetch.
- A locale selector lives in `shared/ui`; it calls `setLocale` — it never reaches into
  catalogs directly.

---

## 5. Catalog vs operator-authored data (hard boundary)

| Kind | Where it lives | Localized how |
| --- | --- | --- |
| **UI chrome** (this doc) | `shared/i18n/messages/{ja,en}.ts` | `t(key)` from the catalog |
| **Operator-authored content** — form field `label`, `select` `options`, `consent_label`, notification templates | **Data**, per-locale objects keyed `ja`/`en` (domain-model, charter §3) | selected by active/form locale, not the catalog |

Never put operator content in a catalog, and never put product UI strings in the database.
This keeps the catalog the complete, reviewable record of every product string.

---

## 6. Embed widget locale (Contact-specific)

The public widget runs on third-party sites, so its locale is **not** the visitor's
browser preference — it is governed by the **form's** configuration (ADR 0011):

```text
resolve embed locale:
  data-lang (if ∈ form.locales) → else form.default_locale
```

- The widget ships the same catalog mechanism but resolves locale from `data-lang ∩
  form.locales`, falling back to `default_locale`. Chrome strings come from `embed.*` keys.
- If a form offers both `ja` and `en`, the widget may render a locale toggle that swaps the
  catalog instantly (same in-bundle switch as admin).
- Operator-authored field labels/options/consent for the widget come from the form schema's
  per-locale data (§5), not the `embed.*` catalog.

---

## 7. Server errors → localized UI text

- API Problem Details `title`/`detail` are **English only** (ADR 0008) — they are a
  developer contract, not end-user copy.
- The SPA maps the Problem `type` slug / validation `code` to a **catalog key** so users see
  `ja`/`en` text: e.g. `forbidden` → `common.error.forbidden`,
  `validation-failed` field `code` `invalid_email` → `common.error.invalidEmail`.
- This keeps the API English and stable while every on-screen string stays localized.

---

## 8. Completeness & testing

- `locales.test.ts` asserts catalog **parity**: the set of keys in `en.ts` is a subset of
  `ja.ts`, and no key is empty; CI fails on a missing/typo'd key.
- ESLint forbids raw JSX text nodes / string literals in user-facing positions outside the
  catalog layer (allowlist for non-display literals).
- Every new screen ships its keys in **both** `ja.ts` and `en.ts` in the same PR.

---

## 9. Identifiers

Registered in [`../explanation/terminology.md`](../explanation/terminology.md): module files,
`SupportedLocale` (`ja`/`en`), `DEFAULT_LOCALE`, `useTranslation`, `t`, `MessageKey`, the
key namespaces (`common.*`, `admin.*`, `embed.*`), and the `nene-locale` storage key.

## Related

- ADR 0011 (bilingual ja/en scope), ADR 0008 (English API/docs)
- NeNe Records `frontend/src/shared/i18n/` (reference implementation)
- [`frontend-standards.md`](./frontend-standards.md) §H, self-review [`../review/frontend.md`](../review/frontend.md)

Last updated: 2026-06-04
