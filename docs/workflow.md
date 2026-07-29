# Workflow

NeNe Contact inherits [NENE2 workflow](https://github.com/hideyukiMORI/NENE2/blob/main/docs/workflow.md) with local substitutions in `docs/inheritance-from-nene2.md`.

## Binding policy (MUST)

- **One task = one Issue = one PR.** Every task **MUST** have its own GitHub Issue created
  **before** any edit. No Issue, no edit. Multi-part work **MUST** be split into separate
  Issues — do not bundle unrelated tasks into one Issue or one PR.
- **Auto-merge on completion.** When a task's PR is ready, it **MUST** be merged
  **automatically** (`gh pr merge --squash --delete-branch`). This is standing
  maintainer-authorized policy; there is **no manual approval gate**.
- **Never commit or push directly to `main`.**

### Merges are squashed — judge "merged" by PR state, not by the commit graph

Since PR #359 (2026-07-08) every PR lands as a **single squashed commit**; the 138 merge
commits before that are history. A squashed branch shares **no commit** with `main`, so:

```bash
git merge-base --is-ancestor <branch> main   # ← says "not merged" for MERGED branches. Do not use.
gh pr list --head <branch> --state all --json number,state,headRefOid   # ← the answer
```

Before deleting any branch, confirm its tip SHA equals the head SHA of a `MERGED` PR. A branch
with **no PR** may still be safe — check `git merge-base --is-ancestor <sha> main` — but if it is
neither a PR head nor reachable from `main`, **tag it before deleting**; a squashed stack cannot
be recovered from GitHub's PR refs.

Likewise, `git branch -r` is a **local cache** and keeps refs for branches deleted on the remote.
Never report it as the state of the remote — run `git fetch --prune`, and read `git ls-remote
--heads origin` when the remote itself is the question.

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
10. If you used a `git worktree`, remove it — a left-behind worktree pins its branch and blocks
    `--delete-branch`.

## Scope limits

If the user requests investigation-only or no commit, follow that instruction — it
overrides the auto-merge policy for that request only.

Last updated: 2026-07-30
