# Form Builder — 6-Persona Audit (2026-06)

Two-direction (**code review + live browser**) audit of the form builder, run through six tester
personas with different backgrounds. Tracking issue: #308. Findings are decomposed into the
implementation issues indexed at the end (#309–#324).

- **Scope**: the contact-form builder — `/console/contact-forms/new` (template picker → builder)
  and `/console/contact-forms/:id/edit`. Four tabs: フィールド / フォーム設定 / デザイン
  (Appearance Studio) / 連携・公開.
- **Method**: each persona read the relevant source **and** drove the running console
  (`tester@example.com`). The designer persona captured 4 tabs × 5 viewport widths (20 shots).
- **Code under review**: `frontend/src/features/build-contact-form/**`,
  `frontend/src/features/appearance-studio/**`, `frontend/src/entities/contact-form/**`,
  `frontend/src/shared/i18n/messages/{ja,en}.ts`, `src/ContactForm/**`, `src/Submission/**`,
  `src/Handoff/**`, `src/Records/**`, `public_html/embed.js`.

## Verdict

**Not yet "fully implemented."** The single-form authoring core (per-type field config, the choice
editor, the Appearance Studio, the publish flow) is genuinely strong — a non-technical user
completed a publish end-to-end. But there are clear completeness gaps in **i18n, responsiveness,
external-integration UI, productivity, and accessibility polish**. Weighted average ≈ **6.7/10**.

| Persona | Lens | Score | One-liner |
| --- | --- | --- | --- |
| 田中 (non-technical SMB owner) | Usability | 6/10 | Completed publish, but "ハニーポット" and 連携・公開 jargon risk drop-off |
| Priya (QA engineer) | Quality / robustness | 7/10 | State & round-trip solid; phone label empty, en gaps, swallowed 422 |
| 森 (accessibility expert) | Accessibility | 6.5/10 | Good foundation; unnamed icon buttons + contrast are ship-blockers |
| Volkov (security) | Security / compliance | **8/10** | No critical/high; prohibited-fields/consent/RBAC/audit are production-grade |
| Mei (product designer) | GUI / columns / responsive | 6/10 | Desktop excellent; builder collapses ≤768 |
| Sam (agency power user) | Coverage / integration | 6.5/10 | Integration APIs complete but no UI; no duplication; no bilingual field labels |

## ✅ What's good (cross-persona consensus)

- **Choice/select editor is first-class** — 6 display styles, live "回答者にはこう表示されます"
  preview, **bulk paste**, picture-choice, "その他" free-text, min/max conflict warnings.
- **Per-field-type config is deep** — text format/counter, email confirm + domain allow/deny, phone
  formats, date constraints + default-today, file type/size caps/multiple. Fully persisted server-side.
- **Backend security/compliance is production-grade** — prohibited fields (My Number/card)
  **structurally impossible** (closed enum + blacklist), consent enforced, CORS never `*`, rate limit,
  64 KB body cap, RBAC (`ManageForms`; editor blocked), multi-layer tenant isolation, audit on every
  mutation, XSS neutralized via `textContent`/JSX.
- **Honest state management** — accurate dirty detection, save→reload round-trip, leave/reload guards,
  empty-name / 0-field publish block. 15 builder tests green.
- **Accessibility foundation** — dnd-kit keyboard reordering actually works (with a live region),
  broad visible focus, correct `role=switch`/`aria-checked`, reduced-motion support.
- **Desktop column design** — 1024–1440 all four tabs render cleanly, 600px unified center, no h-scroll.
- **Non-technical reachability** — template picker first, helpful card descriptions, one-click publish.

## ⚠️ What's missing (by severity)

### 🔴 High
1. **Phone field label renders empty everywhere** — `builder.type.phone` missing in ja & en;
   `as MessageKey` cast hides it. → **#309**
2. **English catalog ~244 keys missing** (`choice.*`/`fc.*`) → English UI silently falls back to
   Japanese; violates ADR 0011. → **#310**
3. **Bilingual (ja/en) field & choice labels can't be edited in the UI** (model/backend/mapper
   support it; only the default locale is writable). → **#314**
4. **Handoff (Deal/Vault/Invoice) + Records-options import: API complete, no UI.** → **#315**, **#316**
5. **Builder has no responsive breakpoints** — fields & design tabs collapse ≤768. → **#313**
6. **No form/field duplication** (`duplicateField` exists but unexposed). → **#317**
7. **Destructive icon-only buttons unnamed for screen readers** + nested-interactive card. → **#311**

