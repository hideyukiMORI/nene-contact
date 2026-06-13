# Embed Appearance Spec (draft for review)

> Status: **draft / 検討用**. Documents (1) what the embed appearance can configure **today**
> (appearance v1, shipped #281/#285), (2) what each **display mode** is intended to do, and
> (3) an **expansion menu** to decide how much wider the design surface should go.
> Companion to the binding [`embed-widget-spec.md`](./embed-widget-spec.md).

---

## 0. Where appearance lives

- **Per-form** (form is SSOT): stored as `contact_forms.appearance_json` (nullable → defaults).
- **Authored** in the builder「デザイン」tab with a live preview.
- **Delivered** in the public schema (`GET /public/forms/{key}/schema` → `appearance`).
- **Applied** by `embed.js` via CSS variables on the shadow root (no operator CSS injection; CSP-safe).
- Backend value object: `NeneContact\ContactForm\Appearance`. Defaults reproduce the original look.

Constraints (binding, from `embed-widget-spec.md` + ADR 0010/0011):
isolated shadow DOM, no `eval`/inline script, **no operator-supplied CSS strings**, fonts are
**web-safe stacks or self-hosted only** (no runtime third-party font fetch), ja/en only.

---

## 1. 現状できること (appearance v1)

| Key | Type / range | Default | Applied to |
| --- | --- | --- | --- |
| `mode` | `floating` \| `button` \| `inline` | `floating` | Display mode (see §2) |
| `accent` | hex (`#rgb`/`#rrggbb`) | `#2563eb` | Submit button, launcher/FAB, hero tint |
| `surface` | hex | `#ffffff` | Modal panel / form background |
| `text` | hex | `#111827` | Body + label text |
| `radius` | int 0–24 px | `8` | Inputs, buttons (panel = radius + 4) |
| `font` | `system` \| `sans` \| `serif` | `system` | Whole widget font-family |
| `header` | bool | `true` | Show/hide the form title |
| `hero` | bool | `false` | Title + description as an accent-tinted band |

**Gaps already visible in v1** (the "幅が少ない" feeling):
- Only 3 colours — no border, input background, muted text, error, or button-text colour.
- One radius for everything; no control of spacing/density, input style, or button style.
- Font is family-only; no size/weight/heading control.
- No launcher customization (icon, side, size, label colour) and no modal-width/animation control.
- No logo/image, no success message / redirect, no field layout (columns, label position).
- `data-theme=light|dark` is still only promised, not implemented.

---

## 2. モード切り替えの想定 (intended behavior per mode)

Today `appearance.mode` is the form's stored default; the snippet's `data-trigger` still overrides it.

| Mode | Trigger | What renders | Chrome | Intended use |
| --- | --- | --- | --- | --- |
| `inline` | — | Form rendered in place of the script tag | header/hero per flags; no launcher, no overlay | Embed inside a page section / landing page |
| `button` | `<button>` (accent) | Click → centered modal overlay with the form | modal has close (×), backdrop click closes | A "Contact" button anywhere in page copy |
| `floating` | Fixed bottom-right FAB | Click → same modal overlay | FAB is a pill launcher; modal as above | Site-wide persistent entry point |

**Currently undifferentiated / fixed (candidates to make configurable):**
- `button` and `floating` open the **same** modal — only the launcher differs. Modal width
  (460px), backdrop opacity (.45), centered position, and open/close animation are all fixed.
- FAB is always **bottom-right**, pill-shaped, label = form name, accent background.

### Planned modes (not built — for the reconsideration)

| Mode | Behavior (proposed) | Notes |
| --- | --- | --- |
| `modal` (explicit) | Same as `button` but documented as its own mode so the launcher style is a separate axis from "opens in a modal" | Mostly a taxonomy cleanup |
| `drawer` / `slide-in` | Launcher opens a panel that slides from the right/bottom edge instead of a centered modal | Medium effort; new layout + animation |
| `chat` (Phase 2) | Conversational: **one field per step**, progress indicator, prev/next, answer bubbles, typing affordance | Large: new render engine in embed.js + builder preview + per-step validation |
| `fullscreen` | Launcher opens a full-viewport takeover form | Small variant of modal |

---

## 3. 拡張メニュー (decide how wide to go)

Grouped so you can pick tiers. Each item is per-form `appearance` unless noted. Effort is rough
(S = hours, M = a PR, L = multi-PR / new subsystem).

### A. Colour & theme depth
- [ ] `border`, `inputBg`, `mutedText`, `error`, `buttonText` colours (S–M)
- [ ] Light/Dark support: `theme: 'light'|'dark'|'auto'` + `data-theme` override (M) — already promised
- [ ] **Preset palettes** (curated themes operators pick instead of raw hex) (M)
- [ ] Auto-contrast guard (warn/fix unreadable accent-on-text) (S)

### B. Typography
- [ ] Font **size scale** (`sm`/`md`/`lg`) (S)
- [ ] Separate **heading font** + weight (M)
- [ ] Self-hosted brand font slots (must bundle; no runtime fetch — CSP) (M–L)

### C. Shape, spacing, control style
- [ ] Separate radius for input / button / panel (S)
- [ ] **Density**: `compact`/`cozy`/`comfortable` field spacing (S)
- [ ] **Input style**: `outline`/`filled`/`underline` (M)
- [ ] **Button style**: `solid`/`outline`/`soft` + `pill` toggle (S–M)
- [ ] Elevation/shadow level for the panel (S)

### D. Layout & chrome
- [ ] **Logo / image** upload shown in header/hero (needs an asset store — Vault? or data-URL cap) (M–L)
- [ ] Hero **background image** or solid cover colour (M)
- [ ] **Label position**: top / left / floating (M)
- [ ] **Multi-column** field layout (2-col on wide) (M)
- [ ] Required-mark style, optional-field hint (S)
- [ ] Intro / outro (thank-you) copy, bilingual (M)

### E. Launcher (floating/button)
- [ ] FAB **side** (left/right), **size**, **shape** (pill/circle+icon), **icon** choice (M)
- [ ] Launcher label colour / custom label per locale (S)
- [ ] Show/hide launcher on scroll, delay before showing (M)

### F. Modal / drawer presentation
- [ ] Modal **width** + position (center/right), **animation** (fade/slide/scale) (M)
- [ ] Backdrop opacity / blur, dismiss-on-backdrop toggle (S)
- [ ] `drawer` mode (slide-in panel) (M)
- [ ] `fullscreen` mode (S)

### G. Submit experience
- [ ] Custom **submit label** (per locale) + post-submit **success message** (M)
- [ ] **Redirect URL** after success (S) — note: open-redirect / origin checks
- [ ] Inline vs replace-form success state (S)

### H. Modes (the big one)
- [ ] `chat` conversational mode — see §2; treat as its own milestone (L)

---

## 4. Suggested tiers (a starting point to react to)

- **Tier 1 (quick depth):** A border/inputBg/mutedText colours, C density + button/input style,
  B font-size scale. → biggest "looks designed" payoff for least risk.
- **Tier 2 (brand):** A presets + light/dark, D logo/hero image + intro/outro, G success/redirect.
- **Tier 3 (presentation):** E launcher options, F modal/drawer/fullscreen.
- **Tier 4 (new paradigm):** H `chat` mode (own milestone).

> Pick the tiers/items to pursue and I'll turn the chosen set into Issues (one per coherent unit)
> and implement. Open question to settle first: **do we want raw token control (power, but easy
> to make ugly) or curated presets + a few knobs (safer, on-brand)?** — that choice shapes A/B/C.

---

Last updated: 2026-06-13
