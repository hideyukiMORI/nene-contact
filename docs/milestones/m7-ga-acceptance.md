# Milestone M7: GA / acceptance

**Phase 4** · the GOAL. NeNe Contact is "done right" at the bar a privacy/legal
professional (士業) would accept. ✅ **Closed 2026-07-29**: A1–A8 acceptance verified (#130),
operator guide (#132), production `embed.js` build (#330/#334, stable alias #405), and the four
release reviews re-run against the release — all **PASS** (#541→#542, #543→#546, #547→#549,
#548→#550). Declaring GA is a separate maintainer decision and is not part of this milestone.

## Goal

Pass the full **Definition of Done & Professional Acceptance Standard (A1–A8)** in
[`scope-contract.md`](../explanation/scope-contract.md), ship operator documentation, and
produce a production `embed.js` build. After M7 the product meets its GOAL.

## Acceptance criteria (A1–A8)

✅ **Verified with code evidence in [`../review/acceptance-A1-A8.md`](../review/acceptance-A1-A8.md) (#130).**

- [x] **A1** — A privacy/legal professional reviewing the system finds **zero deviations**
      from `data-protection-compliance.md`.
- [x] **A2** — Every DON'T row is **structurally impossible**, not merely unimplemented.
- [x] **A3** — Every public endpoint meets ADR 0010 (allowed-origins, rate limit, honeypot,
      body cap, no PII in URLs, CORS not `*`).
- [x] **A4** — Prohibited fields (My Number, raw card numbers) cannot be configured;
      要配慮個人情報 is never a silent default.
- [x] **A5** — Admin mutations and PII view/export are audit-logged; deletion leaves an
      audit trail.
- [x] **A6** — Locales are `ja`/`en` only; no general i18n framework.
- [x] **A7** — Siblings reached over HTTP only; no shared database.
- [x] **A8** — Any binding deviation is recorded in an ADR (maintainer self-authority; no
      external sign-off gate, ADR 0012).

## Operational deliverables

- [x] **Operator documentation**: TLS-required checklist; cross-border / non-Japan visitor
      responsibility (charter §9); privacy-notice surface guidance (operator is the data
      controller). → [`../operations/operator-guide.md`](../operations/operator-guide.md) (#132)
- [x] **Production `embed.js` build**: hashed long-cache filename, CSP-friendly (no `eval`,
      no inline script from API responses). → minified + content-hashed build with an SRI
      manifest (#330 → #331), SRI in the install snippet (#334 → #335), stable
      `/embed/embed.js` alias (#404 → #405). The frontend review re-measured `eval(` = 0 and
      the deployed `integrity` against an independent rebuild.
- [x] Compliance self-review (`docs/review/compliance.md`) and governance/backend/frontend
      reviews all pass on the release. → re-run against `main@8b4729e` and merged 2026-07-29
      (#541 → #542, #543 → #546, #547 → #549, #548 → #550); every verdict **PASS**, each with
      its open items recorded rather than closed silently.

## Out of scope

- Anything in the permanent DON'T list (scope-contract X1–X14).
- 士業 sign-off as a blocking gate (Contact handles no money — ADR 0012).

## Related

- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (A1–A8, DON'T)
- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (binding)
- [`../review/compliance.md`](../review/compliance.md), [`../review/governance.md`](../review/governance.md), [`../review/backend-api.md`](../review/backend-api.md), [`../review/frontend.md`](../review/frontend.md)
- ADR 0010, ADR 0011, ADR 0012

> Status note (2026-07-29): the two remaining GA items — the production `embed.js` build and the
> four release review docs — are both done, so this milestone is closed. What the reviews left
> open is deliberately visible: reCAPTCHA and a duplicate-submission guard are **not**
> implemented (compliance), `PdoUserRepository` carries its tenant scope in the use cases rather
> than in SQL (#544, latent — no cross-tenant path exists today), and tag removal validates the
> submission's organization but not the tag's (#545, asymmetric — not exploitable). None is a
> charter deviation; all three are recorded, not hidden.

Last updated: 2026-07-29
