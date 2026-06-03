# Workflow

NeNe Contact inherits [NENE2 workflow](https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md) with local substitutions in `docs/inheritance-from-nene2.md`.

## Standard Flow

1. Create or reuse a GitHub Issue.
2. Read `docs/roadmap.md`, `docs/milestones/`, `docs/todo/current.md`.
3. Branch `type/issue-number-summary` from `main`.
4. Implement the smallest useful change.
5. Update docs when decisions change.
6. Run `docs/review/` checklists when applicable.
7. Verify (`composer check` when runtime exists).
8. Commit — Conventional Commits, English, `(#issue)` in subject (ADR 0008).
9. PR with `Closes #number` → merge → sync `main`.

Do not commit directly to `main`.

## Scope limits

If the user requests investigation-only or no commit, follow that instruction.

Last updated: 2026-06-03
