# Changelog

Notable changes to NeNe Contact. Adapted from [Keep a Changelog](https://keepachangelog.com/):
there are no semver release tags yet, so entries are keyed by date (newest first). Production
deploys are the de-facto releases. June 2026 is backfilled at milestone granularity; July 2026
at PR granularity. References are `(#issue → #PR)`.

## Unreleased — post-launch wave (2026-07-19 → 07-22, not yet in production)

Production deploys are frozen pending the records-embed 案1 unfreeze (hub gate); everything
below is on `main` only.

### Added

- Notification-channel admin CRUD completed — detail / edit / soft-delete + Chatwork/Slack
  config validation (#429 → #432).
- Operator test-send endpoint to surface silent dispatch failures (#430 → #436) and the
  manage-channels UI: edit/delete/detail, per-type help, client validation, test-send button
  (#431 → #437).
- **Email-wording wave a** — org self-settings surface, `Organization.sender_display_name`,
  組織設定 screen (#442 → #443).
- **Email-wording wave b** — org email signature + org-aware mail `From`/signature wiring
  (`OrganizationMailSettingsResolver`; org display name wins over env `MAIL_FROM`) (#444 → #445).
- **Email-wording wave c** — per-form admin-notification subject/body templates with variable
  interpolation and a Japanese default (#446 → #447); dynamic per-field template variables
  (#450 → #451).
- Embed form submitting spinner (送信中…) + completion emphasis (#452 → #453).
- Audited reset-password CLI for admin lost-password recovery (#410 → #411) — production
  rollout pending (deploy freeze; dry-run verification required first).

### Fixed

- `{message}` admin-template variable no longer injects the English header line (#448 → #449).
- Submission detail view preserves textarea line breaks (#440 → #441).
- Channel row actions laid out horizontally (#438 → #439).
- npm audit high advisories resolved via `package.json` overrides (#433 → #434).

### Docs / CI / tests

- P3 — public operational logs (`docs/todo`, `docs/daily`) retired to the private
  `nene-origin/internal-docs/contact/` mirror; live references repointed (#423 → #424,
  #425 → #426).
- Security controls index + front-end attack-surface map (#421 → #422).
- Frontend unit tests: audit-event mapper (#413 → #414), i18n `t()` resolution (#415 → #416),
  media hooks via MSW (#417 → #418); phpunit declares `APP_ENV=test` (#427 → #428).

## 2026-07-17/18 — AYANE production launch 🚀

`ayane.co.jp` apex launched 2026-07-18 with the embedded form on `/contact/` and `/inquiry/`;
the operator console runs at `contact.ayane.co.jp`.

- AYANE brand skin for the embed — self-hosted fonts, solid hero, success token (#402 → #403).
- Stable `/embed/embed.js` alias that follows the latest hashed build (#404 → #405).
- `button` trigger mode — an in-flow button anywhere on the page opens the modal (#406 → #407).
- A1 purity refactor — hooks→model via `nene2-a1-hooks-to-model` codemod (#400 → #401).

## 2026-07-17 — records-embed contract (案1, PR ①–④)

First milestone of the native records embed: Contact issues service tokens that sibling
products use against a unified `/api` surface.

- `service_tokens` registry persistence primitive (#386 → #387).
- Token issue/revoke API + unified `/api` auth dispatcher + `first_party` ingest (#388 → #389).
- Records-embed contract documentation + OpenAPI for service tokens (#390 → #391).
- Service-token admin SPA — issue / list / revoke (#392 → #393); records developer quickstart
  (#394 → #395).

## 2026-07-13 → 07-16 — production hardening + server tooling

- Hosted single-form page `GET /form/{public_form_key}` (#382 → #383).
- Server-side form provisioning CLIs — create (#362 → #363) and update (#378 → #379).
- `composer.lock` tracked and pinned to NENE2 v1.11.0 (#380 → #381); frontend adopts the
  `@hideyukimori/nene2-client` transport (#373 → #374); self-implemented `X-Authorization`
  fallback replaced with the NENE2 standard opt-in (#375 → #376).
- Frontend CI paths filter dropped (#396 → #397); i18n merge-gate claim corrected in
  CLAUDE.md (#398 → #399); README status table + ports unified (#371 → #372).

## 2026-07-05 → 07-11 — production deploy enablement (contact.ayane.co.jp)

The wave that took the app to its first production host (heteml).

- Sender auto-reply on public submit (#360 → #361); public form reader loads autoreply
  config (#364 → #365).
- Bearer token recovery when the front proxy strips `Authorization` (#366 → #367);
  cache-control headers for hashed assets + revalidated shells (#368 → #369).
- NENE2 consumed from Packagist `^1.10` (#358 → #359); GitHub Actions backend + frontend CI
  (#356 → #357); MySQL host port corrected to 3392 (#354 → #355).
- NENE2 conformance linter wired into `composer check` (#352 → #353); NENE2 Clock (#350 → #351)
  and Pagination (#348 → #349) adoption; JWT secret fail-closed in production (#345) via
  `GuardedJwtSecretResolver` (#347).

## 2026-06-25 — builder audit HIGH fixes + production embed build

Driven by the 6-persona form-builder audit (#308 → #325).

- Production `embed.js` build — minified, content-hashed, SRI manifest (#330 → #331); install
  snippet emits the hashed filename + SRI (#334 → #335); configurable snippet host + dev-server
  proxy (#327 → #328/#329).
- Submission-detail handoff buttons — Deal / Invoice / Vault + retry (#315 → #340); builder
  choice-option import from Records (#316 → #341).
- Bilingual ja/en field & choice labels via an editing-locale toggle (#314 → #342); form and
  field duplication (#317 → #338).
- Security: `hero.media` allowlisted server-side (#323 → #332). A11y: icon-only/destructive
  buttons named (#311 → #337). Per-field server validation errors surfaced (#318 → #333);
  responsive builder inspector drawer (#313 → #343); phone-type label key (#309 → #336);
  not-yet-wired toggles disabled (#324 → #339); Vite dev server pinned to port 8902
  (#304 → #305).

## 2026-06-10 → 06-14 — Pro Console, builder & appearance sprint (#110–#303)

Full console UX push at milestone granularity:

- **Pro Console design system** — reskin of every admin screen (#172–#191), responsive shell
  (#210/#212), centered app window (#206), DirAC login redesign (#272).
- **Inbox** — two-pane rebuild (#194), pager/status/sort (#224), detail redesign (#237),
  `source_url` (#227) + `locale` (#236) capture, staged reception-metadata disclosure with
  audited reveal (ADR 0018; #226–#234).
- **Audit log** — admin list API (#218), viewer to spec (#220/#222), humanized labels (#242),
  org-create audit gap fix (#214) + UseCase-audited merge gate (#216).
- **Form builder spec v1** — `fb-*` rebuild (#246), field config UI (#258), choice management
  (#254), date/phone types (#244), custom public key (#252), full-screen 4-tab chrome (#294),
  honest dirty-state save indicator (#298).
- **Appearance Studio v2** — per-form `appearance_json` (#280), nested-token model (#286),
  embed render v2 (#288), Studio UI (#290), per-org media library (#292).
- **Submit experience** — submit label / completion message / post-submit action (#296),
  builder-wired notification channels (#300), conversational chat mode in the embed (#302).
- **Self-service** — Account password change (#278); unwired Settings screen removed (#276).

## 2026-06-04 → 06-14 — M3: forms + embed MVP

- Per-form CORS (#93), `embed.js` widget — floating/button/inline, schema-driven, consent +
  file upload (#95), admin SPA scaffold + login (#97), form list/builder/inbox/channels/users
  screens (#99–#109), form edit / soft-delete / detail (#196–#200).

## 2026-06-04 — backend foundation mega-wave (M1, M2, M4, M5, M6)

- **M1 runtime foundation** — NENE2 scaffold, multi-tenant Organization + tenant resolution
  (ADR 0014), JWT/RBAC (ADR 0006), audit infrastructure (ADR 0013), ContactForm/Submission
  domains, rate limiting, status workflow + notes, CSV export, email notification, OpenAPI 3.1
  gate, org-scoped user management (#20–#63).
- **M2 compliance hardening** — prohibited-field registry, consent, soft-delete, retention +
  purge, channel-secret encryption (libsodium), correction right (#66–#77); no-physical-deletion
  policy — PII erase-in-place, DB user without `DELETE` (ADR 0016; #80/#82).
- **M4 channels + attachments** — Slack/Chatwork dispatch (#84), signed HMAC webhooks (#86),
  attachment upload/purge (#88/#90).
- **M5 sibling handoff** — Contact → Deal opportunity (#112) and Contact → Vault archive
  (#116): idempotent, retrying, non-destructive, audited.
- **M6 AI/MCP** — machine-key agent read surface `/api/*` (#118), MCP stdio server (#120),
  Concierge ingest (#122), MCP write with two-step confirmation token (#124), Invoice draft
  handoff (#126), Records read-only options (#128).
- **M7 groundwork** — A1–A8 acceptance audit, verdict PASS (#130); operator guide (#132).

## 2026-06-03 — Phase 0: governance

- Scope contract, binding data-protection compliance charter (APPI), terminology SSOT,
  ADRs 0001–0011, sibling integration map, bilingual ja/en scope (#1–#18).

---

Last updated: 2026-07-22.
