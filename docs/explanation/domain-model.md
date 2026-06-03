# Domain Model (Phase 0)

High-level entities. Table DDL arrives with runtime scaffold.

## Tenant

- **Organization** — tenant boundary
- **User** — belongs to one or more organizations with role

## Contact core

- **ContactForm** — `organization_id`, name, `public_form_key`, `locales[]` (subset of `{ja, en}`), `default_locale` (member of `locales`), `allowed_origins[]`, retention days, status. Bilingual only — ADR 0011.
- **FormField** — belongs to form; `field_type`, `name`, `label` (per-locale `ja`/`en`), `required`, `options_json` (per-locale labels), sort order
- **Submission** — `contact_form_id`, `organization_id`, field values JSON, metadata (ip, user_agent), `status`, timestamps
- **SubmissionNote** — operator comments on a submission
- **NotificationChannel** — per form; `channel_type`, encrypted `config_json`
- **SubmissionLink** — optional sibling pointers (`deal_opportunity_id`, `invoice_client_id`, `vault_document_id`)

## Audit

- **AuditEvent** — append-only admin mutations (ADR follow-up)

## Boundaries

No `Invoice`, `Payment`, `BankTransaction`, or `Scenario` entities in Contact DB.

Locale-aware strings (labels, options, consent copy, notification templates) carry `ja`
and `en` keys only — bilingual scope, ADR 0011.

Last updated: 2026-06-04
