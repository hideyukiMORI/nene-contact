# Terminology Registry (binding)

**Single source of truth** for identifiers in NeNe Contact: PHP, OpenAPI, JSON, DB, MCP, and UI routes.

Add a row in the **same PR** that introduces a new identifier. Typos and unregistered terms block merge.

---

## 1. Product and repo

| Term | Spelling | Notes |
| --- | --- | --- |
| Product name | **NeNe Contact** | Not "NeneContact" in prose |
| Repository | `nene-contact` | |
| PHP namespace | `NeneContact\` | |

---

## 2. Core domain entities

| Concept | JSON / DB | PHP class pattern |
| --- | --- | --- |
| Form definition | `contact_form` | `ContactForm` |
| Public embed key | `public_form_key` | string on `contact_form` |
| Field definition | `form_field` | `FormField` |
| Visitor submission | `submission` | `Submission` — not `inquiry`, `message`, `lead` |
| Operator note | `submission_note` | `SubmissionNote` |
| Notification config | `notification_channel` | `NotificationChannel` |
| Handoff record | `submission_link` | `SubmissionLink` |

---

## 3. Layer suffixes

| Layer | Suffix | Example |
| --- | --- | --- |
| HTTP entry | `Handler` | `CreateSubmissionHandler` |
| Business logic | `UseCase` | `CreateSubmissionUseCase` |
| Persistence contract | `RepositoryInterface` | `SubmissionRepositoryInterface` |
| PDO impl | `PdoSubmissionRepository` | |

Forbidden: `Controller`, `Service`, `Manager`, `Repo`.

---

## 4. Submission status values

| Value | Meaning |
| --- | --- |
| `open` | New, untouched |
| `in_progress` | Operator working |
| `resolved` | Closed successfully |
| `spam` | Marked spam; no handoff |

---

## 5. Field types (`form_field.field_type`)

| Value | Meaning |
| --- | --- |
| `text` | Single line |
| `email` | Email with validation |
| `textarea` | Multi line |
| `select` | Options list |
| `checkbox` | Boolean consent or flag |
| `file` | Attachment (bounded) |
| `honeypot` | Anti-spam hidden field |

---

## 6. Notification channel types

| Value | Transport |
| --- | --- |
| `email` | SMTP / mailer |
| `slack` | Slack incoming webhook |
| `chatwork` | Chatwork API |

---

## 7. Embed / public API

| Term | Spelling |
| --- | --- |
| Embed script path | `/embed.js` |
| Public schema path | `/public/forms/{public_form_key}/schema` |
| Public submit path | `/public/forms/{public_form_key}/submissions` |
| Trigger attribute | `data-trigger` values: `floating`, `button`, `inline` |

---

## 8. JSON naming

- **snake_case** for all JSON request/response properties.
- IDs: `{resource}_id` (e.g. `submission_id`, `contact_form_id`).

---

## 9. Environment variables (planned)

| Variable | Purpose |
| --- | --- |
| `NENE_CONTACT_PORT` | Local HTTP (default `8900`) |
| `NENE_INVOICE_API_BASE_URL` | Handoff upstream |
| `NENE_INVOICE_SERVICE_TOKEN` | Scoped write to Invoice `/api/*` |
| `NENE_DEAL_API_BASE_URL` | Handoff upstream |
| `NENE_DEAL_SERVICE_TOKEN` | Scoped write to Deal |
| `NENE_VAULT_API_BASE_URL` | Attachment archive |
| `NENE_RECORDS_API_BASE_URL` | Read-only select options |

---

## 10. MCP tool naming

Pattern: `{verb}Contact{Resource}` — e.g. `listContactSubmissions`, `getContactSubmission`.

---

## 11. Locales (bilingual — ADR 0011)

| Term | Spelling | Notes |
| --- | --- | --- |
| Locale code | `ja`, `en` | The **only** supported product locales |
| Form locale set | `locales` | Non-empty subset of `{ja, en}` on `contact_form` |
| Form default | `default_locale` | Member of `locales`; embed fallback |
| Embed attribute | `data-lang` | Values `ja` / `en` only; must be in form `locales` |

Localized strings (labels, `select` options, `consent_label`, notification templates) are
objects keyed by `ja` / `en` only. No other locale code is a valid identifier.

---

Last updated: 2026-06-04
