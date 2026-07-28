# Frontend Self-Review (binding)

Use for admin SPA and embed-widget changes, frontend tooling, API client, and built-asset
integration. Source of truth:
[`../development/frontend-standards.md`](../development/frontend-standards.md). Mark `N/A`
only when genuinely not applicable; do not delete items to pass.

## Admin SPA

- [ ] Layering respected: `app → pages → features → entities → shared`; no upward imports; no cross-feature imports.
- [ ] Placement matrix honored: DTOs/models/enums/mappers/query-keys/queries/mutations in `entities/{r}/`; `fetch` only in `shared/api/client.ts`.
- [ ] Slices expose `index.ts` only; no deep imports of slice internals.
- [ ] Data flow: mappers run in entity hooks; components receive **model** types + callbacks (never DTOs/`Response`); stable query keys from `query-keys.ts`.
- [ ] Writes go through `mutations.ts` hooks with explicit invalidation; destructive actions confirm.
- [ ] Four UI states handled (loading / empty / error / success); errors from Problem Details → `AppError`.
- [ ] TypeScript strict; no `any`; branded IDs; no default exports.
- [ ] No raw color/spacing/type literals outside `shared/ui/theme/`.
- [ ] Locales `ja`/`en` only (ADR 0011). **No hardcoded user-facing string** — every label/button/heading/placeholder/empty/error/`aria-label` via `t(key)` (`i18n-message-catalog.md`).
- [ ] New keys added to **both** `messages/ja.ts` and `en.ts` in this PR; no shipped key renamed.
      (`en ⊆ ja` needs no test — `en` is `Partial<MessageCatalog>`, so `tsc` rejects a stray key.
      Nothing enforces that `en` is *complete*: missing keys fall back to ja by design, #310.)
- [ ] Locale switch is in-bundle/instant (no fetch/reload); `setLocale` persists `nene-locale` + sets `<html lang>`. Embed locale from `data-lang ∩ form.locales → default_locale`.
- [ ] Server Problem Details (English) mapped to a catalog key for display.
- [ ] Auth token in-memory (other storage needs ADR); fail-closed (401→login, 403→forbidden); RBAC gating is UX only.
- [ ] API field names not renamed in transit; snake_case mapped in `mapper.ts`.
- [ ] Entity mapper/query-key tests + ≥1 feature-hook test (MSW); regression test for bug fixes.

## Embed widget (`embed.js`)

- [ ] Renders in shadow DOM / isolated `nene-contact-` prefix; no style leakage to/from host.
- [ ] Config is declarative JSON from the public schema endpoint; **no operator JS**, no `eval`, no `dangerouslySetInnerHTML` of API/operator content (ADR 0010, charter §8).
- [ ] CSP-friendly; no inline script from API responses.
- [ ] Holds **no** admin JWT; calls only `/public/forms/{public_form_key}/…` unauthenticated.
- [ ] Locale resolves to `ja`/`en` via `data-lang` ∩ form `locales` else `default_locale`.
- [ ] Honeypot trip → generic success/`204`; safe error messages; no server internals echoed.
- [ ] Built separately to `public_html/embed.js` (hashed); SI documented; source outside `public_html/`.
- [ ] Submit-path tests (schema render, honeypot, validation error display).

## Tooling

- [ ] Framework/core not coupled to frontend build output; `node_modules/` & generated assets not committed.
- [ ] `npm run check --prefix frontend` run; the audit gate (`npm run audit`) passes — any allowlisted
      advisory carries a measured reason and an expiry (`../development/dependency-audit.md`).
- [ ] An `overrides` entry that crosses a major version has a probe in
      `scripts/check-overrides.mjs`; a green build is not evidence that an override is safe.

---

## Release review — 2026-07-29 (M7 gate)

Difference-based pass against `main` at **`8b4729e`** (hub ruling: frontend is a diff append, not
a full re-audit). Baseline: the 2026-06-04 pass, which covered the SPA and embed as they stood
before the Pro Console reskin shipped.

**Verdict: PASS.** What changed since the baseline, and where it lands against the checklist:

| Change since 2026-06-04 | Checklist impact |
| --- | --- |
| Pro Console reskin of every screen (#172–#191), responsive shell, app window (#206), login to the DirAC spec (#272) | No new rule; theme tokens stayed inside `shared/ui/theme/`. |
| Inbox rebuilt two-pane (#194), canonical `Pagination` (#458–#461), real 7-day trend (#464) | Four UI states preserved; `Pagination` replaced the pager that hid at ≤1 page. |
| Builder full-screen 4-tab (#294), Appearance Studio v2 (#280–#292) | Largest feature area; no operator JS introduced — appearance is declarative tokens. |
| Guided tour + `/help` + onboarding banner (#485–#499) | Self-contained; no new dependency. |
| Tags UI (#482/#483), audit CSV export (#523), truncation notice (#532) | New strings; both catalogs updated in-PR. |
| Service-token admin screen (#393) | Plaintext token shown once, never persisted client-side. |

### Verified in this pass (measured, not assumed)

| Item | Verdict | Evidence |
| --- | --- | --- |
| Auth token in memory | ✅ | `shared/api/client.ts:18` — in-memory store, with the reason for not adopting the fleet `sessionStorage` default recorded in-file (would need an ADR). No `localStorage`/`sessionStorage` use. |
| i18n parity | ✅ | Enforced by **types, not a test**: `messages/en.ts:4` declares `Partial<MessageCatalog>`, so a key cannot exist in `en` that is absent from `ja` — `tsc` rejects it. `locales.test.ts` fixes the supported set to exactly `ja`/`en`; `i18n.test.tsx:48-51` pins the ja fallback and states that `en` is **intentionally incomplete** (#310). Audit-action labels are separately covered exhaustively (`labels.test.ts`, 35 actions, #536). |
| Embed: shadow DOM, no eval | ✅ | `public_html/embed.js` — one `attachShadow`, **zero** `eval(`. |
| Embed holds no admin JWT | ✅ | Zero occurrences of `Authorization` in `embed.js`; it calls only `/public/*`. |
| Embed SRI | ✅ | `public_html/embed/manifest.json` carries `sha384-6pU29afi…`; the same digest was independently recomputed against production at the 2026-07-29 deploy. |
| Audit gate | ✅ | `npm run audit` = `check:overrides` + `audit-ci`; two allowlisted advisories, each with a measured reason and a 2026-08-31 expiry. |

### Gap closed during this review round

The label dictionaries had drifted behind the action registry, so `submission.tagged` and
`audit_event.exported` reached operators as raw identifiers on production. Fixed in #536, and the
coverage is now a test rather than a habit — three separate features had shipped that way.

### Not re-verified in this pass (declared, not assumed)

- Accessibility contrast across the reskinned screens (#312 is open and unresolved).
- The English catalog's **completeness**. The type system stops `en` gaining a key `ja` lacks, but
  it cannot require `en` to be full — and it is deliberately partial, falling back to ja (#310).
  Neither the size of the gap nor the quality of the existing English wording was reviewed.
- Cross-browser rendering of the embed beyond Chromium.

Last updated: 2026-07-29 (release review for M7; previous pass 2026-06-04)
