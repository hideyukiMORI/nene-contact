# Changelog

Notable changes to NeNe Contact. Adapted from [Keep a Changelog](https://keepachangelog.com/):
there are no semver release tags yet, so entries are keyed by date (newest first). Production
deploys are the de-facto releases. June 2026 is backfilled at milestone granularity; July 2026
at PR granularity. References are `(#issue → #PR)`.

## 2026-07-30 — export honesty + audit labels + M7 close-out (deployed to production)

Backend **and** console deploy to `contact.ayane.co.jp` from `main@8548c9c`. `phinx status`
reported **no pending migrations**, and `composer.lock`, `tools/`, `database/` and `index.php`
were unchanged, so the database and `vendor/` were untouched; the backend diff was eight files
under `src/`. Before the run, production `src/` was verified **byte-identical to the previously
deployed commit** (`ef931ab`) — the same aggregate checksum over all 391 files — so the deploy
started from the state the record claimed.

The console was **rebuilt including #539**, which changes `frontend/package.json` overrides and
is therefore a build input: the resulting bundle is *not* byte-identical to the one deployed on
07-29, and the byte-comparison check was re-based on the fresh local build instead. Publishing
order was again **new asset first → byte-compare → swap `index.html`**. Prod console went to
**`index-DhWnl8My.js`** (811,948 B; CSS unchanged at `index-6howia9n.css`). Rollback backups:
`~/contact-src-bak-20260730-005948.tgz` / `~/contact-console-bak-20260730-005948.tgz`.
References are `(#issue → #PR)`.

### Added

- **Truncated exports say so.** Both CSV exports stop at 10,000 rows, and until now nothing told
  anyone. `audit_event.exported` and `submission.exported` now also record **`total_matched`**,
  so `count < total_matched` marks a partial file — an auditor can no longer mistake "exactly
  10,000" for "10,000 of 40,000" after the fact — and the operator is warned **before** the
  download, while narrowing the filter is still possible (#531 → #532).

### Changed

- **Audit-action labels cover every registered action.** `actionLabel()` falls back to the raw
  identifier for unknown entity/verb pairs, so a missing dictionary entry breaks nothing and
  looks like the spec — three features had slipped through that way. The ja/en dictionaries were
  reconciled against terminology §9 rather than patching the two visible cases, and a test now
  pins that none of the 35 actions renders raw (#533 → #536).
- The `brace-expansion` override is **scoped per major** again (`@1`, `@2`, `@5`) instead of a
  single flat `^5.0.8`, which had put v5 under `minimatch@3` and broken it. `npm run audit` now
  runs `scripts/check-overrides.mjs` across **every copy on disk**, since a healthy hoisted copy
  says nothing about a nested one (#538 → #539).

### Fixed

- The audit list **refetches after an export**, so the operator's own `audit_event.exported`
  row appears without a manual reload (#535 → #537).
- CSV downloads are **named after the operator's date**, not UTC — `ExportFilename` centralises
  it for both exports, and the fix let one `date()` suppression be **removed** from the
  conformance baseline rather than added (#534 → #540).

### Docs

- **M7 closed.** The four release reviews were re-run against the release and all reached PASS,
  each recording what it left open — no reCAPTCHA, no duplicate-submission guard, one latent
  repository-scope risk (#544), one tag-removal asymmetry (#545) (#541 → #542, #543 → #546,
  #547 → #549, #548 → #550). Declaring GA remains a separate maintainer decision.
- Status surfaces, this changelog, and the branch-hygiene rules brought back in line with what
  had actually happened (#551 → #555, #552 → #556, #553 → #557).

### Verified on production

`src/` re-verified **byte-identical to `main@8548c9c`** after the sync (aggregate checksum over
392 files); the uploaded console bundle matched the local build by size and MD5 **before**
`index.html` was swapped, and again when fetched over HTTPS. All five canonical URLs 200
(`/health`, `/console/`, `/embed/embed.js`, plus `ayane.co.jp/contact/` and `/inquiry/`);
`/admin/audit-events/export`, `/admin/submissions/export` and `/admin/submissions` all **401**
unauthenticated; served JS/CSS are the real bundle, not the 557-byte shell; `/embed/embed.js`
unchanged at sha384 `6pU29afi…`, identical to the repository build. A real browser loads the
console, renders the login screen and reports **no failed requests and no page errors** — the
single console message is the expected 401 from the unauthenticated bootstrap call that
redirects to `/console/login`. Ten repeat `/health` calls and a delayed re-probe were all 200,
and no PHP error log was created.

**Not verified here:** every authenticated path — the export filename, the truncation notice and
the label dictionary can only be seen while logged in, and this deploy was checked from outside
the session boundary. Those await an operator's own run.

## 2026-07-29 — audit-log CSV export + audit gate + inbox paging fix (deployed to production)

Backend **and** console deploy to `contact.ayane.co.jp` from `main@ef931ab` (maintainer
confirmation obtained before the run; hub independent double-check passed). The first backend
deploy since 2026-07-21. `phinx status` showed **no pending migrations**, and `composer.lock`,
`tools/`, and `index.php` were unchanged, so neither the database nor `vendor/` was touched —
the backend diff was the seven files of #523. The console was published in the order
**new assets first → byte-compare → swap `index.html`**, so `index.html` never pointed at an
asset that was not yet on the server. Prod console went to **`index-PrKVxQqt.js`** (CSS
unchanged at `index-6howia9n.css`). Rollback backups on the server:
`~/contact-src-bak-20260729-034049.tgz` / `~/contact-console-bak-20260729-034049.tgz`.
References are `(#issue → #PR)`.

### Added

- **Audit-log CSV export** — `GET /admin/audit-events/export`, organization-scoped and behind
  `ViewAuditLog`, honoring the on-screen `q` / `from` / `to` filter through the same
  `AuditEventFilter::fromQueryParams()` the list handler uses, so the file and the screen cannot
  drift apart. The export **is itself audited** as `audit_event.exported` carrying only
  `{count, filter}` — never the exported content (ADR 0013, charter §10) (#522 → #523).

### Changed

- **npm audit gate** replaced with `audit-ci` + a per-advisory allowlist, so an advisory with no
  fixed release can be excepted **by ID, with a measured reason and an expiry (2026-08-31)**,
  instead of blunting the gate for everything. `high` / `critical` stay failing for anything not
  listed. Adds `scripts/check-overrides.mjs`, which probes every copy of a pinned package on disk
  — a hoisted copy being correct does not prove a nested one is (#524 → #530).
- README status table brought up to what had actually shipped (#526 → #527).

### Fixed

- **Inbox paging silently reset** — the search debounce armed its 300 ms timer on mount as well
  as on input, so `setPage(0)` fired shortly after the screen opened and quietly cancelled
  whatever the operator did first (pressing "next" landed back on page 1). The timer now runs
  only on an actual query change (#528 → #529).

### Verified on production

All four canonical URLs 200; unauthenticated `GET /admin/audit-events/export` → **401**; the
served console assets are the real bundle (not the 557-byte fallback); `/embed/embed.js`
unchanged at sha384 `6pU29afi…`, identical to the repository build; zero JS errors in a real
browser. The authenticated path was exercised by the maintainer: the export downloaded
(72,568 bytes / 117 rows) and the resulting `audit_event.exported` row appeared at the top of
the audit list with its actor recorded.

## 2026-07-24 — guided tour + help + inbox/embed UX + submission tags (deployed to production)

Console-only deploy to `contact.ayane.co.jp` (hub GO; the deploy freeze had lifted 2026-07-22).
Frontend/i18n/CSS only — no backend, migration, `.env`, or embed changes. Prod console went from
`index-CPveXqjn.js` to **`index-C6dmgI38.js`** / **`index-6howia9n.css`** via the console-only
scp-changed-assets path (backup-first; old hashes kept for rollback). References are `(#issue → #PR)`.

### Added

- **Guided tour** — a self-contained spotlight tour (no new dependency) walking a 4-step value
  flow (build → read incoming → help), launched from the sidebar and a first-run **onboarding
  banner** on the dashboard (#486 → #487, #490 → #496, #491 → #497).
- **`/help` usage guide** — quickstart with paste-location, a tool-migration cheat-sheet
  (Contact Form 7 / Google Forms), and a basics / power-users split (#484 → #485, #493 → #499,
  #507 → #510).
- **Inbox CSV export** button (#494 → #500) and **submission delete/erase** with an audited,
  irreversible confirm dialog (#502 → #504, #514 → #516).
- **Allowed-origins editor** in the builder settings + a deep link from the embed panel that
  scrolls to and focuses the field (#503 → #505, #512 → #517).
- **Submission tags** — org-managed vocabulary, apply/remove, inbox filter and chips
  (#472–#476 → #477–#483).

### Changed

- **Embed panel** made plain-language — paste-location guidance, stopped/live status, and
  public-key clarity (#495 → #501, #506 → #509, #513 → #519).
- **Help copy** de-jargoned (internal identifiers removed) and the sidebar **manage group** is
  now collapsible (#492 → #498, #515 → #518). Theme refinements (#468 → #469).

### Verified on production

All four canonical URLs 200; the served bundle carries the new UX strings and boots with zero JS
errors; deployed asset byte-sizes match the local build; `/embed/embed.js` integrity unchanged.

## 2026-07-21 / 07-22 — post-launch waves (deployed to production)

Deployed to `contact.ayane.co.jp` as the deploy freeze lifted: the backend + email/console
waves on **2026-07-21** (deployed by the maintainer), then two console rebuilds on **2026-07-22**
— the inbox/audit-log `Pagination` and the dashboard 7-day trend. Backend `src/`, `tools/`, and
migrations were verified byte-identical to `main`. References are `(#issue → #PR)`.

### Added

- Canonical **`Pagination`** control (previous/next + range readout) adopted across the
  submissions inbox (#458 → #459) and the audit log (#460 → #461) — visible for any non-empty
  list, replacing the numbered pager that hid at ≤1 page (which is why it was invisible on the
  production inbox at ≤20 rows); the legacy `Pager` was removed. Deployed 2026-07-22.
- Dashboard **real 7-day receipts trend** — the "受信の推移（7日）" card now aggregates the
  recent list client-side (`from=`, bucketed per day) into real bars: empty days render flat,
  today is emphasized, hovering a bar shows its count, and the headline is the 7-day sum. Drops
  the previous illustrative hardcoded sparkline (#464 → #465). Deployed 2026-07-22.
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
