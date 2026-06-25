# Milestone M3: Forms + embed MVP

**Phase 2** · the North Star made visible: build a form, paste one script line, receive
submissions in an inbox. ✅ **MVP complete (2026-06-14)** — embed.js + admin console (login,
builder, inbox two-pane, channels, users, audit log), the builder & inbox rebuilt to spec v1,
and **Appearance Studio v2** (per-form theming, 3 modes, HERO) landed beyond the MVP bar. See
the 2026-06 sprint log in [`../todo/current.md`](../todo/current.md).

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
      prohibited types not offered (M2 registry). Create + **edit/delete** done (#196/#198/#200);
      rebuilt to builder spec v1 with choice-field UI, field config, date/phone types, custom
      slug, and the 4-tab full-screen chrome (#246–#294). (#104/#105)
- [x] **Inbox UI**: two-pane list (paging + status/sort) + detail with status workflow,
      operator notes, and audited reception-metadata reveal (ADR 0018); channels + users +
      audit-log viewer. (#101/#102, #103, #106/#107, #108/#109, #194, #220–#234) Inbox
      CSV-export and correction **buttons** remain a follow-up (the APIs exist).
- [x] **`embed.js` widget** (embed-widget-spec): triggers `floating` / `button` / `inline`;
      loads `GET /public/forms/{public_form_key}/schema`; submits (CORS simple request);
      honeypot; consent; file upload; locale resolved to `ja`/`en`; shadow-DOM isolation; no
      operator JS injection. Per-form CORS for the public endpoints. (#93/#94, #95/#96)
- [x] **Bilingual rendering** (ja/en) in the widget and admin.

## MVP success criteria (product-vision)

- [x] One form, three field types, floating embed.
- [x] Submission stored and listed in admin.
- [x] One email notification + one Slack or Chatwork channel (dispatch completed in M4).
- [x] Rate limit + honeypot + allowed origins enforced.
- [x] Bilingual `ja`/`en` form rendering.
- [x] OpenAPI validated; MCP read tools for inbox (MCP read landed in M6).

## Out of scope

- iframe embed mode (MVP is same-origin modal only, embed-widget-spec).
- `data-theme` light/dark polish (Phase 2+ follow-up).
- Slack/Chatwork dispatch wiring (M4), MCP tools (M6).

## Related

- [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md) (binding)
- [`../explanation/product-vision.md`](../explanation/product-vision.md)
- [`../development/frontend-standards.md`](../development/frontend-standards.md)
- [`../development/i18n-message-catalog.md`](../development/i18n-message-catalog.md)
- ADR 0010 (embed security), ADR 0011 (bilingual), ADR 0015 (form builder UI), ADR 0018 (staged metadata disclosure)

Last updated: 2026-06-25
