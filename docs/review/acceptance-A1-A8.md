# Acceptance audit — Definition of Done (A1–A8)

Formal verification of the **Definition of Done & Professional Acceptance Standard (A1–A8)**
in [`../explanation/scope-contract.md`](../explanation/scope-contract.md) against the codebase
on `main`. Each criterion lists the binding rule, where it is **enforced** (file / test / CI
gate / ADR), and the verdict. This is the M7 GOAL gate.

**Overall verdict (2026-06-04): PASS** — all eight criteria are enforced in code, with CI gates
and tests. Open items are UI/ops polish (M7 follow-ups), not acceptance gaps.

Gates run by `composer check`: `phpunit` (155 tests), `phpstan` (level 8), `php-cs-fixer`,
`tools/validate-openapi.php`, `tools/validate-mcp-tools.php`, `tools/check-no-physical-delete.php`.

---

## A1 — Zero deviations from the compliance charter

> A privacy/legal professional reviewing the system finds zero deviations from
> [`data-protection-compliance.md`](../explanation/data-protection-compliance.md).

**Enforced by**

- The charter is binding ([ADR 0012](../adr/0012-data-protection-compliance-binding.md)); every
  rule below (A2–A7) maps to a charter section and is enforced in code.
- Compliance self-review checklist: [`compliance.md`](./compliance.md).
- Consent evidence is immutable (charter §3): `SubmitPublicFormUseCase` snapshots `consent_label`
  + `consent_given_at`; submit is rejected without affirmative consent
  (`SubmitPublicFormHandler`, `IngestSubmissionHandler`).
- Retention + purge (charter §5): `PurgeSubmissionsUseCase` (dry-run default); PII erased in
  place (ADR 0016).
- Channel secrets encrypted at rest (charter §6): `SodiumConfigCipher` (libsodium, `v1:` envelope).

**Verdict: PASS** — no known deviation. Any future deviation must carry an ADR (A8).

## A2 — Every DON'T (X1–X14) is structurally impossible

> Every DON'T row is structurally impossible in Contact, not merely unimplemented.

| # | DON'T | Why it is structurally impossible |
| --- | --- | --- |
| X1 | Chat scenarios / step state | No scenario engine exists; a `Submission` is a flat record, not a state machine ([ADR 0009](../adr/0009-separate-from-nene-concierge.md)). Concierge may only **POST** a submission in (`POST /api/submissions`). |
| X2 | Quotes / invoices / PDFs | No billing code; Contact only hands off to Invoice over HTTP (`HttpInvoiceClient`). |
| X3 | Reconcile deposits / dunning | No payment/reconciliation code anywhere in `src/`. |
| X4 | Normalize bank CSV | No bank-CSV code; CSV is export-only of the inbox. |
| X5 | Archive vendor PDFs (電帳法) | No retention engine; attachments hand off to Vault over HTTP only. |
| X6 | Full CRM pipeline | No stages/forecast/kanban; Deal handoff creates an opportunity over HTTP only. |
| X7 | Replace Records as CMS | No entity authoring; Records is read-only over HTTP (`HttpRecordsClient`). |
| X8 | Share a database with a sibling | Siblings are reached only through `src/Upstream/*` PSR-18 HTTP clients; there is no sibling DB connection ([ADR 0002](../adr/0002-separate-from-sibling-products.md)). See A7. |
| X9 | Auto-send operator email replies | Notifications are operator-configured channels fired on submit, not auto-replies; AI/MCP writes require an explicit confirmation token (`ConfirmationToken`, charter §11). |
| X10 | Sell/resubmit visitor data | No third-party export path; handoffs are operator-triggered to the operator's own siblings. |
| X11 | Bypass allowed-origin / rate limit | Enforced in middleware for every public submit (see A3). |
| X12 | Store raw card / government ID numbers | `FieldType` is a **closed allowlist** enum + `FieldType::PROHIBITED`; prohibited types fail with a compliance-specific error (`CreateContactFormHandler`). |
| X13 | Embed arbitrary operator JavaScript | Form config is declarative JSON; the field-type allowlist has no script type; `embed.js` renders schema only (embed-widget-spec, shadow DOM). |
| X14 | Locales beyond `ja` / `en` | `SUPPORTED_LOCALES = {ja, en}`; locale lists are validated as a subset ([ADR 0011](../adr/0011-bilingual-japanese-english-scope.md)). |

**Enforced by**: `src/ContactForm/FieldType.php` (closed enum + `PROHIBITED`),
`src/ContactForm/CreateContactFormHandler.php` (prohibited/allowed/locale validation),
`src/Upstream/*` (HTTP-only siblings), `tests/ContactForm/FieldTypeTest.php`.

**Verdict: PASS**.

## A3 — Public endpoints meet ADR 0010

> Allowed-origins, rate limit, honeypot, body cap, no PII in URLs, CORS not `*`.

