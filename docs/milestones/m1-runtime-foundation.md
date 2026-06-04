# Milestone M1: Runtime foundation close-out

**Phase 1** · closes the runtime foundation begun in #20–#51. ✅ **Complete** (#62 → #63, 2026-06-04).

## Goal

Complete the Phase 1 runtime foundation so the admin surface no longer depends on a CLI
bootstrap for users. After M1, all admin/auth/tenant/audit/form/submission/email/OpenAPI
capability is in place on green CI.

## Status going in

Done: org domain + migrations, tenant resolution (ADR 0014), JWT login + Role/Capability
RBAC + User domain (ADR 0006), audit infrastructure (ADR 0013), ContactForm + FormField
CRUD, public `schema`/`submit` (ADR 0010), rate limiting, status workflow + operator
notes, CSV export, email notification, OpenAPI 3.1 + `composer openapi` gate.

## Acceptance criteria

- [x] Organization-scoped **user management** admin CRUD (create / list / update role /
      deactivate), org-scoped and RBAC-gated.
- [x] Every mutation records an `audit_event` with actor + before/after sanitized
      snapshots (ADR 0013).
- [x] `tools/create-user.php` remains only as an initial bootstrap; routine user lifecycle
      is API-driven.
- [x] OpenAPI updated for the new admin endpoints; `composer openapi` green.
- [x] `composer check` green (tests + phpstan lv8 + cs + openapi).

## Out of scope

- Frontend UI for user management (lands in M3 admin SPA).
- SSO / external IdP.

## Related

- [`../roadmap.md`](../roadmap.md)
- ADR 0006 (multi-tenancy & roles), ADR 0013 (audit), ADR 0014 (tenant resolution & RBAC)
- [`../development/multi-tenancy.md`](../development/multi-tenancy.md)

Last updated: 2026-06-04
