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
| `data-trigger` | no | `modal` / `chat` / `inline` / `button` — overrides the form's `appearance.mode` when set |
| `data-lang` | no | `ja` or `en` only (ADR 0011); must be one of the form's `locales` |
| `data-button-label` | no | Label for the `button` trigger (falls back to `appearance.launcher.label`) |

---

## Server obligations

1. Serve **embed.js** with long-cache hash filename in production builds.
2. Widget loads form schema from `GET /public/forms/{public_form_key}/schema` (no auth).
3. Submit via `POST /public/forms/{public_form_key}/submissions` with JSON body matching field schema.
4. Enforce **allowed_origins** (Origin / Referer check).
5. Include **honeypot** field name in schema; reject non-empty honeypot silently with `204` or generic success (anti-enumeration — ADR 0010).
6. Cap body size (e.g. 64 KiB JSON; attachment separate multipart endpoint).
7. Resolve locale to `ja` or `en` only: use `data-lang` when it is one of the form's `locales`, otherwise fall back to the form's `default_locale` (ADR 0011).
8. Serve the whole embed distribution — `/embed.js`, `/embed/embed.js`, `/embed/embed.<hash>.js`
   and `/embed/manifest.json` — with **`Access-Control-Allow-Origin: *`**. A `<script>` carrying
   `integrity` is fetched in CORS mode, so **without this header an SRI-pinned snippet does not
   execute on any origin** — including the snippet the console hands operators, which pins SRI.
   The header is set in `public_html/.htaccess`; it is **not** accompanied by
   `Access-Control-Allow-Credentials` (which would forbid `*`) or by `Vary: Origin` (the value is
   constant, so varying would only fragment caches) (#584).

---

## Trigger modes

| Mode | Behavior |
| --- | --- |
| `modal` | Fixed corner launcher (FAB, `launcher.side` left/right) opens the form in a centered modal |
| `chat` | Fixed corner launcher opens a conversational (one-field-at-a-time) chat panel |
| `inline` | Renders the form in place of the script tag |
| `button` | Renders an in-flow `<button>` where the script tag sits (place it anywhere; multiple allowed); click opens the modal |

---

## Styling

- Widget ships default CSS in shadow DOM or isolated class prefix `nene-contact-`.
- Operator may pass `data-theme=light|dark` (Phase 2+).
- No operator-supplied CSS injection strings.

---

## Security

- CSP-friendly: no `eval`, no inline script from API responses.
- iframe mode is **out of scope** for MVP (same-origin modal only).
- The `*` in the CORS obligation above is about **reading a public script file**, not about who may
  submit: submission is still gated by the form's **`allowed_origins`** (obligation 4). Widening
  one does not widen the other.

---

## Related

- ADR 0010
- ADR 0011 (bilingual ja/en scope)
- [`scope-contract.md`](./scope-contract.md)

Last updated: 2026-08-15
