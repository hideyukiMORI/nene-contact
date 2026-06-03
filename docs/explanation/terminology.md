# Terminology Registry (binding)

**This file is the single, canonical source of truth** for every identifier in NeNe
Contact: PHP classes/methods/constants, OpenAPI, JSON, DB tables/columns, MCP tools, env
vars, status/enum values, Problem Details slugs, and UI routes. No other document or code
comment overrides it.

> ## Absolute no-typo / no-variant rule (厳守 — non-negotiable)
>
> These rules are **MUST**, enforced as **merge blockers**. There is no "close enough."
>
> 1. **Use the exact spelling registered here.** A typo, spelling variant, case variant,
>    pluralization variant, or synonym of a registered term is a **defect that blocks
>    merge** (e.g. `inquiry`/`message`/`lead` for `submission`, `contactForm` for
>    `contact_form`, `Repo`/`Service` suffixes).
> 2. **No unregistered identifier.** Introducing any entity, field, status, slug,
>    `operationId`, env var, role, or class without a row in this file is a defect.
> 3. **Register in the same PR.** Adding or renaming any identifier **MUST** update this
>    file (and `glossary.md` if it is a product concept) in the **same** PR.
> 4. **Stability.** Shipped `operationId` and Problem Details slugs are **never renamed**;
>    deprecate instead.
> 5. **When in doubt, match the registry exactly.** Do not guess; do not invent a variant.
>
> This document defines exact strings; [`../development/naming-conventions.md`](../development/naming-conventions.md)
> defines the *patterns*. Cursor rule [`.cursor/rules/20-terminology.mdc`] mirrors this as
> zero-tolerance.

---

## 1. Product and repo

| Term | Spelling | Notes |
| --- | --- | --- |
| Product name | **NeNe Contact** | Not "NeneContact" in prose |
| Repository | `nene-contact` | |
| PHP namespace | `NeneContact\` | |
| Problem Details base | `https://nene-contact.dev/problems/` | §12 |

---

## 2. Core domain entities

| Concept | JSON / DB (snake, plural table) | PHP class |
| --- | --- | --- |
| Tenant | `organization` / `organizations` | `Organization` |
| Operator account | `user` / `users` | `User` |
| Form definition | `contact_form` / `contact_forms` | `ContactForm` |
| Public embed key | `public_form_key` | string on `contact_form` (opaque; not internal id) |
| Field definition | `form_field` / `form_fields` | `FormField` |
| Visitor submission | `submission` / `submissions` | `Submission` — **not** `inquiry`, `message`, `lead` |
| Operator note | `submission_note` / `submission_notes` | `SubmissionNote` |
| Notification config | `notification_channel` / `notification_channels` | `NotificationChannel` |
| Handoff record | `submission_link` / `submission_links` | `SubmissionLink` |
| Audit record | `audit_event` / `audit_events` | `AuditEvent` (ADR 0013) |

---

## 3. Tenancy & roles (ADR 0006)

| Term | Spelling | Notes |
| --- | --- | --- |
| Tenant scope column | `organization_id` | On every tenant-scoped table; resolved per request |
| Role — cross-tenant | `superadmin` | May manage organizations; `organization_id` may be null |
| Role — organization admin | `admin` | Manages one org's users, forms, channels, settings |
| Role — operator | `editor` | Operates submissions inbox within one org |
| Suite org federation | `NENE_SUITE_ORG_EXTERNAL_ID` | External org id (env) |

Public embed routes resolve organization via `public_form_key`, not a role.

---

## 4. Layer suffixes

| Layer | Suffix | Example |
| --- | --- | --- |
| HTTP entry | `Handler` | `CreateSubmissionHandler` |
| Business logic | `UseCase` | `CreateSubmissionUseCase` |
| Persistence contract | `RepositoryInterface` | `SubmissionRepositoryInterface` |
| PDO impl | `Pdo{Entity}Repository` | `PdoSubmissionRepository` |
| Notification sender | `{Channel}Notifier` | `EmailNotifier`, `SlackNotifier`, `ChatworkNotifier` |
| Upstream HTTP client | `{Sibling}Client` (in `Upstream/`) | `DealClient`, `InvoiceClient`, `VaultClient`, `RecordsClient` |
| Audit recorder | `AuditRecorder` | in `Audit/` |

Forbidden suffixes: `Controller`, `Service`, `Manager`, `Repo`.

---

## 5. Submission status values (`submission.status`)

| Value | Meaning |
| --- | --- |
| `open` | New, untouched |
| `in_progress` | Operator working |
| `resolved` | Closed successfully |
| `spam` | Marked spam; no handoff |

---

## 6. Field types (`form_field.field_type`)

| Value | Meaning |
| --- | --- |
| `text` | Single line |
| `email` | Email with validation |
| `textarea` | Multi line |
| `select` | Options list (`options_json`) |
| `checkbox` | Boolean consent or flag |
| `file` | Attachment (bounded) |
| `honeypot` | Anti-spam hidden field |

Prohibited field types (charter §8): no My Number, no raw card number.

---

## 7. Notification channel types (`notification_channel.channel_type`)

| Value | Transport |
| --- | --- |
| `email` | SMTP / mailer |
| `slack` | Slack incoming webhook |
| `chatwork` | Chatwork API |

