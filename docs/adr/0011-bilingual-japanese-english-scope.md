# ADR 0011: Bilingual (Japanese + English) Product Scope

## Status

accepted

## Context

NeNe Contact serves Japan SMB operators and, increasingly, **foreign operators running
businesses in Japan** who need to reach both Japanese and international visitors. That
demand looks like a case for general multilingual support.

It is not. The NeNe suite is built around **Japanese business and compliance practice** —
個人情報保護法 consent copy, Japanese name ordering, postal/phone/address formats,
Chatwork as a first-class notification channel, and Japanese-style notification etiquette
in templates. Forms, notifications, and privacy copy are tuned to that model; that tuning
is the product's value.

Generalizing to arbitrary locales (RTL, broad CJK variants, full locale negotiation,
per-string translation tables) would force locale-agnostic validation, consent, and
notification surfaces that **diverge from the Japan-tuned needs without serving the target
market**. The cost is real (validation matrix, template fan-out, QA) and the payoff is not.

## Decision

NeNe Contact supports **exactly two product locales: `ja` and `en`**. This is binding.

1. **Locale set is closed** — `ja`, `en`. No additional locale ships without a superseding ADR.
2. **Per-form locales** — `contact_form` carries `locales[]` (a non-empty subset of `{ja, en}`)
   and a `default_locale` (must be a member of `locales`).
3. **Embed selection** — `data-lang` must be one of the form's `locales`; an absent,
   malformed, or unsupported value falls back to the form's `default_locale`.
4. **Localized strings are keyed by `ja` / `en` only** — field labels, `select` options,
   `consent_label`, notification templates, and validation messages.
5. **Admin UI offers `ja` + `en`.** This supersedes the "separate ADR when UI starts"
   promise in ADR 0008.
6. **No general i18n framework** — no runtime translation service, no RTL handling, no
   locale negotiation beyond `ja`/`en`, no per-tenant custom locale codes.
7. **Repository engineering docs remain English-only** (ADR 0008). This ADR governs the
   **product**, not the repo's documentation language.

## Consequences

**Benefits**

- Validation, consent, and notification surfaces stay small and Japan-accurate.
- Foreign operators in Japan get English UI/forms alongside Japanese without scope creep.
- A finite locale matrix keeps QA and template work bounded.

**Costs**

- Operators needing a third locale are out of scope until a superseding ADR.
- Every localized string must carry both `ja` and `en` (with `en` as the safe fallback).

**Follow-up**

- Register locale identifiers in `docs/explanation/terminology.md`.
- Define `default_locale` / `locales[]` on `contact_form` in the domain model.

## Related

- [`../explanation/scope-contract.md`](../explanation/scope-contract.md)
- [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md)
- [`../explanation/domain-model.md`](../explanation/domain-model.md)
- [`../explanation/privacy-and-spam-compliance.md`](../explanation/privacy-and-spam-compliance.md)
- ADR 0008 (repository documentation language — distinct concern)
