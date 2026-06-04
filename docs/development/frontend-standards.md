# Frontend Standards (binding)

NeNe Contact ships **two** frontends, with different trust models:

1. **Admin SPA** — React + TypeScript client of the JSON API (operator inbox, form
   builder, settings). Runs in the operator's authenticated context.
2. **Embed widget** (`embed.js`) — the public script operators paste on **third-party
   sites**. Runs in a **hostile, untrusted** page; security and isolation dominate.

Neither frontend is the source of truth for schema, validation, or persistence — the PHP
API and [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md)
own those. The UI reflects API types and errors; it never replaces validation.

**Baseline & inheritance:** NENE2 frontend integration (React + TypeScript + Vite, npm,
committed lockfile, source outside `public_html/`, build output to `public_html/`). See
[`../inheritance-from-nene2.md`](../inheritance-from-nene2.md) and NENE2
[frontend-integration](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/frontend-integration.md).
Where this document and NENE2 differ, **this document wins for NeNe Contact**.

> **Enforcement:** violations of placement, dependency direction, data flow, security,
> naming, or testing rules **block merge to `main`**. No temporary exception without an ADR.

**Status:** Phase 2 — `frontend/` scaffold landed (React + TS + Vite, npm + lockfile, ESLint
flat + Prettier + Vitest/MSW, openapi-typescript). Admin SPA screens (login, form builder,
inbox list/detail, channels, users) and the `embed.js` widget are landing per this binding
policy; remaining screens follow the same layering.

---

## A. Product-specific rules (read first)

