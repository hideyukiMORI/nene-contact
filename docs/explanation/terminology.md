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
| Public embed key | `public_form_key` | string on `contact_form` (opaque; not internal id). Optionally set at **create** as a slug (lowercase `[a-z0-9-]`, 2-64, globally unique); **immutable** afterwards |
| Field definition | `form_field` / `form_fields` | `FormField` |
| Visitor submission | `submission` / `submissions` | `Submission` — **not** `inquiry`, `message`, `lead` |
| Operator note | `submission_note` / `submission_notes` | `SubmissionNote` |
| File attachment | `submission_attachment` / `submission_attachments` | `Attachment` (bytes off-DB; D12) |
| Notification config | `notification_channel` / `notification_channels` | `NotificationChannel` |
| Handoff record | `submission_link` / `submission_links` | `SubmissionLink` |
| Audit record | `audit_event` / `audit_events` | `AuditEvent` (ADR 0013) |

---

## 3. Tenancy & roles (ADR 0006, ADR 0014)

| Term | Spelling | Notes |
| --- | --- | --- |
| Tenant scope column | `organization_id` | On every tenant-scoped table; resolved per request |
| Role — cross-tenant | `superadmin` | May manage organizations; `organization_id` may be null |
| Role — organization admin | `admin` | Manages one org's users, forms, channels, settings |
| Role — operator | `editor` | Operates submissions inbox within one org |
| Suite org federation | `NENE_SUITE_ORG_EXTERNAL_ID` | External org id (env) |
| Resolution mode (env) | `TENANT_RESOLUTION` | values: `single`, `path`, `subdomain`, `custom_domain` |
| Request attribute — org id | `nene2.org.id` | set by `OrgResolverMiddleware` |
| Request attribute — org slug | `nene2.org.slug` | set by `OrgResolverMiddleware` |

Capabilities (`Capability` enum cases): `ManageOrganizations`, `ManageUsers`,
`ManageForms`, `ManageChannels`, `ManageSettings`, `ViewSubmissions`, `ManageSubmissions`,
`ViewSubmissionTechnicalMeta` (disclose IP/UA, admin+; ADR 0018), `ViewAuditLog`.

Public embed routes resolve organization via `public_form_key`; `/api/*` via the org-scoped
service token (ADR 0014) — not a role.

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
| `phone` | Telephone number with format check (jp / jp-nohyphen / intl) |
| `textarea` | Multi line |
| `select` | Choice field: options list (`options_json`) + display config (`config_json`) |
| `checkbox` | Boolean consent or flag |
| `date` | Calendar date (`<input type="date">`) |
| `file` | Attachment (bounded) |
| `honeypot` | Anti-spam hidden field |

Prohibited field types (charter §8): no My Number, no raw card number.

### 6.1 Choice display styles (`form_field.config_json.style`, `ChoiceStyle`)

Choice-field management UI (builder spec v2.0). The style internalizes the selection logic;
there is no separate single/multiple toggle. SSOT: `NeneContact\ContactForm\ChoiceStyle`
(backend) mirrored by `STYLES` in `choice-core.ts` (frontend).

| Value | Logic | Meaning |
| --- | --- | --- |
| `radio` | single | Vertical radio list (image choice capable) |
| `dropdown` | single | Dropdown / select |
| `segment` | single | Button group (horizontal) |
| `checkbox` | multiple | Vertical checkbox list (image choice capable) |
| `tags` | multiple | Multi-select tag input |
| `chips` | multiple | Button group, multiple on |

Choice `config_json` keys (select): `style`, `defaults` (initially-selected option values),
`other` + `other_config` (`label` / `placeholder` / `required` / `max_len`), `count_rule`
(`min_on` / `min` / `max_on` / `max`; multiple only), `image` (`enabled` / `layout`
`card`|`list` / `cols` `2`|`3` / `ratio` `1:1`|`4:3`|`16:9`; radio/checkbox only).
Per-option keys in `options_json`: `value`, `label`, `description`, `image`.

### 6.2 Per-type field config (`form_field.config_json`, `FieldTypeConfig`)

Non-choice fields store a declarative type-specific config in the same `config_json` column
(field-config UI, builder spec v1.0). SSOT: `NeneContact\ContactForm\FieldTypeConfig` mirrored by
the frontend `FIELD_TYPE_DEFAULTS`. `checkbox` / `honeypot` carry no config (null).