---

## 8. Key field & column names

| Field | Where | Notes |
| --- | --- | --- |
| `allowed_origins` | `contact_form` | array; server-side origin allowlist (ADR 0010) |
| `retention_days` | `contact_form` / org policy | retention before purge (charter §5) |
| `consent_required` | `contact_form` | boolean |
| `consent_label` | `contact_form` | per-locale `ja`/`en` object (ADR 0011) |
| `field_values_json` | `submission` | submitted values |
| `options_json` | `form_field` | per-locale option labels |
| `config_json` | `notification_channel` | encrypted at rest |
| `handoff_status` | `submission_link` | `pending` / `succeeded` / `failed` |
| `deal_opportunity_id` | `submission_link` | sibling pointer (Deal) |
| `invoice_client_id` | `submission_link` | sibling pointer (Invoice) |
| `vault_document_id` | `submission_link` | sibling pointer (Vault) |

---

## 9. Audit actions (`audit_event.action`, ADR 0013)

Pattern: **`{entity}.{verb}`** (snake_case). Registered verbs: `created`, `updated`,
`deleted`, `viewed`, `exported`, `retried`.

Examples: `submission.viewed`, `submission.exported`, `submission.deleted`,
`contact_form.updated`, `notification_channel.created`, `handoff.retried`.

---

## 10. Embed / public API

| Term | Spelling |
| --- | --- |
| Embed script path | `/embed.js` |
| Public schema path | `/public/forms/{public_form_key}/schema` |
| Public submit path | `/public/forms/{public_form_key}/submissions` |
| Service ingest path | `/api/submissions` |
| Trigger attribute | `data-trigger` values: `floating`, `button`, `inline` |
| Locale attribute | `data-lang` values: `ja`, `en` |

Route prefixes: `/admin/*` (JWT), `/api/*` (service token), `/public/*` (origin + rate
limit). Paths are lowercase kebab-case (`/admin/contact-forms`).

---

## 11. JSON naming

- **snake_case** for all JSON request/response properties. No camelCase in public JSON.
- IDs: `{resource}_id` (e.g. `submission_id`, `contact_form_id`, `organization_id`).
- Booleans `is_`/`has_` (`is_spam`, `has_attachment`); timestamps `_at` ISO 8601.
- List envelope: `items`, `limit`, `offset`.

---

## 12. Problem Details (RFC 9457)

Base URI `https://nene-contact.dev/problems/`. Slugs are kebab-case and **stable**:

| Slug | Status |
| --- | --- |
| `validation-failed` | 422 |
| `not-found` | 404 |
| `submission-not-found` | 404 |
| `contact-form-not-found` | 404 |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `origin-not-allowed` | 403 |
| `rate-limited` | 429 |
| `internal-server-error` | 500 |

Validation `errors[].field` = snake_case path / JSON pointer; `errors[].code` = snake_case
(`required`, `invalid_email`).

---

## 13. Locales (bilingual — ADR 0011)

| Term | Spelling | Notes |
| --- | --- | --- |
| Locale code | `ja`, `en` | The **only** supported product locales |
| Form locale set | `locales` | Non-empty subset of `{ja, en}` on `contact_form` |
| Form default | `default_locale` | Member of `locales`; embed fallback |
| Embed attribute | `data-lang` | `ja` / `en` only; must be in form `locales` |

Localized strings (labels, `select` options, `consent_label`, notification templates) are
objects keyed by `ja` / `en` only. No other locale code is a valid identifier.

---

## 14. Environment variables

| Variable | Purpose |
| --- | --- |
| `NENE_CONTACT_PORT` | Local HTTP (default `8900`) |
| `NENE_DEAL_API_BASE_URL` / `NENE_DEAL_SERVICE_TOKEN` | Deal handoff |
| `NENE_INVOICE_API_BASE_URL` / `NENE_INVOICE_SERVICE_TOKEN` | Invoice handoff |
| `NENE_VAULT_API_BASE_URL` / `NENE_VAULT_SERVICE_TOKEN` | Vault attachment archive |
| `NENE_RECORDS_API_BASE_URL` / `NENE_RECORDS_BEARER_TOKEN` | Records read-only select options |
| `NENE_CONCIERGE_WEBHOOK_SECRET` | Verify inbound Concierge posts |
| `NENE_SUITE_ORG_EXTERNAL_ID` | Suite org federation (ADR 0006) |

Names UPPER_SNAKE_CASE, product prefix `NENE_CONTACT_`. Secrets never committed.

---

## 15. MCP tool naming

Pattern: **`{verb}Contact{Resource}`** — e.g. `listContactSubmissions`,
`getContactSubmission`. Tool `name` matches the OpenAPI `operationId` family; `safety` is
`read` or `write`. Maps to Contact OpenAPI only (ADR 0002).

---

## Change procedure & enforcement

- Adding/renaming any identifier **MUST** update this file in the same PR; product concepts
  also update [`glossary.md`](./glossary.md).
- Self-review: [`../review/backend-api.md`](../review/backend-api.md) and
  [`../review/frontend.md`](../review/frontend.md) check identifiers against this registry.
- A deviation (e.g. a deliberate rename) requires an ADR (self-authority, ADR 0012 model).

Last updated: 2026-06-04