| Control | Enforcement |
| --- | --- |
| Allowed-origin | `SubmitPublicFormHandler::originAllowed()` (403 when Origin not in `allowed_origins`). |
| CORS not `*` | `PublicCorsMiddleware` **reflects** the request Origin only when allowed — never `*`. |
| Rate limit | `RateLimit/PublicSubmitThrottleMiddleware` (per IP + per form → 429); `tests/RateLimit/PublicSubmitThrottleMiddlewareTest.php`. |
| Honeypot | `SubmitPublicFormHandler` accepts silently (204) on a filled honeypot; stores nothing (ADR 0010). |
| Body cap | `RuntimeApplicationFactory(requestMaxBodyBytes: 64 * 1024)` in `RuntimeServiceProvider`. |
| No PII in URLs | Public routes key on `public_form_key` and numeric ids only (`SubmissionRouteRegistrar`); no email/PII path or query params. |

**Verdict: PASS** ([ADR 0010](../adr/0010-embed-public-api-security.md)).

## A4 — Prohibited fields cannot be configured; 要配慮個人情報 never a silent default

**Enforced by**: `FieldType` is a closed allowlist (`text/email/textarea/select/checkbox/file/
honeypot`) with **no** field type for 要配慮個人情報 — so it can never be a silent default.
`FieldType::PROHIBITED` additionally names My Number / raw card variants; `CreateContactFormHandler`
rejects them with `field_type … is prohibited (APPI compliance, charter §8)`. Covered by
`tests/ContactForm/FieldTypeTest.php`. (charter §8)

**Verdict: PASS**.

## A5 — Admin mutations and PII view/export audited; deletion leaves a trail

**Enforced by**: `AuditRecorder` + append-only `audit_events` ([ADR 0013](../adr/0013-audit-logging.md),
[`../development/audit-logging.md`](../development/audit-logging.md)). Actions present in `src/`:
`submission.created/updated/corrected/deleted/expired/purged/viewed/exported`,
`attachment.viewed/purged`, `user.created/updated`, `contact_form.created`,
`notification_channel.created`, `handoff.created/retried`. PII access is audited
(`attachment.viewed`, agent `submission.viewed`/`exported` with `via=agent_api`). **Deletion** is
soft-delete (`submission.deleted`) → retention `submission.expired` → PII erase-in-place
(`submission.purged`); the row and its audit linkage are **never** physically removed
([ADR 0016](../adr/0016-no-physical-deletion-pii-erase-in-place.md)). Snapshots are redacted
(field keys only, no raw PII/secrets).

**Verdict: PASS**.

## A6 — Locales are `ja` / `en` only; no general i18n

**Enforced by**: `CreateContactFormHandler::SUPPORTED_LOCALES = ['ja', 'en']` with subset
validation; admin/widget strings via `t(key)` from `shared/i18n/messages/{ja,en}.ts` (ADR 0011,
[`../development/i18n-message-catalog.md`](../development/i18n-message-catalog.md)); no ICU /
general i18n framework is present.

**Verdict: PASS** ([ADR 0011](../adr/0011-bilingual-japanese-english-scope.md)).

## A7 — Siblings over HTTP only; no shared database

**Enforced by**: every sibling boundary is a PSR-18 HTTP client in `src/Upstream/` —
`HttpDealClient`, `HttpVaultClient`, `HttpInvoiceClient`, `HttpRecordsClient` (bearer tokens,
idempotency keys, never logged). There is **no** database connection, DSN, or shared schema for
any sibling. The only PDO in the handoff path is `PdoSubmissionLinkRepository`, which writes
Contact's **own** `submission_links` table (the local pointer ids), not a sibling DB.

**Verdict: PASS** ([ADR 0002](../adr/0002-separate-from-sibling-products.md)).

## A8 — Binding deviations recorded in an ADR; no external sign-off gate

**Enforced by**: governance requires an ADR for any deviation from a binding rule, with
maintainer self-authority and **no** tax/accounting/legal sign-off gate because Contact handles
no money ([ADR 0012](../adr/0012-data-protection-compliance-binding.md)). The ADR log
`docs/adr/` is current (0001–0016), e.g. ADR 0016 records the no-physical-deletion policy whose
runtime enforcement is `tools/check-no-physical-delete.php` (a `composer check` gate) **plus** a
DB-privilege `REVOKE DELETE` (`docker/mysql/init/10-restrict-app-user.sh`).

**Verdict: PASS**.

---

## Open items (M7 follow-ups — not acceptance gaps)

- **Operator documentation**: TLS-required checklist, cross-border / non-Japan visitor
  responsibility (charter §9), privacy-notice surface guidance (operator is the data controller).
- **Production `embed.js` build**: hashed long-cache filename, CSP-friendly (no `eval`, no inline
  script from API responses).
- **Admin SPA polish**: handoff buttons, Records-options import, form edit/delete, org switch.

## Related

- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (A1–A8, DON'T)
- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (binding)
- [`compliance.md`](./compliance.md), [`governance.md`](./governance.md), [`backend-api.md`](./backend-api.md), [`frontend.md`](./frontend.md)
- [`../milestones/m7-ga-acceptance.md`](../milestones/m7-ga-acceptance.md)

Last updated: 2026-06-04
