# Requirements (Phase 0 — draft)

Functional requirements derived from the scope contract. Implementation tracking lives in GitHub Issues.

> **Binding compliance.** Every requirement below is delivered within the
> [`data-protection-compliance.md`](./data-protection-compliance.md) charter (APPI / Japan
> law only, non-negotiable). A privacy/legal professional reviewing the system must find
> zero deviations. Because Contact handles **no money**, deviations need an **ADR** but
> **no professional sign-off gate** to proceed (ADR 0012). Acceptance is gated by the
> "Definition of Done & Professional Acceptance Standard" in
> [`scope-contract.md`](./scope-contract.md).

## Must (MVP)

- [ ] Multi-tenant organizations and JWT admin auth (ADR 0006)
- [ ] Contact form CRUD (fields: text, email, textarea, select, honeypot)
- [ ] Public embed script + schema + submit endpoints per embed spec
- [ ] Submission inbox (list, detail, status, operator notes)
- [ ] Notification: email + one of Slack / Chatwork
- [ ] Allowed origins per form; rate limiting on public POST
- [ ] Bilingual `ja` / `en` only — per-form `locales[]` + `default_locale`, embed `data-lang` resolution (ADR 0011)
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
- Locales beyond `ja` / `en` or a general i18n framework (ADR 0011)

## Compliance requirements (binding)

- [ ] Purpose limitation — only schema-declared fields collectible (charter §2)
- [ ] Consent — `consent_required` rejects without affirmative consent; consent stored immutably (charter §3)
- [ ] Prohibited fields — My Number / raw card numbers impossible; 要配慮個人情報 never silent default (charter §8)
- [ ] Data-subject rights — disclosure / correction / suspension / deletion + export, all auditable (charter §4)
- [ ] Retention — configurable; soft-delete → hard-delete after grace; audit metadata survives (charter §5)
- [ ] Audit — admin mutations + PII view/export logged, append-only (ADR 0013)
- [ ] Anti-spam — transactional notifications only; no marketing/ESP lists (charter §7)
- [ ] Security — public endpoints meet ADR 0010 in full

## Governance-phase acceptance

The Phase 0 governance bar is met when:

1. The binding compliance charter exists and is referenced from scope, requirements, and review.
2. Every DON'T row in `scope-contract.md` maps to a named sibling (HTTP-only, ADR 0002).
3. Every "Definition of Done & Professional Acceptance Standard" row (A1–A8) has a documented home.
4. ADRs 0010 (security), 0011 (locales), 0012 (compliance/no-gate), 0013 (audit) are accepted.

## Related

- **Compliance (binding):** [`data-protection-compliance.md`](./data-protection-compliance.md)
- [`scope-contract.md`](./scope-contract.md)
- [`../roadmap.md`](../roadmap.md)
- ADR 0010, ADR 0011, ADR 0012, ADR 0013

Last updated: 2026-06-04
