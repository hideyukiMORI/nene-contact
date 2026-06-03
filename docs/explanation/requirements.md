# Requirements (Phase 0 — draft)

Functional requirements derived from the scope contract. Implementation tracking lives in GitHub Issues.

## Must (MVP)

- [ ] Multi-tenant organizations and JWT admin auth (ADR 0006)
- [ ] Contact form CRUD (fields: text, email, textarea, select, honeypot)
- [ ] Public embed script + schema + submit endpoints per embed spec
- [ ] Submission inbox (list, detail, status, operator notes)
- [ ] Notification: email + one of Slack / Chatwork
- [ ] Allowed origins per form; rate limiting on public POST
- [ ] OpenAPI 3.1 + `composer openapi` gate
- [ ] MCP catalog: read tools for forms and submissions
- [ ] Audit log on admin mutations

## Should (Phase 2–3)

- [ ] File attachment field with size/type caps
- [ ] Signed outbound webhooks on new submission
- [ ] CSV export of submissions
- [ ] Handoff to NeNe Deal (opportunity create)
- [ ] Handoff to NeNe Invoice (draft client)
- [ ] Concierge ingest via service API

## Won't (this product)

- Chat scenario editor
- Invoice PDF, payment, reconciliation, bank import
- Records entity authoring
- Vault retention logic (only HTTP handoff of bytes)

## Related

- [`scope-contract.md`](./scope-contract.md)
- [`../roadmap.md`](../roadmap.md)

Last updated: 2026-06-03
