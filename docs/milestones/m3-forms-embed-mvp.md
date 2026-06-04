# Milestone M3: Forms + embed MVP

**Phase 2** · the North Star made visible: build a form, paste one script line, receive
submissions in an inbox.

## Goal

Deliver the operator-facing MVP — an admin SPA to build forms and triage an inbox, plus
the public `embed.js` widget that renders the form on any site. After M3 the
[`product-vision.md`](../explanation/product-vision.md) MVP success criteria hold.

## Acceptance criteria

- [ ] **Admin SPA** scaffold: JWT login, organization switch, RBAC-aware navigation; all
      UI strings via `t(key)` from `shared/i18n/messages/{ja,en}.ts` (ADR 0011) — no
      hardcoded user-facing text.
- [ ] **Form builder GUI** (ADR 0015): custom UI + dnd-kit; field types text/email/textarea/
      select/honeypot; per-locale `ja`/`en` labels + options; `locales[]` + `default_locale`,
      `allowed_origins[]`, retention; prohibited types not offered (M2 registry).
- [ ] **Inbox UI**: list / detail / status workflow / operator notes / CSV export; PII view
      and export audited (ADR 0013).
- [ ] **`embed.js` widget** (embed-widget-spec): triggers `floating` / `button` / `inline`;
      loads `GET /public/forms/{public_form_key}/schema`; submits JSON; honeypot; body cap;
      locale resolved to `ja`/`en` via `data-lang` → form `default_locale`; isolated
      styling (shadow DOM / `nene-contact-` prefix); no operator JS injection (XSS).
- [ ] **Bilingual rendering** end-to-end on the host site.

## MVP success criteria (product-vision)

- [ ] One form, three field types, floating embed.
- [ ] Submission stored and listed in admin.
- [ ] One email notification + one Slack or Chatwork channel (channel dispatch may complete
      in M4; email lands here).
- [ ] Rate limit + honeypot + allowed origins enforced.
- [ ] Bilingual `ja`/`en` form rendering.
- [ ] OpenAPI validated; MCP read tools for inbox (MCP read lands in M6).

## Out of scope

- iframe embed mode (MVP is same-origin modal only, embed-widget-spec).
- `data-theme` light/dark polish (Phase 2+ follow-up).
- Slack/Chatwork dispatch wiring (M4), MCP tools (M6).

## Related

- [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md) (binding)
- [`../explanation/product-vision.md`](../explanation/product-vision.md)
- [`../development/frontend-standards.md`](../development/frontend-standards.md)
- [`../development/i18n-message-catalog.md`](../development/i18n-message-catalog.md)
- ADR 0010 (embed security), ADR 0011 (bilingual), ADR 0015 (form builder UI)

Last updated: 2026-06-04
