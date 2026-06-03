# CLAUDE.md — NeNe Contact

Agent guide for this repository. Cursor summaries live in `.cursor/rules/`.

## Source of Truth

| Purpose | Document |
| --- | --- |
| Scope contract | `docs/explanation/scope-contract.md` |
| Agent entry | `AGENTS.md` |
| Workflow | `docs/workflow.md` |
| Commits | `docs/development/commit-conventions.md` |
| Current tasks | `docs/todo/current.md` |
| Roadmap | `docs/roadmap.md` |

## Quick Rules

- **Issue-driven**: no Issue, no substantive edit (unless user limits scope).
- **Branch**: `type/issue-number-summary` from `main`; never commit directly to `main`.
- **Commits**: Conventional Commits; English type/scope and description/body (ADR 0008), `(#issue)` in subject.
- **Secrets**: never commit `.env`, tokens, or credentials.
- **Framework**: NENE2 via Composer — `vendor/hideyukimori/nene2/docs/` for runtime patterns.
- **MCP**: tools map to Contact OpenAPI only; no sibling DB access.

## Product Direction

Embeddable contact forms — form SSOT in Contact, optional HTTP handoff to Deal / Invoice / Vault.

## Local Ports (fixed)

| Service | Port |
| --- | --- |
| API | **8900** |
| phpMyAdmin | **8901** |
| MySQL | **3391** |

Do not use 82xx / 83xx / 84xx / 85xx lanes.

## Status

Phase 0 governance. See `docs/todo/current.md`.
