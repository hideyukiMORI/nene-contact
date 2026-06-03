# Embed Widget Spec (binding)

Contract between NeNe Contact server and the **embed.js** snippet operators paste on external sites.

---

## Snippet (operator-facing)

```html
<script
  src="https://{contact-host}/embed.js"
  data-form="{public_form_key}"
  data-trigger="floating"
  data-lang="ja"
  async
></script>
```

| Attribute | Required | Values |
| --- | --- | --- |
| `data-form` | yes | Public form key (not internal ULID) |
| `data-trigger` | no | `floating` (default), `button`, `inline` |
| `data-lang` | no | `ja`, `en` (must match form locales) |
| `data-button-label` | no | Label when `trigger=button` |

---

## Server obligations

1. Serve **embed.js** with long-cache hash filename in production builds.
2. Widget loads form schema from `GET /public/forms/{public_form_key}/schema` (no auth).
3. Submit via `POST /public/forms/{public_form_key}/submissions` with JSON body matching field schema.
4. Enforce **allowed_origins** (Origin / Referer check).
5. Include **honeypot** field name in schema; reject non-empty honeypot silently with `204` or generic success (anti-enumeration — ADR 0010).
6. Cap body size (e.g. 64 KiB JSON; attachment separate multipart endpoint).

---

## Trigger modes

| Mode | Behavior |
| --- | --- |
| `floating` | Fixed corner launcher opens modal form |
| `button` | Renders `<button>`; click opens modal |
| `inline` | Renders form in place of script tag |

---

## Styling

- Widget ships default CSS in shadow DOM or isolated class prefix `nene-contact-`.
- Operator may pass `data-theme=light|dark` (Phase 2+).
- No operator-supplied CSS injection strings.

---

## Security

- CSP-friendly: no `eval`, no inline script from API responses.
- iframe mode is **out of scope** for MVP (same-origin modal only).

---

## Related

- ADR 0010
- [`scope-contract.md`](./scope-contract.md)

Last updated: 2026-06-03
