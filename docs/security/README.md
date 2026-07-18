# Security — NeNe Contact

A map of the security **design**: the trust boundaries, the controls that guard
each one, where each control is enforced in code, and the test that proves it.
This is a design index, not a penetration-test record — unlike a live-fire
assessment (cf. `nene-vault/docs/security`), nothing here targets a production
host. When contact runs an authorized self-assessment, it lands here as a dated
report alongside this index.

Binding compliance context lives in
[`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md)
(APPI, Japan-law only; ADR 0012) and
[`../explanation/privacy-and-spam-compliance.md`](../explanation/privacy-and-spam-compliance.md).
Public doc: no infrastructure specifics (daily-report convention §8).

## Trust boundaries

Three surfaces, decreasing exposure:

1. **Public / anonymous** — the embed widget and the public endpoints it calls
   (`GET /{public_form_key}/schema`, `POST /{public_form_key}/submit`,
   `GET /form/{public_form_key}`). No credential; the tenant is resolved from the
   form key. This is the untrusted surface.
2. **Authenticated admin** — the console SPA (`frontend/`) and the admin API
   (`/admin/*`). JWT bearer + RBAC, every query org-scoped. Operators only.
3. **Machine / server-to-server** — service tokens (embed 案1: records → contact
   ingest). Stateless HMAC JWT with a `jti` registry; the token value is never
   stored and is revocable.

## Controls index

| Concern | Design | Enforced in | Proven by |
|---|---|---|---|
| **Tenant isolation** — every tenant-scoped query filters by resolved `organization_id`; cross-tenant is superadmin-only | ADR 0006, ADR 0014, [`../development/multi-tenancy.md`](../development/multi-tenancy.md) | `RequestScopedHolder<int>` org holder; repositories filter on it | `tests/Auth/*` (org-scoped CRUD), `tests/Submission/PdoPublicFormReaderTest.php` |
| **AuthN** — JWT login; the signing secret is **fail-closed in production** (a dev-secret opt-in is refused when `APP_ENV=production`) | ADR 0014 | `src/Auth/AdminApiAuthMiddleware.php`; NENE2 JWT runtime | `tests/Auth/LoginUseCaseTest.php` |
| **AuthZ (RBAC)** — Role → Capability; admin/editor/superadmin | ADR 0006 | `src/Auth/CapabilityMiddleware.php`, `Role`, `CapabilityResolver` | `tests/Auth/RoleTest.php`, `tests/Auth/CapabilityResolverTest.php` |
| **Admin password reset** — out-of-band recovery, audited with **actor=null** (told apart from a self-service change), no hash in snapshots | #411, [`../explanation/terminology.md`](../explanation/terminology.md) (`user.password_changed` recipe) | `src/Auth/AdminResetPasswordUseCase.php`, `tools/reset-password.php` (STDIN, never argv) | `tests/Auth/AdminResetPasswordUseCaseTest.php` |
| **Public embed API** — origin allowlist (CORS), honeypot, per-IP/per-form rate limit, snippet SRI | ADR 0010, [`../adr/0010-embed-public-api-security.md`](../adr/0010-embed-public-api-security.md) | `src/Http/PublicCorsMiddleware`, `src/RateLimit/PublicSubmitThrottleMiddleware` | `tests/Http/PublicCorsMiddlewareTest.php`, `tests/RateLimit/PublicSubmitThrottleMiddlewareTest.php` |
| **Reverse-proxy `Authorization` stripping** — mirror the bearer onto `X-Authorization` (NENE2-standard opt-in) | #375 / #376 | `AuthorizationHeaderFallback` (NENE2 opt-in); front `shared/api/client.ts` mirrors both | `tests/Http/AuthorizationHeaderFallbackE2ETest.php`, `frontend/src/shared/api/client.test.ts` |
| **Secrets at rest** — channel `config_json` encrypted (libsodium), fail-closed, no raw secret ever exposed | charter §6 | `src/Notification/SodiumConfigCipher` | `tests/Notification/SodiumConfigCipherTest.php` |
| **Machine credentials** — `service_tokens` (`jti` UNIQUE, value-not-stored, `revoked_at` soft, org-scoped); unified `/api` auth dispatcher | 案1 (#387/#389) | `src/ServiceToken/*`, `src/Auth/AdminApiAuthMiddleware.php` | `tests/ServiceToken/PdoServiceTokenAuthorizerTest.php` |
| **PII handling** — physical row deletion forbidden (erase-in-place); inbox masked by default, server-side search; staged reception-metadata disclosure | ADR 0016, ADR 0017, ADR 0018 | `check-no-physical-delete` gate; `src/Submission/*` | `tests/Submission/*`, `composer no-physical-delete` |
| **Audit trail** — every mutation records actor + sanitized before/after; PII view/export audited; append-only | ADR 0013, [`../development/audit-logging.md`](../development/audit-logging.md) | `AuditRecorder` in each mutating use case | `composer usecases-audited` merge gate |

## Front-end attack surface

The admin SPA and the embed widget are different surfaces and are hardened —
and tested — differently.

- **Embed widget** (`public_html/embed.js`, stable alias `public_html/embed/embed.js`,
  self-hosted fonts in `public_html/embed-fonts/`) is the **special** surface: it
  runs on **third-party origins**, inside a **shadow DOM** with injected styles
  and self-hosted webfonts. Its XSS/CSP posture is verified by **real-render**
  (Playwright, `frontend/e2e/smoke.spec.ts`) rather than DOM unit tests — the
  contract is "does it render and submit safely under a scoped CSP," which only a
  real browser observes. Notes: a page-scoped CSP relaxes style/font only (script
  stays `'self'` + SRI); cross-origin webfonts require `Access-Control-Allow-Origin`
  on the font response (not a CSP concern); the widget is pinned via a stable
  alias so a redeploy can't 404 a hash-pinned reference.
- **Admin SPA** (`frontend/`): the JWT lives in memory (not `localStorage`); the
  transport mirrors it onto both `Authorization` and `X-Authorization`
  (`shared/api/client.ts`); login is exercised in `features/login/ui/Login.test.tsx`.
  All user-facing strings go through the i18n catalog (ADR 0011), so there is no
  ad-hoc string interpolation into the DOM.

## What this is *not*

- Not a live-fire assessment and not a third-party pentest. No production host is
  ever targeted.
- Not exhaustive threat modelling — it indexes the controls that exist today. Gaps
  (e.g. no dedicated front-end XSS/CSP unit tests beyond the Playwright smoke, no
  automated i18n-hardcoded-string lint yet — planned for the shared-ESLint wave)
  are named here rather than hidden.
