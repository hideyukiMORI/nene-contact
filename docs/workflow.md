# Workflow

NeNe Contact inherits [NENE2 workflow](https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md) with local substitutions in `docs/inheritance-from-nene2.md`.

## Binding policy (MUST)

- **One task = one Issue = one PR.** Every task **MUST** have its own GitHub Issue created
  **before** any edit. No Issue, no edit. Multi-part work **MUST** be split into separate
  Issues — do not bundle unrelated tasks into one Issue or one PR.
- **Auto-merge on completion.** When a task's PR is ready, it **MUST** be merged
  **automatically** (`gh pr merge --merge --delete-branch`). This is standing
  maintainer-authorized policy; there is **no manual approval gate**.
- **Never commit or push directly to `main`.**

## Standard Flow

1. **Create one GitHub Issue for the task** (reuse only if it is genuinely the same task).
2. Read `docs/roadmap.md`, `docs/milestones/`, and the private `nene-origin/internal-docs/contact/todo/current.md`.
3. Branch `type/issue-number-summary` from `main`.
4. Implement the smallest useful change.
5. Update docs when decisions change.
6. Run `docs/review/` checklists when applicable.
7. Verify (`composer check` when runtime exists).
8. Commit — Conventional Commits, English, `(#issue)` in subject (ADR 0008).
9. Push, open PR with `Closes #number`, **auto-merge** when checks pass (or immediately while no CI exists), delete branch, sync `main`.

## Scope limits

If the user requests investigation-only or no commit, follow that instruction — it
overrides the auto-merge policy for that request only.

Last updated: 2026-06-04
