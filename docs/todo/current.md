# Current TODO

**Phase 0 — Governance** ✅ complete on `main` (2026-06-03)
**Phase 1 — Runtime foundation** ✅ complete on `main` (2026-06-04)
**M2 — Compliance hardening (binding gap closure)** ✅ complete on `main` (2026-06-04)
**Next: M3 — Forms + embed MVP** (Phase 2; see `docs/roadmap.md`, `docs/milestones/`)

## Phase 1 progress

- [x] Runtime scaffold — NENE2 app, `GET /health`, composer, tooling, Docker 89xx (#20 → #21)
- [x] Multi-tenant **Organization** domain + DB + migrations (#22 → #23)
- [x] Tenant **resolution** middleware + strategies (ADR 0014) (#24 → #25)
- [x] Auth: JWT login + `Role`/`Capability` RBAC + User domain (ADR 0006) (#28 → #29)
- [x] Audit infrastructure — AuditRecorder + `audit_events`, before/after (ADR 0013) (#34 → #35)
- [x] ContactForm + FormField domain (admin CRUD, org-scoped, audited) (#36 → #37)
- [x] Submission — public `schema`/`submit` (org via `public_form_key`) + inbox (ADR 0010) (#38 → #39)
- [x] Form builder GUI decision — custom UI + dnd-kit (ADR 0015) (#32 → #33)
- [x] Rate limiting on public submit — per IP + per form (ADR 0010) (#42 → #43)
- [x] Submission status workflow + operator notes (audited) (#44 → #45)
- [x] CSV export of the inbox (audited submission.exported) (#46 → #47)
- [x] Email notification channels + dispatch on submit (#48 → #49)
- [x] OpenAPI 3.1 baseline + `composer openapi` gate (#50 → #51)
- [x] Organization-scoped user management (admin CRUD, org-scoped, audited) (#62 → #63)
- [x] Local docker runtime fixes — `.htaccess` rewrite, entrypoint migrations, org bootstrap CLI (#56–#58)

## M2 — Compliance hardening ✅ (binding gap closure)

- [x] Prohibited-field registry — My Number/card structurally impossible (§8/A4) (#66 → #67)
- [x] Consent — `consent_required`/`consent_label`, submit rejected without consent, immutable record (§3) (#68 → #69)
- [x] Submission soft-delete — data-subject deletion right, audited, excluded from inbox (§4/§5) (#70 → #71)
- [x] Retention + purge job — `retention_days`, soft→hard delete after grace, dry-run default (§5) (#72 → #73)
- [x] Channel-secret encryption at rest — libsodium, fail-closed, no raw secrets exposed (§6) (#74 → #75)
- [x] Submission correction — data-subject correction right, purpose-limited, audited (§4) (#76 → #77)

Verified locally: `composer check` green (62 tests + phpstan 8 + cs + openapi); end-to-end on
MySQL (docker, fresh `up`) — login→JWT→RBAC (401/200/403); organization/contact-form/
notification-channel CRUD; **user admin CRUD** (create 201, duplicate 409, invalid 422,
self-modify 422, editor 403); public `schema` 200 + `submit` 201 (origin 403, honeypot 204,
required 422, rate-limit 429, **consent 422/201**); inbox list/detail/status/notes + CSV
export (ip/ua excluded); **soft-delete 204 + inbox exclusion**; **correction merge + 422**;
**retention purge** (soft-delete on expiry → hard-delete after grace, dry-run default); all
mutations + PII access audited with PII/secrets redacted (`user.*` carries no `password_hash`;
channel `config_json` stored as `v1:` ciphertext; consent/correction/purge audits carry no
raw values).

## Phase 0 checklist

- [x] Repository scaffold (README, LICENSE, AGENTS, CLAUDE, Cursor rules)
- [x] Scope contract, embed spec, privacy compliance, terminology
- [x] ADRs 0001, 0002, 0006, 0007, 0008, 0009, 0010, 0011 (bilingual ja/en scope)
- [x] Sibling integration map + draft handoff contracts
- [x] GitHub Issue #1 — governance on `main` (https://github.com/hideyukiMORI/nene-contact)
- [ ] Add NeNe Contact row to publication-strategy family copy (optional follow-up)

## Next up

- [ ] **M3 Forms + embed MVP** (Phase 2): admin SPA, form builder (dnd-kit, ADR 0015), inbox
  UI, `embed.js` widget — see `docs/milestones/m3-forms-embed-mvp.md`
- [ ] M4 Slack / Chatwork notification dispatch (channels stored; only email dispatched so far)
- [ ] M5 Sibling HTTP handoff (Deal / Vault) — Phase 3
- [ ] M6 MCP tool catalog over the OpenAPI surface (read-first)

## Handoff notes

- Concierge boundary: ADR 0009 — no scenario engine in Contact.
- Locale scope: ADR 0011 — bilingual `ja`/`en` only; `contact_form` carries `locales[]` + `default_locale`.
- Invoice handoff: draft contract in `docs/integrations/invoice-handoff-contract.md`; awaits Invoice `/api/*` endpoints.
- Local ports: API **8900**, phpMyAdmin **8901**, MySQL **3391**.

Last updated: 2026-06-04
