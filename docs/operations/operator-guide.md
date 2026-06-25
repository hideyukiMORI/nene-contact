# Operator guide

For the **operator** who self-hosts NeNe Contact. You are the **data controller** for the
submissions your forms collect; Contact is the processing software you run
([compliance charter](../explanation/data-protection-compliance.md) §2). This guide states the
operational and legal responsibilities the charter places on **you**, plus the production
checklist. It is not legal advice — jurisdiction scope is **Japan / APPI only** (§1, §9).

---

## 1. Production deployment checklist

Run through this before exposing a form to the public internet.

- [ ] **TLS / HTTPS is mandatory** (charter §6). Terminate HTTPS at your reverse proxy and
      serve `embed.js`, the public API, and the admin SPA only over `https://`. The widget
      sends visitor PII; plaintext HTTP is a compliance defect.
- [ ] **`NENE_CONTACT_ENCRYPTION_KEY`** is set to a base64 32-byte key (channel secrets and
      service tokens are encrypted at rest, §6). Generate:
      `php -r 'echo base64_encode(sodium_crypto_secretbox_keygen());'`. **Losing it makes stored
      channel secrets unreadable** — back it up out-of-band, never commit it.
- [ ] **`NENE2_LOCAL_JWT_SECRET`** is set to a long random value (operator login tokens + the
      agent write confirmation token are signed with it).
- [ ] **`NENE2_MACHINE_API_KEY`** is set **only if** you use the agent surface `/api/*` or the
      MCP server; unset means `/api/*` is closed (401). Treat it as a secret.
- [ ] **Per-form `allowed_origins`** lists exactly the site(s) that embed each form — never a
      wildcard. CORS reflects only allowed origins, never `*` (§6, ADR 0010).
- [ ] **Mail sender identity** (`MAIL_FROM`, `MAIL_DSN`) is a real, monitored address with a
      working reply path (§7, 特定電子メール法).
- [ ] **Bootstrap** the organization the single-tenant resolver expects and an operator account:
      `php tools/create-organization.php "Name" <slug>` then
      `php tools/create-user.php you@example.com '<password>' admin <org_id>`.
- [ ] **Secrets are never committed.** `.env`, tokens, and keys stay out of version control.
- [ ] **Sibling tokens** (`NENE_DEAL_*`, `NENE_VAULT_*`, `NENE_INVOICE_*`, `NENE_RECORDS_*`) are
      set only for the integrations you use; they are bearer credentials, encrypted/redacted and
      never logged.

