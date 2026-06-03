# ADR 0013: Audit Logging of Admin Mutations and PII Access

## Status

accepted

## Context

`data-protection-compliance.md` §10 requires that admin **mutations** and **access to
personal data** be reconstructable: a reviewer or the operator must be able to answer
*who viewed or changed what, and when*. APPI's security-control and data-subject-right
duties (correction, suspension, deletion) are only provable with such a trail.

We need one cross-cutting mechanism for all current and future domains (forms, fields,
submissions, notes, notification channels, handoff links) instead of ad-hoc logging.
This mirrors NeNe Invoice ADR 0008, adapted for a money-free, PII-centric product: here
the audited-sensitive event is **PII access**, not invoice issuance/payment.

## Decision

A dedicated `audit_event` table records one row per audited operation:

| Column | Meaning |
| --- | --- |
| `actor_user_id` | Authenticated user who performed it (null for system/public) |
| `organization_id` | Tenant the event belongs to |
| `action` | `{entity}.{verb}` (e.g. `submission.viewed`, `submission.exported`, `contact_form.updated`, `submission.deleted`, `handoff.retried`) |
| `entity_type` / `entity_id` | What was acted on |
| `before_json` / `after_json` | **Sanitized** snapshots (null for create/delete sides) |
| `created_at` | When |

- **Recorded in the UseCase** via an `AuditRecorder`: the use case has tenant/actor
  context and the before/after state and names the business action. Handlers pass the
  actor user id from token claims.
- **Sanitized snapshots** reuse the same response presenters used for API output, so
  **secrets (channel config, tokens) and full PII payloads are never written** to the
  audit log. Field-level diffs are derivable from the two snapshots.
- **Mutations audited:** all admin create / update / delete (soft delete records a
  `*.deleted` action with the before snapshot).
- **PII access audited:** admin **view** and **export** of a submission containing
  personal data record `submission.viewed` / `submission.exported` (charter §4, §11).
  Ordinary list views and non-PII reads are not audited.
- **Append-only.** Audit rows are never mutated or deleted; deletion of a submission
  leaves its audit trail intact (charter §5).
- New domains record audit from the start.

## Consequences

**Benefits**

- Uniform, compliance-aligned trail of who accessed/changed personal data.
- Secrets and PII excluded by reusing sanitized presenters.
- Makes APPI data-subject-right handling provable.

**Costs / limitations**

- Use cases gain an `AuditRecorder` dependency and an `actorUserId` argument.
- Recording PII *access* (reads) adds write volume on hot read paths; scope it to
  submission view/export only.

**Follow-up**

- `GET /admin/audit-events` read endpoint for admins/superadmin.
- Make mutation + audit atomic via a transaction boundary when runtime lands.

## Related

- Compliance: [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) §10
- ADR 0006 (multi-tenancy & roles), ADR 0012 (compliance binding)
- NeNe Invoice ADR 0008 (audit-logging precedent)
