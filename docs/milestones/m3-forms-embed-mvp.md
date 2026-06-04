# Milestone M3: Forms + embed MVP

**Phase 2** · the North Star made visible: build a form, paste one script line, receive
submissions in an inbox. 🚧 **Core landed** (embed.js + admin SPA: login, builder, inbox
list/detail, channels, users); remaining polish noted below.

## Goal

Deliver the operator-facing MVP — an admin SPA to build forms and triage an inbox, plus
the public `embed.js` widget that renders the form on any site. After M3 the
[`product-vision.md`](../explanation/product-vision.md) MVP success criteria hold.

## Acceptance criteria

- [x] **Admin SPA** scaffold: JWT login (in-memory token), RBAC-aware navigation; all UI
      strings via `t(key)` from `shared/i18n/messages/{ja,en}.ts` (ADR 0011). (#97/#98)
      Organization switch UI is a follow-up (single-tenant resolver works today).
- [x] **Form builder GUI** (ADR 0015): custom UI + dnd-kit reorder; field types
      text/email/textarea/select/checkbox/file/honeypot; per-locale `ja`/`en` labels +
      select options; `locales[]` + `default_locale`, `allowed_origins`, consent, retention;
      prohibited types not offered (M2 registry). Create flow done; field edit/delete of an
      existing form is a follow-up. (#104/#105)
- [x] **Inbox UI**: list (paging) + detail with status workflow + operator notes;
      channels + users management. (#101/#102, #103, #106/#107, #108/#109) CSV-export and
      delete/correct buttons in the UI are a follow-up (the API exists).
- [x] **`embed.js` widget** (embed-widget-spec): triggers `floating` / `button` / `inline`;
      loads `GET /public/forms/{public_form_key}/schema`; submits (CORS simple request);
      honeypot; consent; file upload; locale resolved to `ja`/`en`; shadow-DOM isolation; no
      operator JS injection. Per-form CORS for the public endpoints. (#93/#94, #95/#96)
- [x] **Bilingual rendering** (ja/en) in the widget and admin.

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
