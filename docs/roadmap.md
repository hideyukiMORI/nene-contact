# Roadmap

NeNe Contact — embeddable contact forms on NENE2.

This roadmap is a milestone-driven path to the **GOAL** and **Definition of Done
(A1–A8)** in [`explanation/scope-contract.md`](./explanation/scope-contract.md). Every
milestone is delivered within the binding
[`explanation/data-protection-compliance.md`](./explanation/data-protection-compliance.md)
charter (APPI / Japan law only); where any goal conflicts with the charter, compliance
wins (ADR 0012).

## Where we are (2026-06-04)

- **Phase 0 — Governance** ✅ complete on `main` (2026-06-03).
- **Phase 1 — Runtime foundation** 🚧 ~95%: org, tenant resolution, JWT/RBAC, audit,
  contact-form CRUD, public `schema`/`submit`, rate limiting, status workflow + notes,
  CSV export, email notification, OpenAPI 3.1 gate. CI green.
- **Binding compliance gaps** identified (not yet implemented): consent, retention/purge,
  data-subject rights, prohibited-field registry, channel-secret encryption review.
  These are MVP-required and acceptance-gating — tracked as **M2**, not deferred.

Implementation tracking: GitHub Issues. Per-milestone detail: [`milestones/`](./milestones/).

## Milestones to GOAL

| ID | Milestone | Phase | Theme |
| --- | --- | --- | --- |
| [M1](./milestones/m1-runtime-foundation.md) | Runtime foundation close-out | 1 | org-scoped user management |
| [M2](./milestones/m2-compliance-hardening.md) | Compliance hardening (binding gap closure) | 1–2 | consent, prohibited fields, retention, DSR, secrets |
| [M3](./milestones/m3-forms-embed-mvp.md) | Forms + embed MVP | 2 | admin SPA, builder, inbox UI, `embed.js` |
| [M4](./milestones/m4-channels-webhooks.md) | Channels + webhooks | 3 | Slack/Chatwork dispatch, signed webhooks, attachments |
| [M5](./milestones/m5-sibling-handoff.md) | Sibling handoff | 3 | Upstream clients, Deal/Vault, SubmissionLink + retry |
| [M6](./milestones/m6-ai-mcp-siblings.md) | AI/MCP + deeper siblings | 4 | MCP read/write, Invoice/Records/Concierge |
| [M7](./milestones/m7-ga-acceptance.md) | GA / acceptance | 4 | A1–A8 pass, operator docs, prod `embed.js` build |

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
