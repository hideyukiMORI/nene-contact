# Roadmap

NeNe Contact — embeddable contact forms on NENE2.

This roadmap is a milestone-driven path to the **GOAL** and **Definition of Done
(A1–A8)** in [`explanation/scope-contract.md`](./explanation/scope-contract.md). Every
milestone is delivered within the binding
[`explanation/data-protection-compliance.md`](./explanation/data-protection-compliance.md)
charter (APPI / Japan law only); where any goal conflicts with the charter, compliance
wins (ADR 0012).

## Where we are (2026-06-04)

- **Phase 0 — Governance** ✅ complete (2026-06-03).
- **Phase 1 — Runtime foundation** ✅ complete: org, tenant resolution, JWT/RBAC, audit,
  contact-form CRUD, public `schema`/`submit`, rate limiting, status workflow + notes,
  CSV export, email notification, OpenAPI 3.1 gate, org-scoped user management (M1).
- **M2 Compliance hardening** ✅: consent, prohibited-field registry, retention + purge,
  data-subject delete/correct, channel-secret encryption.
- **No-physical-deletion policy** ✅ ([ADR 0016](./adr/0016-no-physical-deletion-pii-erase-in-place.md)):
  records are soft-deleted / append-only; PII is erased in place; the DB user has no `DELETE`.
- **M4 Channels + webhooks + attachments** ✅: Slack/Chatwork dispatch, signed webhooks, file attachments.
- **M3 Forms + embed MVP** 🚧: `embed.js` widget ✅; admin SPA (React/TS/Vite → `public_html/admin/`)
  with login, form builder (dnd-kit), inbox list/detail (status + notes), channels, users ✅.
- **Next:** M5 sibling handoff (Deal / Vault), M6 AI/MCP, then M7 GA acceptance (A1–A8).

Implementation tracking: GitHub Issues. Per-milestone detail: [`milestones/`](./milestones/).

## Milestones to GOAL

| ID | Milestone | Phase | Status |
| --- | --- | --- | --- |
| [M1](./milestones/m1-runtime-foundation.md) | Runtime foundation close-out | 1 | ✅ done |
| [M2](./milestones/m2-compliance-hardening.md) | Compliance hardening (binding gap closure) | 1–2 | ✅ done |
| — | No physical deletion / PII erase-in-place (ADR 0016) | 2 | ✅ done |
| [M4](./milestones/m4-channels-webhooks.md) | Channels + webhooks + attachments | 3 | ✅ done |
| [M3](./milestones/m3-forms-embed-mvp.md) | Forms + embed MVP (embed.js + admin SPA) | 2 | 🚧 core done |
| [M5](./milestones/m5-sibling-handoff.md) | Sibling handoff | 3 | ⏳ next |
| [M6](./milestones/m6-ai-mcp-siblings.md) | AI/MCP + deeper siblings | 4 | ⏳ |
| [M7](./milestones/m7-ga-acceptance.md) | GA / acceptance | 4 | ⏳ |

```
M1 ──> M2 ──> M3 ──> M4 ──> M5 ──> M6 ──> M7 (GOAL)
foundation  compliance  forms+    channels  sibling   AI/MCP   acceptance
close-out   hardening   embed MVP +webhooks handoff  +siblings  (A1–A8)
```

## Phase mapping (legacy phase names)

- **Phase 0: Governance** ✅ — charter, ADRs, scope contract, sibling drafts.
- **Phase 1: Runtime foundation** — multi-tenant org/auth, `GET /health`, OpenAPI, CI,
  admin JWT (M1) + binding compliance core (M2).
- **Phase 2: Forms + embed MVP** — form CRUD, public schema/submit, `embed.js`, inbox,
  email notification (M3).
- **Phase 3: Channels + handoff** — Slack/Chatwork, webhooks, Deal/Vault handoff (M4, M5).
- **Phase 4: Sibling depth** — Invoice draft client, Records select options, Concierge
  ingest, MCP write with audit (M6, M7).

## Not on roadmap (permanent DON'T — see scope-contract.md)

- Chat scenarios (Concierge); quotes/invoices/reconciliation (Invoice/Clear); bank CSV
  (Profile); document retention under 電帳法 (Vault); full CRM pipeline (Deal); CMS/entity
  authoring (Records); locales beyond `ja`/`en` or a general i18n framework (ADR 0011);
  shared databases with any sibling (ADR 0002).

## Related

- [`explanation/scope-contract.md`](./explanation/scope-contract.md) (GOAL / DO / DON'T / A1–A8)
- [`explanation/product-vision.md`](./explanation/product-vision.md) (North Star, MVP success)
- [`explanation/requirements.md`](./explanation/requirements.md)
- [`explanation/data-protection-compliance.md`](./explanation/data-protection-compliance.md) (binding)
- [`todo/current.md`](./todo/current.md)

Last updated: 2026-06-04
