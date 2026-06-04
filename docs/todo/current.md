# Current TODO

**Phase 0 — Governance** ✅ complete on `main` (2026-06-03)
**Phase 1 — Runtime foundation** ✅ complete on `main` (2026-06-04)
**M2 — Compliance hardening (binding gap closure)** ✅ complete on `main` (2026-06-04)
**No-physical-deletion policy (ADR 0016)** ✅ complete on `main` (2026-06-04)
**M4 — Channels + webhooks + attachments** ✅ complete on `main` (2026-06-04)
**M3 — Forms + embed MVP** 🚧 core landed on `main` (2026-06-04) — embed.js + admin SPA
**M5 — Sibling handoff** 🚧 Deal handoff landed (2026-06-04); Vault archive next

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

## M4 — Channels + webhooks + attachments ✅

- [x] Slack / Chatwork dispatch (per-channel sender + composite, best-effort) (#84 → #85)
- [x] Signed outbound webhook channel (HMAC-SHA256) (#86 → #87)
- [x] File attachments — upload/store/caps/scan-hook + admin list/download (audited) (#88 → #89)
- [x] Attachment retention erase-in-place + orphan cleanup (ADR 0016) (#90 → #91)

## M3 — Forms + embed MVP 🚧 (core landed)

- [x] Per-form CORS for public endpoints (embed prerequisite) (#93 → #94)
- [x] `embed.js` widget — floating/button/inline, schema-driven, consent + file upload (#95 → #96)
- [x] Admin SPA scaffold + login (React/TS/Vite → `public_html/admin/`) (#97 → #98)
- [x] Contact-form list (#99 → #100)
- [x] Submissions inbox list with paging (#101 → #102)
- [x] Submission detail — status update + notes (write pattern) (#103)
- [x] Form builder — palette + dnd-kit reorder + create (ADR 0015) (#104 → #105)
- [x] Notification channel management (#106 → #107)
- [x] User management (list / create / role+status) (#108 → #109)
- [ ] Follow-ups: form edit/delete, inbox delete/correct/CSV buttons, org-switch UI, `data-theme`

## M5 — Sibling handoff 🚧 (Phase 3)

- [x] Contact → Deal opportunity handoff — `src/Upstream/` Deal client, `submission_links`,
      idempotent (`external_reference = submission_id`), retry, non-destructive failure, audited (#112)
- [ ] Contact → Vault attachment archive (DO D12) — `src/Upstream/` Vault client, `vault_document_id`
- [ ] Admin SPA: handoff status + "Send to Deal" / retry button on the submission detail (follow-up)

Verified e2e (docker, MySQL): handoff trigger → outbound `POST /api/opportunities`
(Bearer token + `Idempotency-Key` + `external_reference`); success stores `deal_opportunity_id`
+ `handoff_status=succeeded`; unconfigured/failed → `failed` + `last_error`, submission intact;
retry is idempotent (single `submission_links` row, upsert — no DELETE, ADR 0016); RBAC 401
without a token; audit `handoff.created` / `handoff.retried` (ids only, no PII). Note: the
admin API is currently reached via the front controller directly — see the `.htaccess` follow-up.

## Next up

- [ ] **`.htaccess` SPA shadow fix** — the `/admin/*` SPA rewrite shadows the `/admin/*` API
      over apache (docker); decouple the SPA URL prefix from the API prefix (separate Issue)
- [ ] M5 Vault attachment archive (above)
- [ ] M6 MCP tool catalog over the OpenAPI surface (read-first)
- [ ] M7 GA acceptance (A1–A8), operator docs, production `embed.js` build

## Handoff notes

- Concierge boundary: ADR 0009 — no scenario engine in Contact.
- Locale scope: ADR 0011 — bilingual `ja`/`en` only; `contact_form` carries `locales[]` + `default_locale`.
- Invoice handoff: draft contract in `docs/integrations/invoice-handoff-contract.md`; awaits Invoice `/api/*` endpoints.
- Local ports: API **8900**, phpMyAdmin **8901**, MySQL **3391**.

Last updated: 2026-06-04
