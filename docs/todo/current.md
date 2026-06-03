# Current TODO

**Phase 0 — Governance** ✅ complete on `main` (2026-06-03)
**Phase 1 — Runtime foundation** 🚧 in progress (2026-06-04)

## Phase 1 progress

- [x] Runtime scaffold — NENE2 app, `GET /health`, composer, tooling, Docker 89xx (#20 → #21)
- [x] Multi-tenant **Organization** domain + DB + migrations (#22 → #23)
- [x] Tenant **resolution** middleware + strategies (ADR 0014) (#24 → #25)
- [x] Auth: JWT login + `Role`/`Capability` RBAC + User domain (ADR 0006) (#28 → #29)
- [ ] Organization-scoped user management (admin CRUD; bootstrap via `tools/create-user.php` for now)
- [ ] ContactForm + FormField domain (admin CRUD)
- [ ] Public embed: schema + submit endpoints (org via `public_form_key`, ADR 0010)
- [ ] Submission inbox + AuditRecorder (ADR 0013)
- [ ] OpenAPI 3.1 baseline + `composer openapi`

Verified locally: `composer check` green (16 tests); `GET /health` 200; `/admin/organizations`
CRUD (201/409/422/200/404) on SQLite; tenant resolution active on non-bypass routes;
JWT login + RBAC (401 no-token / 200 superadmin / 403 editor-forbidden).

## Phase 0 checklist

- [x] Repository scaffold (README, LICENSE, AGENTS, CLAUDE, Cursor rules)
- [x] Scope contract, embed spec, privacy compliance, terminology
- [x] ADRs 0001, 0002, 0006, 0007, 0008, 0009, 0010, 0011 (bilingual ja/en scope)
- [x] Sibling integration map + draft handoff contracts
- [x] GitHub Issue #1 — governance on `main` (https://github.com/hideyukiMORI/nene-contact)
- [ ] Add NeNe Contact row to publication-strategy family copy (optional follow-up)

## Next up

- [ ] ContactForm/FormField + Submission domains (org-scoped; AuditRecorder)
- [ ] Public embed: schema + submit endpoints (org via `public_form_key`)
- [ ] OpenAPI 3.1 baseline

## Handoff notes

- Concierge boundary: ADR 0009 — no scenario engine in Contact.
- Locale scope: ADR 0011 — bilingual `ja`/`en` only; `contact_form` carries `locales[]` + `default_locale`.
- Invoice handoff: draft contract in `docs/integrations/invoice-handoff-contract.md`; awaits Invoice `/api/*` endpoints.
- Local ports: API **8900**, phpMyAdmin **8901**, MySQL **3391**.

Last updated: 2026-06-04
