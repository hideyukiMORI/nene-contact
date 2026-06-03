# Contributing

NeNe Contact is built through small, Issue-driven changes.

## Required Reading

| Topic | Document |
| --- | --- |
| NENE2 inheritance | [`docs/inheritance-from-nene2.md`](inheritance-from-nene2.md) |
| Scope contract | [`docs/explanation/scope-contract.md`](explanation/scope-contract.md) |
| Terminology registry | [`docs/explanation/terminology.md`](explanation/terminology.md) |
| Commit conventions | [`docs/development/commit-conventions.md`](development/commit-conventions.md) |
| Workflow | [`docs/workflow.md`](workflow.md) |
| Agents | [`AGENTS.md`](../AGENTS.md) |

## Collaboration Policy (binding)

1. **One task = one Issue.** Create a dedicated GitHub Issue **before** editing; split
   multi-part work into separate Issues. No Issue, no edit.
2. Branch from `main` as `type/issue-number-summary`. **Never push directly to `main`.**
3. Implement, verify (`composer check` when applicable), commit with `(#issue)`.
4. Push, open PR with `Closes #number`, then **merge automatically on completion**
   (`gh pr merge --merge --delete-branch`) — standing maintainer policy, no manual gate.

## Secrets

Do not commit passwords, tokens, production credentials, or local `.env` files.

## Engineering Theme

- Embeddable forms and submission inbox only (ADR 0009)
- HTTP-only sibling handoff (ADR 0002)
- OpenAPI before UI assumptions
- MCP through documented HTTP boundaries only

## Upstream Framework

[NENE2](https://github.com/hideyukiMORI/NENE2) — see `vendor/hideyukimori/nene2/docs/` after `composer install`.
