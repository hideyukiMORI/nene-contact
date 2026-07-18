# CLAUDE.md — NeNe Contact

Agent guide for this repository. Cursor summaries live in `.cursor/rules/`.

## Source of Truth

| Purpose | Document |
| --- | --- |
| Scope contract | `docs/explanation/scope-contract.md` |
| Compliance charter (binding) | `docs/explanation/data-protection-compliance.md` |
| Coding standards (binding) | `docs/development/coding-standards.md` |
| Agent entry | `AGENTS.md` |
| Workflow | `docs/workflow.md` |
| Commits | `docs/development/commit-conventions.md` |
| Current tasks (private) | `nene-origin/internal-docs/contact/todo/current.md` |
| Roadmap | `docs/roadmap.md` |

> **Operational logs moved (P3):** the live work status, handoffs, and daily
> records (`docs/todo`, `docs/daily`, field-trials equivalent) now live in the
> **private** `nene-origin/internal-docs/contact/`. Read and write them there,
> not here. Public docs keep only Diátaxis + ADR + CHANGELOG.

## Quick Rules

- **One Issue per task (MANDATORY)**: every task MUST have its own GitHub Issue before any edit. No Issue, no edit. Split multi-part work into separate Issues — one task, one Issue, one PR.
- **Auto-merge on completion (MANDATORY)**: when a task's PR is ready, it is **merged automatically** — this is standing maintainer policy, no manual approval gate. Then sync `main`.
- **Branch**: `type/issue-number-summary` from `main`; **never commit or push directly to `main`.**
- **Commits**: Conventional Commits; English type/scope and description/body (ADR 0008), `(#issue)` in subject.
- **Terminology (厳守)**: `docs/explanation/terminology.md` is the **single source of truth** for every identifier. Exact spelling only — typos, variants, or unregistered identifiers **block merge**; register new identifiers in the same PR.
- **Compliance (binding)**: `data-protection-compliance.md` is non-negotiable (APPI, Japan law only). Deviations need an **ADR** — no external 士業 sign-off gate (no money), self-authority per ADR 0012.
- **Secrets**: never commit `.env`, tokens, or credentials.
- **Framework**: NENE2 via Composer — `vendor/hideyukimori/nene2/docs/` for runtime patterns.
- **Coding rules (MUST-comply)**: inherit NENE2 conventions; follow `docs/development/` (coding-standards, naming-conventions, backend-standards, frontend-standards, nene2-compliance). Handler→UseCase→Repository→Pdo*; domain-grouped folders; snake_case JSON; SQL only in `Pdo*Repository`; reuse NENE2 objects. Violations block merge.
- **Multi-tenant by default**: every tenant-scoped query filters by resolved `organization_id` (`RequestScopedHolder<int>`); cross-tenant access is superadmin-only. Spec: `docs/development/multi-tenancy.md` (ADR 0006, ADR 0014, mirrors NeNe Records).
- **Audit every mutation**: each mutating use case records an `audit_event` with actor + before + after sanitized snapshots (who/what/how); PII view/export audited; append-only. Spec: `docs/development/audit-logging.md` (ADR 0013, mirrors NeNe Invoice). A mutation without an audit record blocks merge.
- **All UI strings in message catalogs**: no hardcoded user-facing text — every string via `t(key)` from `shared/i18n/messages/{ja,en}.ts` (ja authoritative); switching is instant/in-bundle. Spec: `docs/development/i18n-message-catalog.md` (ADR 0011). This is a **review-enforced rule**: there is no automated i18n lint yet (`composer check` and `npm run check` do not detect hardcoded strings), so reviewers must catch violations. Machine enforcement is planned for the shared-ESLint wave (Phase 1).
- **MCP**: tools map to Contact OpenAPI only; no sibling DB access.

## Product Direction

Embeddable contact forms — form SSOT in Contact, optional HTTP handoff to Deal / Invoice / Vault.

## Local Ports (fixed)

| Service | Port |
| --- | --- |
| API | **8900** |
| phpMyAdmin | **8901** |
| Frontend dev (Vite) | **8902** |
| MySQL | **3392** |

Do not use 82xx / 83xx / 84xx / 85xx lanes.

## Status

Backend foundation + compliance core + notifications/attachments done; admin SPA (`frontend/`)
and embed widget (`public_html/embed.js`) landing. Physical row deletion is forbidden — PII is
erased in place (ADR 0016). See `nene-origin/internal-docs/contact/todo/current.md`
(private) and `docs/roadmap.md`.
