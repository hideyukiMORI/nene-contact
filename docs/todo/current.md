# Current TODO

**Phase 0 — Governance** ✅ complete on `main` (2026-06-03)
**Phase 1 — Runtime foundation** 🚧 in progress (2026-06-04)

## Phase 1 progress

- [x] Runtime scaffold — NENE2 app, `GET /health`, composer, tooling, Docker 89xx (#20 → #21)
- [x] Multi-tenant **Organization** domain + DB + migrations (#22 → #23)
- [x] Tenant **resolution** middleware + strategies (ADR 0014) (#24 → #25)
- [x] Auth: JWT login + `Role`/`Capability` RBAC + User domain (ADR 0006) (#28 → #29)
- [x] Audit infrastructure — AuditRecorder + `audit_events`, before/after (ADR 0013) (#34 → #35)
- [x] ContactForm + FormField domain (admin CRUD, org-scoped, audited) (#36 → #37)
- [x] Submission — public `schema`/`submit` (org via `public_form_key`) + inbox (ADR 0010) (#38 → #39)
- [x] Form builder GUI decision — custom UI + dnd-kit (ADR 0015) (#32 → #33)
- [ ] Organization-scoped user management (admin CRUD; bootstrap via `tools/create-user.php` for now)
- [ ] Submission status workflow (open→in_progress→resolved/spam) + operator notes
- [ ] Public embed: schema + submit endpoints (org via `public_form_key`, ADR 0010)
- [ ] Submission inbox + AuditRecorder (ADR 0013)
- [ ] OpenAPI 3.1 baseline + `composer openapi`

Verified locally: `composer check` green (19 tests); end-to-end on SQLite — login→JWT→RBAC
(401/200/403); `/admin/organizations` + `/admin/contact-forms` CRUD; public
`/public/forms/{key}/schema` 200 and `submit` 201 (allowed-origin 403, honeypot 204,
required 422); admin inbox (ip/ua excluded); audit rows written with PII redacted.

## Phase 0 checklist

- [x] Repository scaffold (README, LICENSE, AGENTS, CLAUDE, Cursor rules)
- [x] Scope contract, embed spec, privacy compliance, terminology
- [x] ADRs 0001, 0002, 0006, 0007, 0008, 0009, 0010, 0011 (bilingual ja/en scope)
- [x] Sibling integration map + draft handoff contracts
- [x] GitHub Issue #1 — governance on `main` (https://github.com/hideyukiMORI/nene-contact)
- [ ] Add NeNe Contact row to publication-strategy family copy (optional follow-up)

## Next up

- [ ] Rate limiting on public submit (ADR 0010 — NENE2 ThrottleMiddleware)
- [ ] Submission status workflow + operator notes; CSV export
- [ ] Email notification on new submission (Phase 2)
- [ ] OpenAPI 3.1 baseline + `composer openapi`
- [ ] Frontend: admin SPA + embed widget (Phase 2; builder per ADR 0015)

## Handoff notes

- Concierge boundary: ADR 0009 — no scenario engine in Contact.
- Locale scope: ADR 0011 — bilingual `ja`/`en` only; `contact_form` carries `locales[]` + `default_locale`.
- Invoice handoff: draft contract in `docs/integrations/invoice-handoff-contract.md`; awaits Invoice `/api/*` endpoints.
- Local ports: API **8900**, phpMyAdmin **8901**, MySQL **3391**.

Last updated: 2026-06-04
