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
- [ ] **Every mutating use case records an `audit_event`** with actor + `before` + `after` sanitized snapshots (create: before=null; delete: after=null) — `audit-logging.md`. A mutation without a record blocks merge.
- [ ] Audit snapshots reuse `*Response` presenters (no secrets / no full PII); PII view/export recorded (`submission.viewed`/`.exported`); trail append-only and survives deletion.
- [ ] Sibling calls are HTTP-only via `Upstream/` clients; no shared DB (ADR 0002); handoff idempotent + failure non-destructive.
- [ ] UseCase unit tests (no DB) + `Pdo*Repository` integration tests; Problem Details shape tested.
- [ ] Compliance impact reviewed against the charter ([`compliance.md`](./compliance.md)).
- [ ] **Where tenant scoping lives is stated.** Prefer `organization_id` in the SQL. If a
      repository method is unscoped and the check lives in the use case instead, say so in the
      method's docblock — the next caller does not inherit a check they cannot see.

---

## Release review — 2026-07-29 (M7 gate)

Re-run against `main` at **`8b4729e`** by the Contact lane. Every `Pdo*Repository` was opened and
read; nothing below is inferred from naming. Previous pass 2026-06-04, before service tokens,
tags, submission delete and the audit export.

**Verdict: PASS**, with one latent risk and one asymmetry recorded (neither is a live defect).

### Multi-tenancy — the item worth the most scrutiny

All 15 `Pdo*Repository` classes were checked for how the resolved `organization_id` reaches the
query. Three patterns exist, and all three are sound today:

| Pattern | Repositories | Assessment |
| --- | --- | --- |
| `organization_id` in the SQL itself | Attachment, AuditEvent, ContactForm, Media, NotificationChannel, ServiceToken, Submission, SubmissionLink, SubmissionNote, SubmissionPurge, Tag, AttachmentPurge | The default and the safest — the check cannot be forgotten by a caller. |
| Scoped by **join** to an org-scoped table | `PdoSubmissionTagRepository:50,68` — reads join `tags` on `t.organization_id = ?` | Sound: an assignment is only visible when its tag belongs to the resolved org. |
| Scoped in the **use case**, not the SQL | `PdoUserRepository:27,72,80` (`findById`, `updateRoleAndStatus`, `updatePassword`) | Sound **today**: `GetUserByIdUseCase.php:25` and `UpdateUserUseCase.php:29` both compare `organizationId` against the holder and 404 on mismatch. See the latent risk below. |

`PdoOrganizationRepository` has no `organization_id` filter **by design** — it manages the tenants
themselves and sits behind `Capability::ManageOrganizations` (`CapabilityResolver.php:17-19`),
i.e. the superadmin surface (ADR 0014).

### Latent risk (recorded, not a live defect)

**`PdoUserRepository::findById` / `updateRoleAndStatus` / `updatePassword` carry no org filter in
their SQL.** Every current caller checks the org in the use case, so there is no cross-tenant path
today — measured, not assumed. But the protection is invisible at the repository boundary: a
future caller that skips the check gets a cross-tenant read or write with no failing test. Every
other tenant-scoped repository is safe by construction instead. Filed as **#544** rather than
changed inside a review PR.

### Asymmetry (recorded)

`RemoveSubmissionTagUseCase.php` verifies the **submission**'s org but not the tag's, while
`AddSubmissionTagUseCase.php` verifies both. It is not exploitable — the join row is only
reachable through a same-org submission, so a foreign `tag_id` removes nothing — but the two
halves of one feature guard differently, which is the kind of gap that grows a defect later. It
also makes the API dishonest: removing a foreign tag returns 204 rather than 404. Filed as **#545**.

### Remaining checklist items

| Item | Verdict | Evidence |
| --- | --- | --- |
| strict_types / final / readonly | ✅ | Enforced by php-cs-fixer + phpstan lv8 in `composer check`. |
| Layering, SQL only in `Pdo*` | ✅ | `tools/conformance.php` (NENE2 rules) reports **0 errors**; the 27 baseline suppressions are pre-existing drift, none in the layering rules. |
| Route prefix ↔ audience | ✅ | `/admin/*` JWT + `CapabilityResolver`; `/api/*` service token (`ServiceApi/`); `/public/*` origin + throttle + honeypot + body cap. |
| Capability per route | ✅ | `CapabilityResolver.php` — `/admin/audit-events*` → `ViewAuditLog` covers the new export by prefix; editor denied (403 measured locally). |
| Audit on every mutation | ✅ | `tools/check-usecases-audited.php` is a merge gate; read-only use cases are an explicit allowlist with reasons. |
| Problem Details | ✅ | RFC 9457 shape via NENE2 factories; no SQL/stack traces in responses (verified on the 401/403/404 paths exercised at deploy). |
| OpenAPI ↔ MCP | ✅ | `composer check`: 61 operations, all `$ref`s resolve; MCP catalog maps 4 tools to real operations. |
| Migrations | ✅ | `database/migrations/` all `YYYYMMDDHHMMSS_snake_*`; production `phinx status` pending = 0 at 2026-07-29. |
| Sibling calls HTTP-only | ✅ | `src/Upstream/` clients only; no sibling DB credentials anywhere in `src/`. |
| Tests | ✅ | 334 tests green; use-case unit tests + repository integration tests present for the surfaces reviewed. |

### Not re-verified in this pass (declared, not assumed)

- Load/concurrency behaviour of the `ON DUPLICATE KEY` upsert in `PdoSubmissionTagRepository::add`
  under real contention (single-writer reasoning only).
- `/api/*` service-token paths against production (no production service token was issued).

Last updated: 2026-07-29 (release review for M7; previous pass 2026-06-04)