### 🟠 Medium
8. **Contrast < 4.5:1** (breadcrumb / publish button / active tab) + invisible focus spots. → **#312**
9. **Per-field server 422s swallowed** into a generic error. → **#318**
10. **Honeypot unexplained in UI + not structurally enforced** on every public form. → **#320**
11. **連携・公開 tab is jargon-heavy**; URL-first path not prominent. → **#321**
12. **No whole-form preview** (preview only works for a selected choice field). → **#319**
13. **Field-type gaps** — no number / url / postal-code / address. → **#322**
14. **`allowed_origins` empty default = open to all origins.** → **#323**

### 🟡 Low
15. Dummy toggles (reCAPTCHA / dup-prevention / auto-reply) operable but not persisted;
    no publish confirmation; public key shown as list noise. → **#324**
16. `hero.media` no server-side allowlist; embed.js SRI not emitted (ADR 0010 §7). → **#323**

## 🧭 GUI column verification (designer persona, measured)

| Tab \ width | 1440 | 1280 | 1024 | 768 | 390 |
| --- | --- | --- | --- | --- | --- |
| **Fields** (2-col) | ok | ok | ok | **broken** (canvas crushed, 324px inspector fixed) | **collapsed** (canvas ~60px sliver) |
| **Form settings** (1-col) | ok | ok | ok | ok | mostly ok (toolbar wrap + 10px h-scroll) |
| **Design** (3-region) | ok | ok | ok (tight) | **broken** (mode buttons wrap, preview clipped) | **collapsed** (preview ghost, presets clipped) |
| **連携・公開** (1-col) | ok | ok | ok | ok | mostly ok (toolbar wrap + 10px h-scroll) |

- Desktop (1024–1440): zero horizontal scroll, well-composed.
- Root cause: fixed-width panels (`.bd-panel` 324px / `.st-panel` 372px + rail 62px) never fold; no
  width media queries on `.bd-*`/`.st-*`. Also a 10px page h-scroll at 390 (fixed-width toolbar), and
  a ~160px center-axis jump between tabs.

## 🛠 Prioritized actions

**Quick wins (small change, high impact)** — #309 (phone key), #311 (a11y naming), #317 (duplication),
#310 (en catalog + guard test), #324 (disable dummy toggles).

**Medium (experience lift)** — #315 (handoff buttons), #316 (Records import), #314 (bilingual labels),
#313 (responsive), #318 (validation errors), #320 (honeypot).

**Finishing** — #312 (contrast/focus), #319 (whole-form preview), #322 (field types), #323 (security
follow-ups), #321 (URL-first / plain language).

## Issue index

| # | Title | Severity |
| --- | --- | --- |
| #309 | fix(i18n): add `builder.type.phone` + type-safe field-type keys | High |
| #310 | fix(i18n): complete the English catalog + ja⊆en guard test | High |
| #311 | fix(a11y): name icon-only/destructive buttons + nested-interactive | High |
| #312 | fix(a11y): 4.5:1 contrast + eliminate invisible focus | Medium |
| #313 | fix(builder): responsive layout (fields & design tabs) + toolbar | High |
| #314 | feat(builder): edit ja/en field & choice labels (locale tabs) | High |
| #315 | feat(submission): handoff buttons (Deal/Vault/Invoice) | High |
| #316 | feat(builder): import choice options from Records | High |
| #317 | feat(builder): duplicate a form + duplicate a field | High |
| #318 | fix(builder): surface per-field server validation errors | Medium |
| #319 | feat(builder): whole-form preview (all field types) | Medium |
| #320 | fix(builder): explain + enforce the honeypot | Medium |
| #321 | feat(builder): 連携・公開 URL-first + plain language | Medium |
| #322 | feat(contact-form): number / url / postal-code field types | Medium |
| #323 | fix(security): origins warning + hero.media allowlist + SRI | Medium/Low |
| #324 | chore(builder): disable not-yet-wired toggles + UX polish | Low |

## Appendix

- Screenshots (canonical builder states + the 20 responsive shots `mei-*`) live in the local,
  git-ignored `handoff/` working directory, alongside the per-issue ClaudeDesign hand-off packages.
- Test users were created during the audit (dev DB only); throwaway forms may remain.