| Topic | Rule |
| --- | --- |
| **Locales** | **`ja` + `en` only** (ADR 0011). Not multilingual. No other catalogs. |
| **JSON shape** | API JSON is **snake_case**; the client maps to typed models **without renaming fields** in transport. DTO→model mapping lives in `entities/{r}/mapper.ts`. |
| **No money** | Contact has no money/tax/cents/PDF surface (scope DON'T). Do not import billing concepts. |
| **Auth token (admin)** | API issues a **Bearer JWT** at login. Default storage is **in-memory** (fail-closed; re-login on reload). `localStorage`/`sessionStorage` or a cookie session needs an **ADR** (XSS exfiltration risk). |
| **Embed has no admin auth** | The widget **never** holds an admin JWT. It uses only the public `public_form_key` and unauthenticated public endpoints (ADR 0010). |
| **RBAC in UI** | Hide/disable admin actions by API-exposed capability; UI gating is **UX only** — the API enforces authorization. |
| **PII** | Never log submission contents, email, IP, or tokens in the browser. |

---

## B. Embed widget (`embed.js`) — public, untrusted page

The widget is the riskiest surface in the product. Binding rules:

| Topic | Rule |
| --- | --- |
| **Isolation** | Render inside a **shadow DOM** (or, fallback, an isolated `nene-contact-` class prefix). The widget must not leak styles into, or inherit styles from, the host page. |
| **No operator JavaScript** | Form config is **declarative JSON only** loaded from `GET /public/forms/{public_form_key}/schema`. The widget **never** `eval`s, never injects operator-supplied scripts, never `dangerouslySetInnerHTML` of API content (ADR 0010, charter §8). |
| **CSP-friendly** | No `eval`, no inline script generated from API responses. Works under a strict host-site CSP. |
| **Self-contained** | Ship as a static asset with a **long-cache hashed filename** in production; document Subresource Integrity (ADR 0010). No runtime dependency on the admin SPA bundle. |
| **Trigger modes** | `floating` (default), `button`, `inline` — per [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md). MVP is same-origin modal; iframe mode is out of scope. |
| **Locale** | Resolve to `ja`/`en` from `data-lang` ∩ form `locales`, else `default_locale` (ADR 0011). |
| **Submit path** | `POST /public/forms/{public_form_key}/submissions`, JSON matching the schema; honor honeypot, body cap, allowed-origin server checks (server-enforced; widget cooperates). |
| **Failure UX** | Generic success/`204` on honeypot trip (no bot-useful signal); safe error messages — never echo server internals. |
| **Source layout** | Widget source under `frontend/embed/`; build output to `public_html/embed.js` (hashed). Kept **separate** from the admin SPA build. |

The widget shares **only** `shared/` transport/util/theme primitives that are safe for an
untrusted context; it must not import admin `features/` or `entities/` that assume an
authenticated session.

---

## C. Admin SPA — layered architecture

Strict layered architecture (adjacent to Feature-Sliced Design):
`app → pages → features → entities → shared`.

### Layer responsibilities

| Layer | Owns | Must not own |
| --- | --- | --- |
| **`shared/`** | Transport, design tokens, pure utils, env, i18n | Routes, features, resource models, workflows |
| **`entities/`** | One API resource: DTO mapping, query keys, TanStack hooks | JSX, cross-resource orchestration |
| **`features/`** | User workflows composing entities + UI | Raw HTTP, DTO types, direct query-key strings |
| **`pages/`** | Route wiring, lazy loading, layout slots | Business rules, API calls |
| **`app/`** | Providers, router, error boundary, auth gate | Feature-specific screens |

### Dependency direction (hard rule)

```
app → pages → features → entities → shared/api → API
                      ↘ shared/ui     entities → shared/lib
```

**No arrow points upward.** Never import `features/foo` from `features/bar`; promote shared
logic to `entities/` (resource-level) or `shared/` (generic, ADR). Every
`entities/{r}/` and `features/{f}/` exposes **`index.ts` only**; internals are private.
ESLint `import/no-restricted-paths` enforces the matrix; placement drift is rejected.

### Stack

| Layer | Choice |
| --- | --- |
| UI | **React** (latest stable) — function components + hooks only, no class components |
| Language | **TypeScript** strict (`any` forbidden; use `unknown` + narrow) |
| Bundler | **Vite** → console SPA build to `public_html/console/` (served at `/console/`) |
| Package manager | **npm**; commit `frontend/package-lock.json`; CI `npm ci` |
| Node | active **LTS (≥22)**; `engines` + `packageManager` in `package.json` |
| Routing | **React Router** (URL is shareable state) |
| Server state | **TanStack Query v5** (no Redux/Zustand without ADR) |
| Forms | **React Hook Form + Zod** (client UX validation only — API authoritative) |
| Lint/format | **ESLint** flat (typescript strict-type-checked, react-hooks, react-refresh, jsx-a11y, import/no-restricted-paths, no Tailwind arbitrary values) `--max-warnings 0` + **Prettier** |
| Test | **Vitest + Testing Library + MSW** (unit); **Playwright** (browser e2e, `npm run e2e`) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) with semantic `@theme` tokens in `shared/ui/theme/index.css`; **no raw color/spacing/type literals** and **no arbitrary `[...]` values** in components |
| Fonts | **@fontsource** self-hosted (`fonts.ts`, admin only): Inter + Noto Sans JP + JetBrains Mono (ja/en, ADR 0011) |
| UI workbench | **Storybook** (`@storybook/react-vite` + addon-docs + addon-a11y); `*.stories.tsx` colocated in `shared/ui` |
| Dead code | **knip** (`knip.json`) in `check` |
| Hooks | **husky** + **lint-staged** pre-commit |
| API types | **openapi-typescript** → `shared/api/schema.gen.ts` (generated; not edited) |

Conventions and major versions track the sibling frontends (reference: **nene-records**):
`tsconfig.json` (solution) + `tsconfig.app.json` + `tsconfig.node.json`; a separate
`vitest.config.ts`; `.npmrc` `legacy-peer-deps=true`. `npm run check` =
`type-check` (`tsc -b`) → `lint` → `format` → `test` → `knip` → `build-storybook`. Alternate
stack requires an ADR.

**Admin form builder (ADR 0015):** a **custom UI** (field palette + ordered field list +
config panel + live preview), **not** a node-graph/canvas library — `form_field` is an
ordered list, and graph/scenario editing belongs to NeNe Concierge (ADR 0009). **dnd-kit**
is the only approved-by-ADR addition, used **solely** for accessible drag-to-reorder; the
preview reuses the embed schema renderer. See
[ADR 0015](../adr/0015-form-builder-custom-ui-dnd-kit.md).

---

## D. Repository layout

