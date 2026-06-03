# Naming Conventions

Authoritative naming rules for NeNe Contact code, API contracts, database objects, tests,
and English documentation.

> **Absolute adherence — non-negotiable.** These rules are **MUST**, not suggestions. A
> name that violates a rule here, or a typo / spelling variant of a registered term, is a
> defect and **blocks merge**. There is no "close enough." When in doubt, match the
> registry exactly.
>
> The concrete canonical spelling of every term and identifier lives in the
> **single source of truth**: [`../explanation/terminology.md`](../explanation/terminology.md).
> This document defines the *patterns*; the registry defines the *exact strings*.
> Introducing or renaming any identifier **MUST** update the registry in the same PR.

**Terminology registry (canonical spellings):** [`../explanation/terminology.md`](../explanation/terminology.md)
**Glossary (product term meanings):** [`../explanation/glossary.md`](../explanation/glossary.md)

**Framework baseline:** NENE2
[`domain-layer.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/domain-layer.md),
[`database-migrations.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/database-migrations.md),
[`api-error-responses.md`](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/api-error-responses.md).
This document is the NeNe Contact override and extension list.

---

## 1. PHP

### Files and namespaces

| Item | Rule | Example |
| --- | --- | --- |
| Namespace root | `NeneContact\` | `NeneContact\Submission\CreateSubmissionHandler` |
| Domain folder | PascalCase singular domain name | `src/ContactForm/`, `src/Submission/` |
| File name | Match the primary class | `CreateSubmissionHandler.php` |
| One public class per file | Required | — |

### Classes and interfaces

| Role | Pattern | Example |
| --- | --- | --- |
| HTTP handler | `{Verb}{Noun}Handler` | `CreateSubmissionHandler`, `ListSubmissionsHandler` |
| Use case interface | `{Verb}{Noun}UseCaseInterface` | `CreateSubmissionUseCaseInterface` |
| Use case impl | `{Verb}{Noun}UseCase` | `CreateSubmissionUseCase` |
| Use case method | Always `execute` | `execute(CreateSubmissionInput $input): CreateSubmissionOutput` |
| Input DTO | `{Verb}{Noun}Input` | `CreateSubmissionInput` |
| Output DTO | `{Verb}{Noun}Output` | `CreateSubmissionOutput` |
| Domain entity | Singular noun, no suffix | `ContactForm`, `FormField`, `Submission`, `NotificationChannel` |
| Repository interface | `{Entity}RepositoryInterface` | `SubmissionRepositoryInterface` |
| PDO repository | `Pdo{Entity}Repository` | `PdoSubmissionRepository` |
| Upstream HTTP client | `{Sibling}Client` in `Upstream/` | `DealClient`, `InvoiceClient` |
| Notification sender | `{Channel}Notifier` in `Notification/` | `EmailNotifier`, `SlackNotifier` |
| Domain exception | `{Entity}{Reason}Exception` | `SubmissionNotFoundException` |
| Service provider | `{Purpose}ServiceProvider` | `RuntimeServiceProvider`, `SubmissionServiceProvider` |

All application classes: `final` and `readonly` where applicable. Every PHP file:
`declare(strict_types=1);`.

### Modules (`src/`)

Use only **domain-grouped** top-level folders. Do **not** add layer folders
(`Handlers/`, `Repositories/`, `UseCases/`). Group a concept's handler, use case, DTOs,
entity, repository interface, PDO impl, and exception together.

Planned domains (Phase 1+): `Organization/`, `Auth/`, `User/`, `ContactForm/`,
`FormField/`, `Submission/`, `SubmissionNote/`, `Notification/`, `Webhook/`, `Audit/`,
`Upstream/`, `Http/`.

### Methods, properties, constants

| Item | Rule | Example |
| --- | --- | --- |
| Methods | camelCase | `findById`, `markAsResolved` |
| Properties | camelCase | `$contactFormId`, `$submissionRepository` |
| Constants | UPPER_SNAKE_CASE | `MAX_SUBMISSION_BYTES`, `DEFAULT_RETENTION_DAYS` |
| Enums | PascalCase type, UPPER or PascalCase cases (match NENE2) | `SubmissionStatus::Open` |

Repository methods use **domain verbs**: `findById`, `save`, `delete`, `existsByPublicKey`
— never `selectById`, `insertRow`.

---

## 2. HTTP routes and OpenAPI

### URL paths

| Item | Rule | Example |
| --- | --- | --- |
| Path segments | lowercase **kebab-case** | `/admin/contact-forms`, `/admin/submissions` |
| Collection paths | plural noun | `/admin/submissions`, `/admin/notification-channels` |
| Single resource | `{id}` path param | `/admin/submissions/{id}` |
| Public schema | `/public/forms/{public_form_key}/schema` | (no auth) |
| Public submit | `/public/forms/{public_form_key}/submissions` | (no auth) |
| Service ingest | `/api/submissions` | (service token) |
| Path param name | lowercase singular | `id`, `public_form_key` |

Three audiences map to three prefixes: **`/admin/*`** (operator JWT), **`/api/*`** (service
token), **`/public/*`** (embed visitors; origin + rate limit). See `backend-standards.md`.

### operationId

| Item | Rule | Example |
| --- | --- | --- |
| Case | camelCase | `getHealth`, `createSubmission` |
| Shape | `{verb}{Resource}` or `{verb}{Resource}ById` | `listSubmissions`, `getSubmissionById` |
| Stability | Never rename after release; deprecate instead | — |

Must match across `docs/openapi/openapi.yaml`, route registration, and
`docs/mcp/tools.json` `operationId`.

### OpenAPI schema names

| Item | Rule | Example |
| --- | --- | --- |
| Response schema | `{Resource}Response` | `SubmissionResponse` |
| List response | `{Resource}ListResponse` | `SubmissionListResponse` |
| Create request | `Create{Resource}Request` | `CreateContactFormRequest` |
| Tag names | PascalCase singular group | `System`, `Admin`, `Public`, `Submission` |

Public OpenAPI summaries, descriptions, and examples: **English only** (ADR 0008).

---

## 3. JSON (request and response bodies)

| Item | Rule | Example |
| --- | --- | --- |
| Property names | **snake_case** | `contact_form_id`, `submitted_at`, `field_type` |
| Booleans | `is_` / `has_` prefix | `is_spam`, `has_attachment`, `consent_required` |
| Timestamps | `_at` suffix, ISO 8601 string | `submitted_at`, `resolved_at`, `created_at` |
| Foreign keys | `{entity}_id` | `contact_form_id`, `organization_id` |
| Public form key | `public_form_key` | opaque; never the internal ULID/id |
| List envelope | `items`, `limit`, `offset` | Same as NENE2 list pattern |
| Localized strings | object keyed `ja` / `en` only | `{"ja": "...", "en": "..."}` (ADR 0011) |

Do not mix camelCase in public JSON. Never put PII (email) in URLs/query strings
(ADR 0010 / charter §6).

---

## 4. Problem Details and validation errors

| Item | Rule | Example |
| --- | --- | --- |
| Base URL | `https://nene-contact.dev/problems/` | — |
| Type slug | kebab-case | `validation-failed`, `submission-not-found`, `origin-not-allowed` |
| Validation `errors[].field` | snake_case path / JSON pointer | `body.email`, `body.fields.message` |
| Validation `errors[].code` | snake_case | `required`, `invalid_email`, `honeypot_tripped` |

Problem Details `title` and `detail`: English. Use RFC 9457 `application/problem+json`.
Honeypot trips are accepted silently (no bot-useful error) — ADR 0010.

---

## 5. Database

| Item | Rule | Example |
| --- | --- | --- |
| Table names | snake_case, **plural** | `contact_forms`, `form_fields`, `submissions`, `submission_notes`, `notification_channels`, `audit_events` |
| Column names | snake_case | `contact_form_id`, `field_type`, `submitted_at` |
| Primary key | `id` | BIGINT auto-increment (or ULID per ADR) |
| Tenant key | `organization_id` on every tenant-scoped table | (ADR 0006) |
| Foreign key column | `{singular_entity}_id` | `contact_form_id`, `submission_id` |
| JSON columns | snake_case `*_json` | `field_values_json`, `config_json`, `options_json` |
| Index names | `idx_{table}_{columns}` | `idx_submissions_contact_form_id` |
| Unique constraints | `uniq_{table}_{columns}` | `uniq_contact_forms_public_form_key` |

SQL lives **only** in `Pdo*Repository` classes. Channel secrets/tokens are encrypted at
rest (charter §6). Every tenant query is scoped by resolved `organization_id` (ADR 0006).

### Migrations

| Item | Rule | Example |
| --- | --- | --- |
| File name | `YYYYMMDDHHMMSS_snake_description.php` | `20260701120000_create_submissions_table.php` |
| Location | `database/migrations/` | (NENE2 project layout) |
| Seeds | `database/seeds/` | local/dev only |
| Snapshot file | `database/schema/{table}.sql` | `database/schema/submissions.sql` |

---

## 6. Environment variables

| Item | Rule | Example |
| --- | --- | --- |
| Names | UPPER_SNAKE_CASE | `DB_HOST`, `NENE_CONTACT_PORT` |
| Prefix | Product-specific compose overrides | `NENE_CONTACT_` |
| Sibling upstreams | `NENE_{SIBLING}_API_BASE_URL` / `_SERVICE_TOKEN` | `NENE_DEAL_SERVICE_TOKEN` |
| Secrets | Never commit; document in `.env.example` only | — |

`getenv()` / `$_ENV` / `$_SERVER` access stays inside the config-loading boundary
(typed config objects at runtime).

---

## 7. Tests

| Item | Rule | Example |
| --- | --- | --- |
| Test class | `{ClassUnderTest}Test` | `CreateSubmissionUseCaseTest` |
| Test method | `test_{behavior}_when_{condition}` | `test_rejects_submission_when_honeypot_filled` |
| Test namespace | Mirror `src/` under `tests/` | `tests/Submission/CreateSubmissionUseCaseTest.php` |
| In-memory double | `InMemory{Entity}Repository` | lives in `tests/`, never shipped |

---

## 8. MCP tools

| Item | Rule | Example |
| --- | --- | --- |
| Tool `name` | `{verb}Contact{Resource}` = OpenAPI `operationId` family | `listContactSubmissions`, `getContactSubmission` |
| Tool `title` | Short English Title Case | `List Contact Submissions` |
| `safety` | `read` or `write` | Prefer `read`; PII redacted unless `include_pii=true` (audited) |

Catalog: `docs/mcp/tools.json`. Maps to Contact OpenAPI only — never a sibling DB
(ADR 0002). Validate with `composer mcp`.

---

## 9. Frontend

| Item | Rule |
| --- | --- |
| Components | PascalCase file and export; function components only |
| Hooks | camelCase with `use` prefix |
| Entity folders | kebab-case, match OpenAPI tag (`submission`, `contact-form`) |
| API client | Maps snake_case JSON to typed models; **never** renames API fields in transit |
| Admin SPA | React + TypeScript strict mode |
| Embed widget | Isolated build; class prefix `nene-contact-` or shadow DOM |
| Locales | `ja` / `en` only (ADR 0011) |
| Message keys | `{scope}.{feature}.{element}` lowercase dotted, **stable** | `admin.submissions.title`, `common.actions.save`, `embed.submit` |

Message-catalog keys are stable identifiers (like `operationId`): never rename a shipped
key. Full i18n spec: [`i18n-message-catalog.md`](./i18n-message-catalog.md).

Full frontend standards: **[`frontend-standards.md`](./frontend-standards.md)** (binding).

---

## 10. Documentation and commits

| Surface | Language | Naming |
| --- | --- | --- |
| Public docs, OpenAPI, API errors | English (ADR 0008) | Use glossary canonical terms |
| Issues, PRs, commit bodies | English | Prefer glossary term on first mention |
| Commit subject | Conventional Commits + `(#issue)` | See [`commit-conventions.md`](./commit-conventions.md) |
| ADR file | `NNNN-kebab-title.md` | `0010-embed-public-api-security.md` |

When adding or renaming any identifier, update
[`terminology.md`](../explanation/terminology.md) in the same PR; if it is a product
concept, also update [`glossary.md`](../explanation/glossary.md).

---

## 11. Prohibited patterns (block merge)

- **Typos or spelling variants** of any term registered in `terminology.md`
  (e.g. `inquiry` for `submission`, `contactForm` in JSON) — blocks merge
- **Unregistered identifiers** — an entity, status, field, slug, or `operationId` not in
  `terminology.md` without adding it in the same PR
- Layer-first folders (`src/Handlers/`, `src/Repositories/`, `src/UseCases/`)
- SQL outside `Pdo*Repository`
- camelCase in public JSON property names
- Renaming shipped `operationId` values
- Locale strings keyed by anything other than `ja` / `en` (ADR 0011)
- PII (email) in URLs / query strings (ADR 0010)
- Concierge / Invoice / Deal / Clear domain logic in this repo (scope-contract DON'T)

---

## Verification

```bash
composer check     # PHPUnit + PHPStan + php-cs-fixer (when runtime lands)
composer openapi   # OpenAPI contract validation
composer mcp       # MCP catalog validation
```

Review checklists: [`../review/`](../review/).

Last updated: 2026-06-04
