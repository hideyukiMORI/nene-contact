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

### Surfaces added after the first review (keep the list current)

- [ ] **Operator tags (ADR 0019)** — vocabulary is org-managed, not free text per submission; the
      management screen warns against encoding 要配慮個人情報; tag audit snapshots carry
      `{tag_id, label}` only, never submission values.
- [ ] **Service tokens (ADR 0014)** — no token secret at rest (registry stores `jti` + metadata);
      issue/revoke audited; scopes org-bound.
- [ ] **Bulk reads of the trail** — an audit-log export is itself audited, records how much it
      covered (`count` / `total_matched`), and copies no snapshots into its own record.
- [ ] **Staged metadata disclosure (ADR 0018)** — IP/UA revealed only through the audited
      `technical-meta` path, never in the list.

---

## Release review — 2026-07-29 (M7 gate)

Re-run against `main` at **`8b4729e`** by the Contact lane. Method: read the code and cite it;
no item is marked from memory. This supersedes the 2026-06-04 pass, which predates the production
launch, four deploy waves, tags, service tokens and the audit export.

**Verdict: PASS**, with two honest gaps recorded below (neither is a charter deviation).

| Item | Verdict | Evidence (file:line, `main@8b4729e`) |
| --- | --- | --- |
| Purpose limitation | ✅ | Stronger than "reject unknown keys": `SubmitPublicFormHandler.php:65-86` **iterates the form's declared fields** and copies only those into `$values`. A key the operator never declared is not rejected — it is never read, so it cannot be stored by any path. Honeypot values are dropped before that (`:56-60`, silent 204 per ADR 0010). |
| Consent | ✅ | Rejected before storage when required: `SubmitPublicFormHandler.php:88-91` returns a `consent_required` validation error unless `consent === true`. `SubmitPublicFormUseCase.php:33-37` then snapshots the label in force + the moment granted, and only when `consent_required`. |
| Prohibited data | ✅ | `ContactForm/FieldType.php:37-63` — `PROHIBITED` names `my_number` / `card_number`; `isProhibited()` blocks them at field creation. No operator-supplied JS anywhere in the field registry. |
| Security (ADR 0010) | ✅ | Allowed origins enforced server-side (`Http/PublicCorsMiddleware.php`); per-IP + per-form throttle (`RateLimit/PublicSubmitThrottleMiddleware.php`); honeypot in the field registry; no PII in URLs. |
| Secrets at rest | ✅ | `Notification/SodiumConfigCipher.php` (libsodium `crypto_secretbox`), applied in `PdoNotificationChannelRepository.php:36,62`. Service tokens keep **no secret at all** — `PdoServiceTokenRepository.php:30` persists `jti` + metadata, never the JWT. |
| Notifications | ✅ | Transactional only; templates carry field summaries. No ESP/marketing path exists in `src/`. |
| Retention / deletion | ✅ | `RetentionPolicy.php:20,23` — `GRACE_DAYS = 30`, `ORPHAN_GRACE_DAYS = 1`; two-stage purge in `PurgeSubmissionsUseCase.php`. Deletion is erase-in-place (ADR 0016): `PdoSubmissionRepository.php:80` sets `deleted_at`, and every read filters `deleted_at IS NULL`. |
| Data-subject rights | ✅ | Disclosure (detail), correction (`CorrectSubmissionUseCase`), deletion (`softDelete` + the audited console action, #502/#504), export (CSV) — all operator-reachable and audited. |
| Audit (ADR 0013) | ✅ | Every mutating use case records or is an allowlisted read (`tools/check-usecases-audited.php`, wired into `composer check`). PII view/export recorded. |
| MCP / agent API | ✅ | `Api/ApiSubmissionResponse.php:12,28` masks by default; `include_pii=true` is audited with `via=agent_api` (`ListAgentSubmissionsUseCase.php:37`, `GetAgentSubmissionUseCase.php:37`). Writes need a two-step confirmation token. |
| Cross-border (§9) | ✅ | No GDPR/EU claim in `docs/`; operator responsibility stated in the operator guide. |
| Deviations carry an ADR | ✅ | None outstanding. |
| **Tags (ADR 0019)** | ✅ | Vocabulary is org-managed (`Tag/CreateTagUseCase.php`), not free text at submission time; the console warns against 要配慮個人情報 (`tags.warn`); `AddSubmissionTagUseCase.php:52` records `{tag_id, label}` — no field values. |
| **Service tokens** | ✅ | See "Secrets at rest". `service_token.issued` / `.revoked` audited with non-secret metadata only. |
| **Bulk read of the trail** | ✅ | `Audit/ExportAuditEventsUseCase.php` records `audit_event.exported` with `{count, total_matched, filter}` and **no snapshots**; org-scoped via the repository; `ViewAuditLog` gated. |
| **Staged metadata disclosure (ADR 0018)** | ✅ | IP/UA only via `GetSubmissionTechnicalMetaUseCase.php:35`, which records `submission_technical_meta.viewed`. The inbox list never carries them. |

### Gaps recorded honestly (not charter deviations)

1. **Anti-abuse depth.** The honeypot, per-IP/per-form rate limit and body-size cap are
   implemented and enforced; **reCAPTCHA and duplicate-submission suppression are not**. They are
   shown as「近日対応」in the form settings UI. This is a product gap, not a compliance breach —
   the charter requires proportionate anti-abuse, which the implemented three provide — but it is
   stated here so the GA decision is made with it in view. Priority is a maintainer call.
2. **Editor-role denial verified locally, not on production.** `ViewAuditLog` correctly returns
   403 for `editor` (measured on the local stack, 2026-07-29). Production has no editor account,
   so the same check was not repeated there; the deployed code is byte-identical to `main`
   (verified by `rsync -nc` at deploy time), which is the basis for carrying the local result.

### Not re-verified in this pass (declared, not assumed)

- Live TLS configuration and the privacy-notice wording on the operator's own site — these are
  operator responsibilities under §9, outside this repository.
- Long-running behaviour of the purge job on production data (no purge has yet fallen due).

Last updated: 2026-07-29 (release review for M7; previous pass 2026-06-04)