```text
frontend/
  package.json  package-lock.json  .npmrc  vite.config.ts  vitest.config.ts
  eslint.config.js  tsconfig*.json  knip.json  playwright.config.ts  .storybook/
  embed/                    # public embed widget (isolated, untrusted-page safe)
    src/  index.ts
  e2e/                      # Playwright browser specs
  src/                      # admin SPA
    main.tsx  fonts.ts
    app/        providers.tsx router.tsx root-error-boundary.tsx auth-gate.tsx
    pages/      login/  submissions/  contact-forms/  settings/ …
    features/   list-submissions/  edit-contact-form/ …
      {feature}/ index.ts  hooks/use-{feature}.ts  ui/{Feature}.tsx  ui/{Feature}.test.tsx
    entities/   submission/  contact-form/  notification-channel/  audit-event/  auth/
      {resource}/ index.ts ids.ts enum.ts api-types.ts model.ts mapper.ts
                  query-keys.ts queries.ts mutations.ts mapper.test.ts
    shared/
      api/      client.ts   errors.ts   schema.gen.ts
      config/   env.ts
      i18n/     locales.ts messages/ja.ts messages/en.ts   # ja + en only (ADR 0011)
      lib/
      ui/       theme/  primitives/  components/  index.ts
  tests/  setup/  msw/  factories/  render/
```

