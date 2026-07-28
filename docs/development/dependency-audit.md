# Dependency vulnerability gate (frontend)

Every PR runs a dependency audit as a **merge gate**. This document says what the gate is,
how an exception is granted, and what is currently excepted.

- Config: [`frontend/audit-ci.jsonc`](../../frontend/audit-ci.jsonc) (the file itself carries
  the reasoning for each entry — keep the two in sync)
- Command: `npm run audit --prefix frontend`
- CI: the `Audit (fail on high/critical)` step of `Frontend CI`

## The gate

`audit-ci` fails the build on any **high** or **critical** advisory that is not explicitly
allowlisted. Moderate and below do not fail (they are still reported).

We use `audit-ci` rather than bare `npm audit --audit-level=high` for one reason: **`npm audit`
has no way to record a reasoned exception.** Without one, the only ways past a
not-yet-fixable advisory are to lower the severity threshold or drop the step — both of which
blind the gate to *everything*, not just the advisory in question.

## Rules for an exception

1. **Per advisory id, never per severity.** Allowlist `GHSA-…`; do not raise `--audit-level`
   and do not set `high: false`. A new advisory must still fail the build the day it lands.
2. **The reason must be measured, not assumed.** State why the vulnerable code path does not
   exist *in this codebase*, and how that was checked (a grep, a build artifact, a config).
   "We probably don't use that" is not a reason.
3. **Every entry has an expiry** and a named condition that removes it (an upgrade wave, an
   upstream fix). An expired entry is a task — re-argue it in a PR; do not extend it by reflex.
4. **Prefer the fix.** If a patched version exists in a range we can take, take it. An
   exception is only for "no fix exists that we can adopt".

## Overrides break things quietly

Pinning a version to dodge an advisory silences the scanner; it does **not** promise the pinned
version still speaks the API its dependents expect. This repo learned it the expensive way
(#530 → #538): collapsing the per-major `brace-expansion` pins into a flat `^5.0.8` forced v5
onto `minimatch@3`, a v1-era CJS consumer, which then threw
`TypeError: expand is not a function`. **Lint stayed green** the whole time, because minimatch@3
only reaches brace-expansion for patterns containing `{...}` — a path our config never hit.

Rules:

- **Scope an override per major** (`pkg@1` / `pkg@5`) unless every major is API-compatible and
  you have checked. Flat overrides cross major boundaries silently.
- **Add a probe** to `frontend/scripts/check-overrides.mjs` for any override that crosses a
  major. It runs as part of `npm run audit`, so the gate that hides the advisory also proves the
  fix did not break a dependent. Verified both ways: the probe exits 1 with the flat override
  and 0 with the scoped one.
- A green build is not evidence that an override is safe. Only the probe is.

## Current exceptions

| Advisory | Package | Why it does not apply here | Expires |
| --- | --- | --- | --- |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | `brace-expansion` (<=5.0.7) | The range covers the whole v1/v2 lines, which have **no fixed release** (v1 ends at 1.1.16, v2 at 2.1.3); the v5 line is fixed and we take it (`brace-expansion@5: ^5.0.8`). The residue is **dev-only**: v1/v2 arrive via eslint-plugin-import / eslint-plugin-jsx-a11y (minimatch@3) and @redocly/openapi-core (minimatch@5). Measured 2026-07-29: `npm ls brace-expansion --omit=dev` is empty and the built console bundle contains **zero** occurrences, so no version reaches a browser. The DoS needs attacker-controlled glob patterns; ours are static repo config expanded on our own CI. | **2026-08-31** |
| [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) | `react-router` (7.12.0–8.2.0) | The admin console is a **static SPA built by Vite** and served from `public_html/console/`. It uses `createBrowserRouter` with element-only routes — **no RSC mode, no server components, no server-side route `action`/`loader`, no `@react-router/dev` runtime**. The advisory's attack path (a server executing a route action before returning 400) has no counterpart in a client-only bundle. Measured 2026-07-29: `src/app/router.tsx` contains no `action:` / `loader:` keys, and the tree contains no RSC / static-handler / `@react-router/dev` import. | **2026-08-31** |

There is **no fix available in the 7.x line**: `react-router-dom` ends at 7.18.1, and the fix
lands in `react-router` v8 (≥ 8.2.1) — a different package and a breaking upgrade. The exception
is removed by the **react-router v8 migration wave** (bundled with the NENE2 RR8 re-evaluation).

## Fleet note

This setup is the **fleet reference implementation** (contact #524, 施主 GO 2026-07-29). Sibling
products may copy it — but each must **verify the RSC-unused claim in its own tree before
copying the allowlist entry**. Copying the exception without re-measuring is exactly the failure
mode the rules above exist to prevent.

## Related

- [`coding-standards.md`](./coding-standards.md) — the wider merge-gate set
- Pinning a version to dodge an advisory is a **time-limited** measure, not a fix: the pinned
  version can itself fall inside a later advisory (that is how contact's `brace-expansion`
  pins from #433 broke every PR on 2026-07-29). Prefer ranges, and revisit pins.
