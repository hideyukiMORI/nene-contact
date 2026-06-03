# ADR 0001: Inherit NENE2 Governance and Workflow

## Status

accepted

## Context

NeNe Contact is a consumer application built on [NENE2](https://github.com/hideyukiMORI/NENE2). The maintainer wants the same engineering discipline as sibling NeNe products — Issue-driven workflow, Conventional Commits, self-review checklists, and AI-readable documentation — without copying the entire NENE2 documentation tree.

## Decision

Adopt NENE2 governance patterns locally:

- Issue-driven development with `type/issue-number-summary` branches
- Conventional Commits (English per ADR 0008; Issue number in subject)
- Self-review checklists under `docs/review/`
- ADR policy under `docs/development/adr.md`
- AI agent entry via `AGENTS.md`, `CLAUDE.md`, and `.cursor/rules/`
- Inheritance map in `docs/inheritance-from-nene2.md`

Framework HTTP, middleware, validation, embed security, and MCP behavior remain defined by NENE2 unless this repository records an explicit deviation.

## Consequences

**Benefits**

- Single local entry point for contributors and AI agents.
- Product rules (forms, embed, privacy) stay separate from framework rules.

**Costs**

- Two documentation layers when NENE2 policy changes materially.

## Related

- NENE2 workflow: https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md
- `docs/inheritance-from-nene2.md`
