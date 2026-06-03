# Scope Contract — GOAL / DO / DON'T (binding)

**Status: binding (non-negotiable).** Charter for NeNe Contact.

Read first: [ADR 0009](../adr/0009-separate-from-nene-concierge.md),
[`embed-widget-spec.md`](./embed-widget-spec.md),
[`privacy-and-spam-compliance.md`](./privacy-and-spam-compliance.md),
[`../integrations/sibling-products.md`](../integrations/sibling-products.md).

---

## GOAL

> **NeNe Contact lets an operator publish embeddable contact forms on any site,
> receive submissions in one inbox, notify the right channels, and optionally hand
> qualified leads to sibling apps — without sharing databases or becoming a CRM,
> chatbot, or billing system.**

Concretely:

1. Operator builds a **contact form** from field parts in admin.
2. Operator copies a **one-line embed script** (floating, button, or inline trigger).
3. Visitors submit on the host site; payloads land in Contact's **submission inbox**.
4. Notifications fire to configured **email / Slack / Chatwork** (and optional signed webhooks).
5. Operators triage (status, notes, export); optional **HTTP handoff** creates drafts in Deal or Invoice.
6. AI agents use **OpenAPI + MCP** on Contact HTTP only — never sibling databases.

---

## DO — Contact owns these

| # | Contact does |
| --- | --- |
| D1 | **Contact form** definition (fields, validation rules, locales, allowed origins) |
| D2 | **Public embed** script + hosted form UI (CORS, rate limit, honeypot, size cap) |
| D3 | **Submission** capture, storage, inbox list/detail, operator notes |
| D4 | **Submission status** workflow (e.g. `open` → `in_progress` → `resolved` / `spam`) |
| D5 | **Notification channels** per form (email, Slack, Chatwork) with templates |
| D6 | **Outbound signed webhooks** on new submission (operator-configured URL) |
| D7 | **Multi-tenant RBAC** (ADR 0006) — org-scoped forms and submissions |
| D8 | **Audit trail** on admin mutations (form edits, status changes, handoff retries) |
| D9 | **OpenAPI** for admin, public submit, and service (`/api/*`) surfaces |
| D10 | **MCP tools** mapped to Contact OpenAPI (read first; write with auth + audit) |
| D11 | **Handoff links** storing sibling IDs (`deal_opportunity_id`, `invoice_client_id`, …) after HTTP success |
| D12 | **File attachments** on submissions (size/type limits; optional Vault handoff Phase 3+) |

---

## DON'T — Contact must never do these

| # | Contact must NOT | Belongs to |
| --- | --- | --- |
| X1 | Run **visual chat scenarios** or step-based conversation state | **NeNe Concierge** |
| X2 | Issue quotes, invoices, PDFs, or payment records | **NeNe Invoice** |
| X3 | Reconcile bank deposits or send dunning | **NeNe Clear** |
| X4 | Normalize bank CSV | **NeNe Profile** |
| X5 | Archive received vendor PDFs under 電帳法 rules | **NeNe Vault** |
| X6 | Own full **CRM pipeline** (stages, forecast, kanban SSOT) | **NeNe Deal** |
| X7 | Replace **Records** as CMS or entity platform | **NeNe Records** |
| X8 | **Share a database** with any sibling | — (HTTP only, ADR 0002) |
| X9 | **Auto-send** operator email replies without explicit human action (MVP) | — (draft-only AI Phase 4+) |
| X10 | **Sell or resubmit** visitor data to third parties by default | Privacy policy / operator duty |
| X11 | Bypass **allowed-origin** or **rate limits** for public submit | Security boundary |
| X12 | Store **raw card numbers** or government ID numbers in form fields | Out of scope — prohibit field types |
| X13 | Embed **arbitrary JavaScript** from operators in the widget (XSS) | Config is declarative JSON only |
| X14 | Support **locales beyond `ja` / `en`** or ship a general i18n framework | Out of scope — bilingual only (ADR 0011) |

---

## Concierge vs Contact (binding clarification)

| | Concierge | Contact |
| --- | --- | --- |
| UX | Guided multi-step chat | Form fields (static or progressive UI only inside Contact) |
| State | Scenario session, branches | Submission record |
| Best for | Qualification flows, product finder | Contact us, support, lead capture, document request |
| Integration | Concierge HTTP action **may POST** a submission to Contact | Contact does not execute Concierge graphs |

---

## Sibling handoff (summary)

Contact is **downstream SSOT for submissions**. Siblings remain SSOT for their domains.

| Direction | Allowed |
| --- | --- |
| Contact → Invoice | Draft client / optional quote (service token, idempotent) — Phase 4+ |
| Contact → Deal | Create opportunity from submission — Phase 3+ |
| Contact → Vault | Store attachment as received document — Phase 3+ |
| Contact → Records | Read-only entity lists for select options — Phase 4+ |
| Concierge → Contact | Ingest submission via public or service API — Phase 4+ |

Details: [`../integrations/sibling-products.md`](../integrations/sibling-products.md).

---

## Related

- [`privacy-and-spam-compliance.md`](./privacy-and-spam-compliance.md)
- [`embed-widget-spec.md`](./embed-widget-spec.md)
- ADR 0002, ADR 0006, ADR 0009, ADR 0010, ADR 0011

Last updated: 2026-06-04
