# ADR 0006: Adopt Multi-Tenancy and Role Hierarchy as Foundational

## Status

accepted

## Context

Contact must support hosting operators and agencies running **one install for multiple client organizations**, with a **superadmin → organization admin → editor** hierarchy. Retrofitting `organization_id` later would touch every form and submission query.

NeNe Records and NeNe Profile already implement this pattern on NENE2.

## Decision

NeNe Contact is **multi-tenant from the foundation**, mirroring NeNe Records:

- Tenant-scoped tables carry **`organization_id`** (`contact_forms`, `form_fields`, `submissions`, `submission_notes`, `notification_channels`, `audit_events`, `users`).
- Per-request **organization resolution** in middleware before authorization.
- **Roles / capabilities** gate admin routes; public embed routes resolve organization via `public_form_key`.
- Submissions and forms are **never** cross-tenant listable.

## Consequences

**Benefits**

- Aligns with Suite org federation (`NENE_SUITE_ORG_EXTERNAL_ID`).

**Costs**

- Every repository method accepts org scope explicitly.

## Related

- [`../explanation/domain-model.md`](../explanation/domain-model.md)
- NeNe Records ADR 0006 (precedent)