See [`reference: environment variables`](#7-environment-variables-reference) for the full list.

---

## 2. Privacy notice & consent — your responsibility

Contact provides the **surface**; you provide the **legal text and lawful basis** (§1, §2, §3).

- **Your site's privacy notice** must describe what you collect, why, retention, and the
  data-subject contact — Contact does not host this copy.
- **特定商取引法（表記）** and similar site-level legal text are your site's duty; Contact gives
  you the form/consent field surface, not the legal wording (§1).
- **Consent**: enable `consent_required` on a form and set a per-locale `consent_label` that
  links to your privacy notice. The consent checkbox is **never pre-checked**; the submission is
  rejected without affirmative consent, and *what* was consented to and *when* is stored
  immutably with the submission (§3).
- **Purpose limitation**: only the fields you declare on the form are stored. Do not add fields
  you have no lawful reason to hold (§2, §8).

---

## 3. Prohibited & sensitive data

Contact structurally prevents collection of data it has no lawful reason to hold (§8):

- **My Number (マイナンバー)** and **raw payment card numbers** cannot be configured as field
  types — the field-type registry is a closed allowlist and rejects them.
- **要配慮個人情報** (sensitive personal information) is never a silent default. If you genuinely
  need a sensitive field, that is an explicit, documented configuration decision **and your
  lawful basis** — document it in your own records.

---

## 4. Cross-border / non-Japanese visitors (越境移転)

- Contact is built to **APPI / Japan law only**. It is **not** warranted as GDPR / UK-GDPR /
  ePrivacy compliant (charter §9).
- You choose where your instance runs and are the **data exporter/importer** for any
  cross-border transfer.
- If your forms serve EU/UK/other visitors, lawful handling (越境移転の同意・SCC 等) is **your
  responsibility**. The bilingual `ja`/`en` UI does not imply EU-law coverage.

---

## 5. Notifications & anti-spam (特定電子メール法)

- Outbound notifications are **transactional** — triggered by a submission to your configured
  recipients/channels (email / Slack / Chatwork / signed webhook). Contact is **not** a
  marketing mailer; do not use it for newsletters or bulk lists (§7, scope DON'T).
- Outbound email carries accurate **sender identification** and a working **reply path** — set
  `MAIL_FROM` to a real monitored address.
- Notification bodies use **field summaries**, never full attachment bytes and never secrets.
- Signed webhook target URLs are your responsibility.

---

## 6. Data-subject rights & retention

Fulfil 本人の権利 (disclosure / correction / suspension, §4) and retention (§5) from admin:

| Right / task | How |
| --- | --- |
| **Disclosure** (開示) | Inbox detail shows the submission + the consent record; CSV export (`GET /admin/submissions/export`, audited) for a portable copy. |
| **Correction** (訂正) | Edit field values (`PATCH /admin/submissions/{id}/field-values`, audited, purpose-limited). |
| **Deletion / suspension** (削除・利用停止) | Soft-delete (`DELETE /admin/submissions/{id}`): excluded from the inbox immediately; **PII is erased in place** on purge — the row + audit linkage are never physically removed ([ADR 0016](../adr/0016-no-physical-deletion-pii-erase-in-place.md)). |
| **Retention** | Set `retention_days` per form. Run the purge job (`php tools/purge-submissions.php`) on a schedule; it is **dry-run by default** — pass the apply flag to act. Expiry soft-deletes, then PII is erased in place after the grace period (§5). |

Every mutation and every PII view/export is **audit-logged** (who / what / when), append-only
([ADR 0013](../adr/0013-audit-logging.md)); the audit trail carries no raw PII or secrets.

---

## 7. Environment variables reference

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NENE_CONTACT_ENCRYPTION_KEY` | At-rest key for channel secrets / tokens (§6) | base64 32-byte; back up; required when channels are used |
| `NENE2_LOCAL_JWT_SECRET` | Signs operator login + agent write confirmation tokens | long random; server-only |
| `NENE2_MACHINE_API_KEY` | Gates the agent surface `/api/*` (`X-NENE2-API-Key`) | set only if using `/api/*` or MCP; unset → 401 |
| `MAIL_DSN` / `MAIL_FROM` | Outbound notification transport + sender (§7) | real monitored sender |
| `TENANT_RESOLUTION` / `ORG_SLUG` | Tenant resolution (default single / `default`) | see [multi-tenancy](../development/multi-tenancy.md) |
| `NENE_DEAL_*` / `NENE_VAULT_*` / `NENE_INVOICE_*` | Sibling handoff base URL + service token | bearer; never logged |
| `NENE_RECORDS_API_BASE_URL` / `NENE_RECORDS_BEARER_TOKEN` | Records read-only select options | bearer; never logged |

Copy `.env.example` to `.env` and fill these in. Never commit `.env`.

The console build also reads two Vite build-time vars (`VITE_NENE_CONTACT_API_BASE_URL`,
`VITE_NENE_CONTACT_PUBLIC_BASE_URL`) — see `.env.example`. Leave the public base unset for a
single-host deploy; set it when `embed.js`/`/public/*` are served from a different host than the
console (e.g. a CDN).

---

## 8. Production embed.js build & install snippet

`public_html/embed.js` is the readable source. For production, build a minified, content-hashed,
integrity-checked artifact:

```
cd frontend && npm run build:embed
```

This writes (the `public_html/embed/` dir is git-ignored build output):

- `public_html/embed/embed.<hash>.js` — minified widget. The hash is derived from the bytes, so the
  filename changes only when the widget changes — serve it **immutable, long-cache**
  (`Cache-Control: public, max-age=31536000, immutable`).
- `public_html/embed/manifest.json` — `{ file, bytes, integrity, snippet }`. `integrity` is the
  `sha384-…` Subresource Integrity hash (ADR 0010 §7); `snippet` is the ready production install
  snippet (replace `{host}` / `{public_form_key}`):

```html
<script src="https://{host}/embed/embed.<hash>.js" data-form="{public_form_key}"
        data-trigger="modal" integrity="sha384-…"
        crossorigin="anonymous" async></script>
```

Notes:
- The build runs a CSP guard — it fails if the widget ever introduces `eval` / `new Function` /
  `innerHTML` / `document.write` / `insertAdjacentHTML`, keeping it CSP-friendly (no `eval`, no
  inline script from API responses).
- The raw `/embed.js` stays available for simple installs; serve it with a **short** cache. The
  hashed artifact is the cache-busting + SRI path for production.
- The widget resolves its API base from its own `<script src>` origin, so serve `embed.js`, the
  hashed artifact, and `/public/*` from the same host (or set `VITE_NENE_CONTACT_PUBLIC_BASE_URL`).

---

## Related

- [Compliance charter (binding)](../explanation/data-protection-compliance.md) — the rules this guide operationalizes
- [Acceptance audit A1–A8](../review/acceptance-A1-A8.md) — how the product enforces them
- [ADR 0010 (embed/public security)](../adr/0010-embed-public-api-security.md), [ADR 0013 (audit)](../adr/0013-audit-logging.md), [ADR 0016 (no physical deletion)](../adr/0016-no-physical-deletion-pii-erase-in-place.md)
- [Embed widget contract](../explanation/embed-widget-spec.md)

Last updated: 2026-06-04