Console SPA build → `public_html/console/` (served at `/console/`; the admin API owns
`/admin/*`, so the SPA uses a separate prefix to avoid shadowing it — #114). Embed build →
`public_html/embed.js`. Source and `node_modules/` stay outside `public_html/`.

### Placement matrix (zero tolerance)

| Artifact | Required path |
| --- | --- |
| OpenAPI-generated types | `shared/api/schema.gen.ts` |
| API DTOs (aliased) | `entities/{resource}/api-types.ts` |
| Branded IDs | `entities/{resource}/ids.ts` |
| Enums | `entities/{resource}/enum.ts` |
| UI models | `entities/{resource}/model.ts` |
| Mappers (pure) | `entities/{resource}/mapper.ts` |
| Query keys | `entities/{resource}/query-keys.ts` |
| `useQuery` / `useMutation` | `entities/{resource}/queries.ts` / `mutations.ts` |
| HTTP transport (`fetch`) | `shared/api/client.ts` **only** |
| Problem Details mapping | `shared/api/errors.ts` |
| Feature hooks | `features/{feature}/hooks/` |
| Design token CSS | `shared/ui/theme/themes/*.css` only |

**Forbidden placements (auto-reject):** DTOs in `features/`/`pages/`/`.tsx`; models/enums/
mappers outside `entities/`; TanStack logic outside the three entity files; `fetch` outside
`shared/api/client.ts`; deep entity imports from features (must go through `index.ts`);
root `src/types/` or `src/utils/` dumps.

---

## E. Data flow

### Read (server → UI)

```text
API JSON → shared/api/client.ts → entities/{r}/api-types.ts (snake_case wire)
  → entities/{r}/mapper.ts (→ model) → entities/{r}/queries.ts (TanStack cache)
  → features/{f}/hooks → features/{f}/ui (render)
```

Mappers run **inside entity hooks**, not in components. Components receive **model** types
and plain callbacks — never raw `Response`, never DTOs. Lists use **stable query keys**
from `query-keys.ts`.

### Write (UI → server)

```text
UI event → features/{f}/hooks → entities/{r}/mutations.ts → shared/api/client.ts → API
  → onSuccess: invalidate query-keys (explicit, colocated)
  → onError: Problem Details → AppError → safe UI feedback
```

Mutations live in `mutations.ts`; features call exported hooks, not inline `useMutation`.
Destructive actions (delete submission, purge) require an explicit confirm dialog.

### State placement

| State | Tool / location |
| --- | --- |
| Remote data | TanStack Query (`entities/*/queries.ts`) — not duplicated in a global store |
| Filters / sort / page | `searchParams` (serializable) |
| Modal / tab | local `useState` in feature |
| Auth session | Context in `app/` only (in-memory token + user) |

### Four UI states (every data screen)

**Loading** · **Empty** (intentional copy) · **Error** (safe message + retry; `type`
logged dev-only) · **Success**.

---

## F. Connection & calling conventions

- Single `apiClient` in `shared/api/client.ts` with typed `get/post/patch/delete`;
  attaches the in-memory bearer token (admin) and **fails closed**. Transport only — **no
  domain logic**. Parses `application/problem+json` into a typed `AppError`.
- Vite dev proxies `/api/*` (and `/public/*`, `/admin/*`) to the local PHP app;
  `VITE_NENE_CONTACT_API_BASE_URL` overrides the base URL when needed. Only public
  `VITE_*` env is exposed to the browser; validated once in `shared/config/env.ts` (Zod).
- The embed widget calls **only** `/public/forms/{public_form_key}/…` with **no**
  credentials.

---

## G. Security (browser is hostile)

| Topic | Rule |
| --- | --- |
| Secrets | Never in repo; only public `VITE_*` in frontend env |
| Admin token | In-memory by default; other storage needs an ADR |
| Embed | No admin token ever; declarative JSON config only; shadow-DOM isolation |
| XSS | No `dangerouslySetInnerHTML` of API/operator content without DOMPurify + Issue |
| Links | `rel="noopener noreferrer"` on `target="_blank"` |
| Open redirects | Validate post-login redirect against an allowlist |
| Dependencies | `npm audit` in CI; block high/critical on `main`; lockfile required |
| PII | Never log submission content, email, IP, tokens |
| RBAC | UI gating is UX only — API enforces |
| Fail closed | 401 → login; 403 → forbidden; never silent unauthenticated mutations |

---

## H. i18n (ja + en only — ADR 0011)

Full spec: **[`i18n-message-catalog.md`](./i18n-message-catalog.md)** (binding).

- `shared/i18n` with `SupportedLocale = 'ja' | 'en'`; **`ja` authoritative** (defines the
  `MessageCatalog`), `en` is `Partial` and falls back to `ja`.
- **Every** user-facing string comes from a per-locale catalog via `t('admin.submissions.title')`
  — no hardcoded strings. Switching locale is instant (catalogs are in-bundle; `setLocale`
  re-renders, persists `nene-locale`, sets `<html lang>` — no reload).
- The embed widget resolves locale from `data-lang ∩ form.locales → default_locale` (not the
  browser); chrome strings use `embed.*` keys.
- Do not add a third locale without superseding ADR 0011.

---

## I. Testing

| Level | Tool | Required when |
| --- | --- | --- |
| Unit | Vitest | `mapper.ts`, `query-keys.ts`, pure `lib/` — every entity |
| Integration | Vitest + Testing Library + MSW | every feature PR |
| Contract | MSW vs OpenAPI | endpoint touched |

Query by role/label/accessible name; `userEvent.setup()`; MSW shapes match OpenAPI; mock
only the API boundary. Every new feature ships ≥1 feature-hook test; bug fixes ship a
regression test. The embed widget ships submit-path tests (schema render, honeypot,
validation error display).

---

## J. Commands

```bash
npm ci --prefix frontend
npm run dev --prefix frontend          # Vite dev; API proxied to PHP app
npm run codegen --prefix frontend      # regenerate shared/api/schema.gen.ts from OpenAPI
npm run check --prefix frontend        # type-check + lint + format + test + knip + build-storybook
npm run storybook --prefix frontend    # Storybook dev workbench (port 6006)
npm run e2e --prefix frontend          # Playwright (run `npx playwright install chromium` once)
npm run build --prefix frontend        # console SPA → public_html/console/
```

CI on frontend changes: `npm ci` → `npm run check` → `npm audit --audit-level=high`.

---

## Non-goals

- Duplicating API validation as the source of truth in the browser.
- Locales beyond `ja`/`en` (ADR 0011).
- Admin JWT or DB/MCP access from the embed widget or any browser code.
- Operator-supplied JavaScript or arbitrary HTML in the widget (ADR 0010, charter §8).
- Money/tax/PDF UI (NeNe Invoice territory).
- Alternate UI stack without an ADR.

## Related

- Self-review: [`../review/frontend.md`](../review/frontend.md)
- Embed contract: [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md)
- Naming: [`naming-conventions.md`](./naming-conventions.md)
- Security: ADR 0010; Compliance: [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md)
- Locales: ADR 0011

Last updated: 2026-06-04
