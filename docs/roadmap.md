# Roadmap

NeNe Contact — embeddable contact forms on NENE2.

This roadmap is a milestone-driven path to the **GOAL** and **Definition of Done
(A1–A8)** in [`explanation/scope-contract.md`](./explanation/scope-contract.md). Every
milestone is delivered within the binding
[`explanation/data-protection-compliance.md`](./explanation/data-protection-compliance.md)
charter (APPI / Japan law only); where any goal conflicts with the charter, compliance
wins (ADR 0012).

## Where we are (2026-07-22)

**In production since 2026-07-18** 🚀 — the operator console runs at `contact.ayane.co.jp`
and the embedded form is live on the `ayane.co.jp` apex (`/contact/`, `/inquiry/`). Production
deploys are currently frozen pending the records-embed rollout gate; work merged after the
launch (notification-channel CRUD completion + test-send, email-wording waves a–c, embed
submit spinner, reset-password CLI) is on `main` only. See [`CHANGELOG.md`](../CHANGELOG.md).

- **Phase 0 — Governance** ✅ complete (2026-06-03).
- **Phase 1 — Runtime foundation** ✅ complete: org, tenant resolution, JWT/RBAC, audit,
  contact-form CRUD, public `schema`/`submit`, rate limiting, status workflow + notes,
  CSV export, email notification, OpenAPI 3.1 gate, org-scoped user management (M1).
- **M2 Compliance hardening** ✅: consent, prohibited-field registry, retention + purge,
  data-subject delete/correct, channel-secret encryption.
- **No-physical-deletion policy** ✅ ([ADR 0016](./adr/0016-no-physical-deletion-pii-erase-in-place.md)):
  records are soft-deleted / append-only; PII is erased in place; the DB user has no `DELETE`.
- **M4 Channels + webhooks + attachments** ✅: Slack/Chatwork dispatch, signed webhooks, file attachments.
- **M3 Forms + embed MVP** ✅ (MVP complete 2026-06-14): `embed.js` widget ✅; admin console
  (React/TS/Vite → `public_html/console/`, served at `/console/`) with login, form builder
  (dnd-kit, rebuilt to spec v1), inbox two-pane (status + notes + audited metadata reveal),
  channels, users, audit-log viewer ✅. **Appearance Studio v2** (per-form theming, 3 modes,
  HERO, media library) landed beyond the MVP bar. See the private
  `nene-origin/internal-docs/contact/todo/current.md` (operational logs moved there in P3).
- **M5 Sibling handoff** ✅: Contact → Deal opportunity handoff + Contact → Vault attachment
  archive (`src/Upstream/`, `submission_links`, idempotent, retry, non-destructive, audited);
  submission-detail handoff buttons (Deal / Invoice / Vault + retry) landed 2026-06-25.
- **M6 AI/MCP** ✅: agent read surface `/api/*`, local MCP stdio server, Concierge ingest
  (`source=concierge`, one inbox), MCP write tools behind a two-step confirmation token, the
  Contact → Invoice draft-client handoff, and Contact → Records read-only select options.
- **M7 GA / acceptance** 🚧: A1–A8 verified with code evidence
  ([`review/acceptance-A1-A8.md`](./review/acceptance-A1-A8.md), verdict PASS) + operator guide
  ([`operations/operator-guide.md`](./operations/operator-guide.md)); production `embed.js`
  build ✅ (minified, content-hashed, SRI manifest + stable `/embed/embed.js` alias); final
  compliance/governance/backend/frontend release reviews remain.
- **Post-MVP production waves (2026-07)**: sender auto-reply; server-side form CLIs; hosted
  single-form page `GET /form/{public_form_key}`; the **records-embed contract** (service-token
  registry + unified `/api` auth dispatcher + admin SPA, 案1 PR ①–④); AYANE brand skin +
  `button` trigger mode; notification-channel admin CRUD + operator test-send; email-wording
  waves a–c (`sender_display_name`, org signature, admin-notification templates + variables).

Implementation tracking: GitHub Issues. Per-milestone detail: [`milestones/`](./milestones/).

## Milestones to GOAL

| ID | Milestone | Phase | Status |
| --- | --- | --- | --- |
| [M1](./milestones/m1-runtime-foundation.md) | Runtime foundation close-out | 1 | ✅ done |
| [M2](./milestones/m2-compliance-hardening.md) | Compliance hardening (binding gap closure) | 1–2 | ✅ done |
| — | No physical deletion / PII erase-in-place (ADR 0016) | 2 | ✅ done |
| [M4](./milestones/m4-channels-webhooks.md) | Channels + webhooks + attachments | 3 | ✅ done |
| [M3](./milestones/m3-forms-embed-mvp.md) | Forms + embed MVP (embed.js + admin console) | 2 | ✅ done |
| [M5](./milestones/m5-sibling-handoff.md) | Sibling handoff | 3 | ✅ done |
| [M6](./milestones/m6-ai-mcp-siblings.md) | AI/MCP + deeper siblings | 4 | ✅ done |
| [M7](./milestones/m7-ga-acceptance.md) | GA / acceptance | 4 | 🚧 A1–A8 verified |

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
- Private `nene-origin/internal-docs/contact/todo/current.md` (live work status, P3)
- [`../CHANGELOG.md`](../CHANGELOG.md)

Last updated: 2026-07-22
