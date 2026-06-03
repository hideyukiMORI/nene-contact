# Personal Data Protection Self-Review (binding)

**Binding.** Use for **any** change touching form fields, submissions, consent,
notifications, retention, exports, audit, security middleware, or MCP. If unsure whether a
change has compliance impact, **assume it does** and run this list.

Source of truth: [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md)
(charter) and [`../explanation/privacy-and-spam-compliance.md`](../explanation/privacy-and-spam-compliance.md)
(operational rules). Do not delete items to pass. Mark `N/A` only when genuinely not
applicable.

## Checklist

- [ ] Change reviewed against the compliance charter; compliance impact stated in the PR.
- [ ] **Purpose limitation** — only schema-declared fields collected; no enrichment beyond declared purpose.
- [ ] **Consent** — when `consent_required`, submit rejected without affirmative consent; checkbox not pre-checked; granted consent stored immutably (label + timestamp).
- [ ] **Prohibited data** — no My Number / raw card-number field types; 要配慮個人情報 not collectible by silent default; field types validated against the allowed registry (no operator JS).
- [ ] **Security (ADR 0010)** — allowed-origins server-side, rate limit per IP + form key, honeypot, body-size cap, no PII in URLs, CORS not `*` in prod.
- [ ] **Secrets** — channel config/tokens encrypted at rest; never in logs, notifications, or exports; no raw submission body in info logs.
- [ ] **Notifications** — transactional only (no marketing/ESP lists); templates use field summaries, not attachment bytes or secrets; accurate sender/reply path (特定電子メール法).
- [ ] **Retention/deletion** — configurable retention; soft-delete → hard-delete after documented grace; no accidental indefinite retention; audit metadata survives deletion.
- [ ] **Data-subject rights** — disclosure/correction/suspension/deletion + export are operator-reachable and auditable.
- [ ] **Audit (ADR 0013)** — admin mutations and PII view/export recorded (who/when/what); append-only; sanitized snapshots (no secrets/full PII).
- [ ] **MCP** — read tools redacted by default; `include_pii=true` audit-logged; no autonomous outbound action on personal data.
- [ ] **Cross-border (§9)** — no claim of GDPR/EU coverage; EU handling documented as operator responsibility.
- [ ] Any deviation from the binding charter carries an **ADR** (self-authority — no external sign-off gate, ADR 0012).

Last updated: 2026-06-04