| Type | `config_json` keys |
| --- | --- |
| `text` | `format` (none/kana/alnum), `min_on`/`min`/`max_on`/`max`, `counter` |
| `email` | `confirm`, `domain_mode` (none/allow/block), `domains`, `autoreply` |
| `phone` | `format` (jp/jp-nohyphen/intl) |
| `textarea` | `rows` (sm/md/lg), `min_on`/`min`/`max_on`/`max`, `counter` |
| `date` | `mode` (date/datetime/time), `range` (none/future/past/between), `from`/`to`, `def` (none/today) |
| `file` | `fmt_image`/`fmt_pdf`/`fmt_doc`, `max_size` (5/10/25), `multiple`, `max_count` |

---

## 7. Notification channel types (`notification_channel.channel_type`)

| Value | Transport | `config_json` keys (encrypted at rest, ADR 0016/§6) |
| --- | --- | --- |
| `email` | SMTP / mailer | `recipient` |
| `slack` | Slack incoming webhook | `webhook_url` |
| `chatwork` | Chatwork API | `api_token`, `room_id` |
| `webhook` | Signed outbound HTTP POST (D6) | `url`, `secret` (HMAC-SHA256) |

---

## 8. Key field & column names

| Field | Where | Notes |
| --- | --- | --- |
| `allowed_origins` | `contact_form` | array; server-side origin allowlist (ADR 0010) |
| `description` | `contact_form` | optional form description shown above the fields in the embed (builder spec v1.0) |
| `retention_days` | `contact_form` / org policy | retention before purge (charter §5) |
| `consent_required` | `contact_form` | boolean |
| `consent_label` | `contact_form` | per-locale `ja`/`en` object (ADR 0011) |
| `submit_label` | `contact_form` | optional per-locale submit button label; null uses the embed default (submit experience) |
| `post_submit` | `contact_form` | after-submit behaviour: `message` (default) or `redirect` (submit experience) |
| `success_message` | `contact_form` | optional per-locale completion message shown when `post_submit=message` (submit experience) |
| `redirect_url` | `contact_form` | absolute `http(s)` URL; required when `post_submit=redirect` (submit experience) |
| `consent_given_at` | `submission` | immutable consent timestamp (charter §3) |
| `source` | `submission` | origin: `form` (public/embed) or service ingest `concierge` / `import` / `api` / `first_party` (M6; `first_party` = records native embed relay via a service token, #388) |
| `source_url` | `submission` | embed host page the form was submitted from (referer); non-PII reception meta shown by default (ADR 0018); null for service ingest |
| `locale` | `submission` | locale the visitor submitted in (one of the form's locales); non-PII reception meta; null when unknown |
| `deleted_at` | `submission` | soft-delete marker (ADR 0016); excluded from inbox |
| `purged_at` | `submission` | PII erased in place after grace (ADR 0016, charter §5) |
| `field_values_json` | `submission` | submitted values; erased to `[]` on purge (ADR 0016) |
| `options_json` | `form_field` | choice options: `value`, per-locale `label`, optional per-locale `description`, `image` flag |
| `placeholder` | `form_field` | optional input hint text shown in the embed (builder spec v1.0) |
| `description` | `form_field` | optional per-field description shown under the label in the embed (field-config UI) |
| `config_json` | `form_field` | per-field declarative config: choice display config (select) or type-specific config (FieldTypeConfig); null for checkbox/honeypot |
| `config_json` | `notification_channel` | encrypted at rest |
| `deleted_at` | `notification_channel` | soft-delete marker (ADR 0016); excluded from admin reads + dispatch (#429) |
| `sender_display_name` | `organization` | email From display name; null falls back to the organization `name` (email-wording wave a, #442) |
| `target` | `submission_link` | handoff target: `deal` / `vault` / `invoice` (one row per submission per target) |
| `attachment_id` | `submission_link` | per-attachment targets (Vault) set this; submission-level targets (Deal) leave it null |
| `handoff_status` | `submission_link` | `pending` / `succeeded` / `failed` |
| `last_error` | `submission_link` | failure reason for retry; never contains a service token (M5) |
| `external_reference` | handoff payload | idempotency key sent to the sibling = the Contact `submission_id` (DO D11) |
| `include_pii` | agent API query (`/api/*`) | `true` returns raw values + is audited; default false / redacted (charter §11) |
| `confirmation_token` | agent write body (`/api/*`) | two-step write proof; phase 1 issues it, phase 2 echoes it to apply (charter §11) |
| `deal_opportunity_id` | `submission_link` | sibling pointer (Deal) |
| `invoice_client_id` | `submission_link` | sibling pointer (Invoice) |
| `vault_document_id` | `submission_link` | sibling pointer (Vault) |

---

## 9. Audit (`audit_event`, ADR 0013, [`../development/audit-logging.md`](../development/audit-logging.md))

Action pattern: **`{entity}.{verb}`** (snake_case). Registered verbs: `created`, `updated`,
`deleted`, `corrected`, `expired`, `purged`, `viewed`, `exported`, `retried`, `sent`,
`suppressed`, `failed`, `issued`, `revoked`, `tested`.

Examples: `submission.viewed`, `submission.exported`,
`submission_technical_meta.viewed` (audited IP/UA disclosure, entity type `submission`; ADR 0018),
`submission.deleted` (soft-delete),
`submission.corrected` (data-subject correction, §4), `submission.expired` (retention
soft-delete, §5), `submission.purged` (PII erased in place, ADR 0016), `user.created`,
`contact_form.updated`, `notification_channel.created` / `notification_channel.updated`
(config or enabled-flag edit) / `notification_channel.deleted` (soft-delete, ADR 0016) /
`notification_channel.tested` (operator test send; snapshot carries channel_type + outcome, no secret),
`handoff.created` (first sibling
handoff attempt), `handoff.retried` (subsequent attempts; entity type `handoff`),
`user.password_changed` — one event for two paths, told apart by the actor: a **self-service
change** carries the changer's own `actor_user_id`; an **admin reset** (bootstrap
`reset-password.php`, lost-password recovery) carries **actor=null** because the CLI has no
authenticated operator (#410),
`autoreply.sent` / `autoreply.suppressed` (per-recipient cooldown) / `autoreply.failed`
(sender auto-reply outcome, entity type `autoreply`, entity id = the submission; #360),
`service_token.issued` / `service_token.revoked` (machine credential lifecycle, entity type
`service_token`; embed 案1, #388 — snapshot carries non-secret metadata only, never the token or jti).

| Term | Spelling | Notes |
| --- | --- | --- |
| Table | `audit_events` | append-only, org-scoped |
| Actor | `actor_user_id` | who (null for system/public) |
| Before snapshot | `before_json` | sanitized; null for create |
| After snapshot | `after_json` | sanitized; null for delete |
| Affected record | `entity_type` / `entity_id` | what |
| Recorder | `AuditRecorder` / `AuditRecorderInterface` | called in the UseCase |
| Repository | `PdoAuditEventRepository` | `append`, `findAll`, `count` |
| Read route | `/admin/audit-events` | admin (own org) / superadmin |

---

## 10. Embed / public API

| Term | Spelling |
| --- | --- |
| Embed script path | `/embed.js` |
| Public schema path | `/public/forms/{public_form_key}/schema` |
| Public submit path | `/public/forms/{public_form_key}/submissions` |
| Hosted form page path | `/form/{public_form_key}` (minimal HTML page loading embed.js inline; link target where a host sanitizer strips the embed snippet) |
| Service ingest path | `/api/submissions` |
| Trigger attribute | `data-trigger` values: `modal`, `chat`, `inline`, `button` (overrides `appearance.mode`) |
| Locale attribute | `data-lang` values: `ja`, `en` |

Route prefixes: `/admin/*` (JWT), `/api/*` (machine key `X-NENE2-API-Key` for the MCP read
surface; the `POST /api/submissions` ingest write additionally accepts a Bearer service token,
#388), `/public/*` (origin + rate limit), `/form/*` (public hosted form page, unauthenticated).
Paths are lowercase kebab-case (`/admin/contact-forms`).

### Service tokens (embed 案1 / records native embed — #386/#388)

| Term | Spelling | Notes |
| --- | --- | --- |
| Entity / table | `service_token` / `service_tokens` | registry of issued machine credentials; the token value is **never stored** (only `jti` + metadata); revocation is soft (`revoked_at`, ADR 0016) |
| Revocation key | `jti` | JWT id claim; globally unique; the registry row keys revocation |
| Scope column / claim | `scopes` | comma-separated in the row; list claim in the JWT |
| Scope value | `ingest:submissions` | the only scope today; authorizes `POST /api/submissions` (`ingest:form:{id}` is a deferred, optional variant) |
| Subject | `service:records` | default `sub` claim (calling system identity); other first-party sites issue under their own `service:{name}` |
| Admin routes | `/admin/service-tokens` (`GET` list / `POST` issue / `DELETE /{id}` revoke) | ManageSettings; org-scoped |
| Presented as | `Authorization: Bearer <jwt>` | on `POST /api/submissions`; org resolved from the token's `org` claim, not the URL |
| Repository / authorizer | `PdoServiceTokenRepository` / `PdoServiceTokenAuthorizer` | registry read/write (org-scoped) / request-time revocation check (not org-scoped) |

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
| `service-token-revoked` | 401 |
| `insufficient-scope` | 403 |
| `service-token-not-found` | 404 |
| `origin-not-allowed` | 403 |
| `org-not-found` | 404 |
| `org-not-resolved` | 404 |
| `org-inactive` | 403 |
| `org-access-denied` | 403 |
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

### Message catalog (UI strings — [`../development/i18n-message-catalog.md`](../development/i18n-message-catalog.md))

| Term | Spelling | Notes |
| --- | --- | --- |
| Module | `shared/i18n` | `locales.ts`, `messages/{ja,en}.ts`, `translate.ts`, `i18n-context.tsx` |
| Type | `SupportedLocale` | `'ja' \| 'en'`; `DEFAULT_LOCALE = 'ja'` (authoritative) |
| Hook / fn | `useTranslation()` → `t`, `MessageKey` | `t('admin.submissions.title')` |
| Storage key | `nene-locale` | persisted active locale |
| Key namespaces | `common.*`, `admin.nav.*`, `admin.{feature}.*`, `embed.*` | stable; never rename a shipped key |

UI chrome strings live in the catalog (`t(key)`); operator-authored content (labels,
options, `consent_label`, templates) is per-locale **data**, not catalog.

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
| `NENE2_MACHINE_API_KEY` | Machine API key for the agent read surface `/api/*` (`X-NENE2-API-Key`); MCP maps here (§11) |
| `NENE_SUITE_ORG_EXTERNAL_ID` | Suite org federation (ADR 0006) |
| `NENE_CONTACT_ENCRYPTION_KEY` | At-rest key for channel secrets (charter §6); base64 32-byte |

Names UPPER_SNAKE_CASE, product prefix `NENE_CONTACT_`. Secrets never committed.

---

## 15. MCP tool naming

Pattern: **`{verb}Contact{Resource}`** — e.g. `listContactSubmissions`,
`getContactSubmission`. Tool `name` matches the OpenAPI `operationId` family; `safety` is
`read` or `write`. Maps to Contact OpenAPI only (ADR 0002).

---

## 16. OpenAPI operationIds (contract — `docs/openapi/openapi.yaml`)

camelCase `{verb}{Resource}`, stable (never renamed after release). Registered:
`getHealth`, `login`, `listOrganizations`, `createOrganization`, `getOrganizationById`,
`getOrganizationSettings`, `updateOrganizationSettings`, `listContactForms`, `createContactForm`, `getContactFormById`,
`listNotificationChannels`, `createNotificationChannel`, `getNotificationChannel`,
`updateNotificationChannel`, `deleteNotificationChannel`, `testNotificationChannel`,
`listSubmissions`, `exportSubmissions`, `getSubmissionById`,
`updateSubmissionStatus`, `getSubmissionTechnicalMeta`, `listSubmissionNotes`,
`addSubmissionNote`, `getPublicFormSchema`, `submitPublicForm`. Validated by `composer openapi`.

---

## 17. Provisioning CLIs (`tools/`)

Pattern: **`{verb}-{entity}.php`** (kebab-case, entity as registered in §2), run as
`php tools/{name}.php …`. They bootstrap the runtime container, scope `organization_id`
exactly as the tenant middleware does, and go through the same validator + use case as the
HTTP API — so they are audited (ADR 0013) and enforce identical rules. Used where the admin
API is out of reach (a host whose reverse proxy strips `Authorization`) or where the console
has no UI for the field. Form content is passed at runtime; no site-specific values in the repo.

| CLI | Purpose |
| --- | --- |
| `create-organization.php` | Bootstrap a tenant |
| `create-user.php` | Bootstrap an operator account |
| `create-contact-form.php` | Create a `contact_form` from a full JSON body; idempotent on a pinned `public_form_key` (#363) |
| `update-contact-form.php` | Update a `contact_form` from a **partial** JSON body merged over the current one; `--dry-run` prints without writing (#378) |
| `reset-password.php` | Reset an operator's password out-of-band (lost-password recovery) via `AdminResetPasswordUseCase`; addresses the user by email, reads the new password from **STDIN** (never argv), audits `user.password_changed` with **actor=null**; `--dry-run` prints the target without writing (#410) |
| `purge-submissions.php` | Erase PII past retention (charter §5, ADR 0016) |

| Concept | Spelling | Notes |
| --- | --- | --- |
| Form body patch | `ContactFormBodyPatch` | SSOT for which body keys are patchable: shallow-merges a partial body over the current one, rejecting unknown keys and the identity keys (`id`, `public_form_key`, `organization_id`, `status`, `created_at`, `updated_at`) |

---

## Change procedure & enforcement

- Adding/renaming any identifier **MUST** update this file in the same PR; product concepts
  also update [`glossary.md`](./glossary.md).
- Self-review: [`../review/backend-api.md`](../review/backend-api.md) and
  [`../review/frontend.md`](../review/frontend.md) check identifiers against this registry.
- A deviation (e.g. a deliberate rename) requires an ADR (self-authority, ADR 0012 model).

Last updated: 2026-07-16
