# Self-Review: Governance / Docs PR

Use for Phase 0 documentation PRs.

- [ ] Scope contract DO/DON'T matches ADR 0009 (Concierge) and ADR 0002 (siblings)
- [ ] No Clear/Invoice/reconciliation language presented as Contact features
- [ ] No locale beyond `ja` / `en` introduced; localized strings keyed ja/en only (ADR 0011)
- [ ] Terminology registry includes every new identifier in the PR
- [ ] English only in `docs/` and README (ADR 0008)
- [ ] Port 8900 / 8901 / 3392 documented in README and Cursor rules
- [ ] `nene-origin/internal-docs/contact/todo/current.md` (private) and milestone updated
- [ ] Public docs claim only what shipped — a Status table or roadmap that lags the code is a
      governance defect, not a cosmetic one (it makes every other claim in the repo less credible).
- [ ] An operational log lives where it survives: private `internal-docs/`, committed. A record
      left untracked in a shared worktree is one `git clean` from gone.

---

## Release review — 2026-07-29 (M7 gate)

Difference-based pass (hub ruling: governance is a diff append). Baseline 2026-06-04, when the
checklist was written for Phase 0 documentation PRs and the product had not shipped.

**Verdict: PASS**, after three drifts found and closed during this round.

| Item | Verdict | Evidence |
| --- | --- | --- |
| Scope contract DO/DON'T vs ADR 0009 / 0002 | ✅ | Unchanged since the baseline; no sibling capability has crept into Contact. Handoffs remain HTTP-only. |
| No Clear/Invoice language as Contact features | ✅ | README "Domain (binding)" table still assigns each capability to its owning product. |
| Locales `ja`/`en` only (ADR 0011) | ✅ | `locales.test.ts` fixes `SUPPORTED_LOCALES` to exactly `['ja','en']` with `ja` authoritative. The `en ⊆ ja` relation is a **type** constraint (`en.ts:4` is `Partial<MessageCatalog>`), not a test — and `en` is deliberately incomplete, with the ja fallback pinned by `i18n.test.tsx:48-51` (#310 tracks completing it). |
| Terminology registry covers new identifiers | ✅ | Verified for the identifiers added this month: `tag` / `submission_tag` (ADR 0019), `service_token`, `audit_event.exported`, `total_matched`. Each landed in the same PR as its code. |
| English only in `docs/` and README (ADR 0008) | ✅ | Holds for the public tree. Note the deliberate split: **public docs are English, PR/Issue prose is Japanese** — the audience differs. |
| Ports documented | ✅ | 8900 / 8901 / 8902 / 3392 in `CLAUDE.md`; `compose.yaml` matches (measured). |
| Private todo + milestone updated | ✅ | `internal-docs/contact/todo/current.md` refreshed 2026-07-29 (origin #393 → PR #394) after being 2 days stale. |

### Drifts found and closed this round

1. **README claimed less than shipped** — M5 still said the handoff buttons were pending (done
   2026-06-25) and nothing recorded that the product went to production on 2026-07-18. Fixed in
   #526 → #527. A README that understates the product is a governance problem: it is the first
   document an outsider reads.
2. **`current.md` said deploys were frozen** — the freeze lifted 2026-07-22 and four deploys had
   happened since. A session that trusted it would have stopped work that was already permitted.
   Fixed in origin #393 → PR #394.
3. **An operational record was not durable** — the 2026-07-24 daily sat untracked in a shared
   worktree, one `git clean` from disappearing. Committed via origin #391 → PR #392, from an
   isolated worktree so the shared checkout was never touched.

The pattern in all three: **work happened, the record did not follow.** The two new checklist
items above exist so the next reviewer looks for that specifically.

### Not re-verified in this pass (declared, not assumed)

- ADR bodies were not re-read end to end; only the ADR ↔ code relationships touched this month
  (0013, 0016, 0018, 0019, 0014) were checked.
- Cursor rules under `.cursor/rules/` were not diffed against the current standards.

Last updated: 2026-07-29 (release review for M7; previous pass 2026-06-04)
