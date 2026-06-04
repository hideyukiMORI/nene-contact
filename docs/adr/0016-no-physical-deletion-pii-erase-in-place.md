# ADR 0016: No physical deletion — PII erase-in-place, audit append-only

## Status

accepted

## Context

NeNe Contact must be auditable to a privacy/legal professional bar (scope-contract A1/A5).
Two forces meet here:

1. **Audit integrity** — the audit trail must prove *that* a record existed and *who* acted
   on it, append-only, never mutated or removed ([ADR 0013](./0013-audit-logging.md)).
2. **APPI retention/erasure** — personal data **must** be erased after the retention/grace
   window and on data-subject deletion requests; it may **not** be retained indefinitely
   ([`data-protection-compliance.md`](../explanation/data-protection-compliance.md) §4/§5).

A naive "hard delete the row" satisfies erasure but loses the audit linkage and makes
accidental/over-broad physical deletion possible across the codebase. We want a single,
defensible rule rather than ad-hoc `DELETE` statements scattered per domain.

## Decision

**No physical row deletion in application code.** Records are append-only or soft-deleted.

- **`audit_events`** is the immutable, append-only store. There is no delete path and never
  will be.
- **All domain records** (organizations, users, contact forms, submissions, notification
  channels, …) use **soft-delete** (`deleted_at` / `status`) — never `DELETE FROM`.
- **Erasure of personal data** (the APPI requirement) is performed by **erasing the PII
  columns in place** ("crypto-shred"), keeping the row and its audit linkage:
  `UPDATE submissions SET field_values_json = '[]', ip = NULL, user_agent = NULL,
  purged_at = NOW()`. The row survives so the audit trail (`submission.created` …
  `submission.deleted` … `submission.purged`) stays provable; the personal data is
  physically gone.
- **Enforcement (defense in depth):**
  1. *Code* — the unused `delete()` repository methods are removed; the purge job erases in
     place.
  2. *Gate* — `composer check` fails if `DELETE FROM` / `TRUNCATE` appears anywhere in
     `src/` (`tools/check-no-physical-delete.php`). Physical deletion is structurally
     blocked at merge (scope-contract A2).
  3. *Database* — the runtime DB user is granted `SELECT/INSERT/UPDATE` (+ DDL for
     migrations) but **not `DELETE`** (follow-up). Even a bug or raw SQL cannot physically
     delete a row.

## Consequences

**Benefits**

- Deletion is always provable (audit linkage never lost); A1/A2/A5 stronger.
- One rule, enforced at merge and (follow-up) at the database — no per-domain drift.
- APPI erasure still fully honored: PII is physically removed on retention/grace and on
  deletion requests.

**Costs**

- Purged submission rows linger (PII-stripped) rather than disappearing; storage grows
  slowly with tombstones. Acceptable — they carry no personal data.
- Erasure is an `UPDATE`, so the purge job and any future erasure must null the PII columns
  explicitly (a new PII column must be added to the erase set — covered by review).

**Follow-up**

- PR-B: revoke `DELETE` from the runtime DB user (migrations run as an admin user).

## Related

- [`data-protection-compliance.md`](../explanation/data-protection-compliance.md) §4/§5/§10
- [ADR 0013](./0013-audit-logging.md) (audit logging)
- [`scope-contract.md`](../explanation/scope-contract.md) (A1, A2, A5)
- Issue #80
