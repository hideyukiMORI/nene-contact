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
- [ ] Locales `ja`/`en` only (ADR 0011); no hardcoded user-facing strings.
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
- [ ] `npm run check --prefix frontend` run; `npm audit` clean of high/critical.

Last updated: 2026-06-04
