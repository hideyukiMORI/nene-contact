# Backend / API Self-Review (binding)

Use for any PHP, route, OpenAPI, DB, or migration change. Source of truth:
[`../development/backend-standards.md`](../development/backend-standards.md),
[`../development/naming-conventions.md`](../development/naming-conventions.md),
[`../development/nene2-compliance.md`](../development/nene2-compliance.md). Mark `N/A` only
when genuinely not applicable; do not delete items to pass.

## Checklist

- [ ] Every new file has `declare(strict_types=1);`; classes `final`, DTOs `readonly`.
- [ ] Layering respected: Handler (thin) → UseCase (`execute`, invariants) → RepositoryInterface → `Pdo*Repository`; no business logic in handlers/middleware.
- [ ] **SQL only in `Pdo*Repository`**, built on `DatabaseQueryExecutorInterface`; rows cast to typed PHP.
- [ ] Domain-grouped folders (`src/Submission/…`); no `Handlers/`/`Repositories/`/`UseCases/` layer folders.
- [ ] Input/output are typed readonly DTOs; no raw arrays or PSR-7 passed into use cases.
- [ ] Validation layered: middleware (size/content-type/JSON/auth/CORS/origin) → handler (format) → use case (invariants).
- [ ] Errors use RFC 9457 Problem Details (`nene-contact.dev/problems/…`); no stack traces/SQL/secrets/PII leaked.
- [ ] DI via PSR-11 + explicit service provider; constructor injection; no container/service-locator in domain code.
- [ ] Reuses NENE2 framework objects (`JsonResponseFactory`, `Router`, `PaginationQuery`, `BearerTokenMiddleware`, …) — nothing reinvented.
- [ ] Route prefix matches audience: `/admin/*` (JWT), `/api/*` (service token), `/public/*` (origin + rate limit + honeypot + body cap).
- [ ] Every tenant-scoped query filtered by resolved `organization_id` from the holder (`multi-tenancy.md`, ADR 0006/0014); INSERT sets it, UPDATE/DELETE/SELECT filter it; no cross-tenant access except superadmin.
- [ ] Org resolved per surface: `/admin/*` strategy + JWT org match; `/public/forms/{public_form_key}/*` via form key; `/api/*` via service token.
- [ ] Required `Capability` enforced for the route (`CapabilityResolver` + `CapabilityMiddleware`).
- [ ] Identifiers match `terminology.md`; new identifiers added to the registry in this PR.
- [ ] JSON snake_case; `operationId` matches OpenAPI + MCP catalog; no renamed shipped `operationId`.
- [ ] Migrations named `YYYYMMDDHHMMSS_snake_*` in `database/migrations/`; schema snapshot updated.
- [ ] Audit recorded for admin mutations + PII access (ADR 0013); secrets/PII not in audit snapshots.
- [ ] Sibling calls are HTTP-only via `Upstream/` clients; no shared DB (ADR 0002); handoff idempotent + failure non-destructive.
- [ ] UseCase unit tests (no DB) + `Pdo*Repository` integration tests; Problem Details shape tested.
- [ ] Compliance impact reviewed against the charter ([`compliance.md`](./compliance.md)).

Last updated: 2026-06-04
