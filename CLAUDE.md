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

- **One Issue per task (MANDATORY)**: every task MUST have its own GitHub Issue before any edit. No Issue, no edit. Split multi-part work into separate Issues — one task, one Issue, one PR.
- **Auto-merge on completion (MANDATORY)**: when a task's PR is ready, it is **merged automatically** — this is standing maintainer policy, no manual approval gate. Then sync `main`.
- **Branch**: `type/issue-number-summary` from `main`; **never commit or push directly to `main`.**
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
