# Privacy and Spam Compliance (binding)

**Status: binding for engineering.** This is not legal advice. Operators remain
responsible for privacy notices, lawful basis, and retention policies on their sites.

---

## Personal data Contact processes

| Data | Typical source | Engineering rule |
| --- | --- | --- |
| Name, email, phone, free text | Visitor submission | Store org-scoped; encrypt secrets at rest when configured |
| IP address, user agent | Request metadata | Store for abuse investigation; **exclude from MCP/export by default** |
| Attachment bytes | Optional file field | Virus-scan hook (Phase 3+); size/type allowlist |

---

## DO — engineering obligations

| # | Rule |
| --- | --- |
| P1 | **Purpose limitation** — collect only fields defined on the form schema |
| P2 | **Consent copy** — optional `consent_label` + `consent_required` per form (embed shows checkbox when set) |
| P3 | **Retention** — configurable per-organization retention days; purge job deletes expired submissions (audit log retains metadata) |
| P4 | **Export / delete** — operator can export CSV and delete submission (soft-delete → hard-delete after grace per ADR) |
| P5 | **Rate limiting** on `POST /public/.../submissions` per IP + per form id |
| P6 | **Honeypot** field support on every public form |
| P7 | **Allowed origins** list per form; reject cross-site posts not on list (CORS + server-side check) |
| P8 | **No secrets in notifications** — Slack/Chatwork templates use field summaries, not full attachment bytes |
| P9 | **Service tokens** scoped per sibling handoff; rotatable in admin |
| P10 | **Audit** every admin view of submission containing email (who accessed when) — Phase 2+ |

---

## DON'T

| # | Rule |
| --- | --- |
| N1 | Do not log raw submission bodies to application info logs |
| N2 | Do not include visitor email in URL query params on redirects |
| N3 | Do not enable public embed without TLS in production docs/checklist |
| N4 | Do not ship marketing newsletter lists inside Contact (not an ESP) |

---

## Spam and abuse

- Honeypot + rate limit required on public endpoints (MVP).
- Optional Akismay-style hook via ADR later — not MVP.
- Operators can mark `spam` status; spam submissions skip sibling handoff.

---

## AI / MCP

- MCP read tools return **redacted** payloads unless `include_pii=true` on admin tool (audit logged).
- No MCP tool sends email or posts to Slack on behalf of the operator without explicit write tool + confirmation token (Phase 4+).

---

## Related

- [`scope-contract.md`](./scope-contract.md)
- ADR 0010 (embed security)
- [`../review/compliance.md`](../review/compliance.md)

Last updated: 2026-06-03
