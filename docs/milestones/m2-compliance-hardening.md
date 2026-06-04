# Milestone M2: Compliance hardening (binding gap closure)

**Phase 1–2** · elevates binding APPI requirements that are MVP-required and
acceptance-gating but not yet implemented. This is **not** a deferred backlog — public
`submit` already exists, so these gaps must close early.

## Goal

Make the binding [`data-protection-compliance.md`](../explanation/data-protection-compliance.md)
charter true in code, so a privacy/legal professional reviewing the system finds **zero
deviations** (Definition of Done A1, A4, A5).

## Acceptance criteria

- [ ] **Consent** (charter §3): per-form `consent_required` + `consent_label` (per-locale
      `ja`/`en`, ADR 0011); submit **rejected** without affirmative consent; checkbox never
      pre-checked; granted consent (label text + timestamp) stored **immutably** on the
      submission.
- [ ] **Prohibited-field registry** (charter §8, DoD A4): field config is declarative JSON
      validated against an allowed type registry; **My Number** and **raw card numbers**
      cannot be configured as any field type (structurally impossible, not merely absent);
      要配慮個人情報 is never a silent default.
- [ ] **Retention & deletion** (charter §5): configurable retention per form/org; purge job
      deletes expired submissions; two-stage **soft-delete → hard-delete** after a
      documented grace period; documented default retention (no silent indefinite hold);
      operator warned before bulk destructive action.
- [ ] **Data-subject rights** (charter §4): operator can disclose/export, correct (audited),
      and suspend/delete a submission — all auditable.
- [ ] **Secret handling** (charter §6): channel secrets and service tokens encrypted at
      rest; **no raw secrets** in logs, notifications, or exports (verified).
- [ ] **Audit** (ADR 0013, DoD A5): all of the above mutations + PII view/export are
      append-only audited with sanitized snapshots; deletion leaves an audit trail proving a
      record existed and who deleted it, without re-storing the deleted PII.

## Out of scope

- Operator-facing legal text / privacy-notice copy (operator is the data controller, §2/§9).
- GDPR / non-Japan jurisdiction coverage (Japan law only, §9).

## Compliance gate

- [ ] `docs/review/compliance.md` checklist passes for every changed area.
- [ ] A4 (prohibited fields impossible) and A5 (audit on mutation + PII access)
      demonstrable end-to-end.

## Related

- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (binding)
- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (A1, A4, A5)
- [`../review/compliance.md`](../review/compliance.md)
- ADR 0010 (embed security), ADR 0011 (bilingual), ADR 0012 (compliance/no-gate), ADR 0013 (audit)

Last updated: 2026-06-04
