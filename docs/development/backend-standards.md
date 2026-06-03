# Backend Standards (binding when runtime lands)

NeNe Contact's backend is a **NENE2 consumer application**. NENE2's
`docs/development/` is the upstream source of truth; this document is the binding Contact
override + extension list. Where this document and NENE2 differ, **this document wins for
NeNe Contact**; where this document is silent, **NENE2 applies**.

> **Enforcement:** violations of placement, dependency direction, layering, validation, or
> error-handling rules **block merge to `main`**. Deviations require an ADR
> (self-authority, ADR 0012 model).

Read alongside: [`naming-conventions.md`](./naming-conventions.md),
[`nene2-compliance.md`](./nene2-compliance.md),
[`coding-standards.md`](./coding-standards.md),
[`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md).

Upstream NENE2 references:
[coding-standards](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/coding-standards.md),
[project-layout](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/project-layout.md),
[domain-layer](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/domain-layer.md),
[dependency-injection](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/dependency-injection.md),
[request-validation](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/request-validation.md),
[api-error-responses](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/api-error-responses.md),
[authentication-boundary](https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/authentication-boundary.md).

---

## 1. PHP baseline

- Target PHP `>=8.4`; every new file starts with `declare(strict_types=1);`.
- PSR-12 formatting (php-cs-fixer). One public class per file.
- Application classes are `final`; value objects and DTOs are `readonly`.
- Native types, enums, and small DTOs at boundaries — never unstructured arrays.
- No framework magic that hides control flow from tests, PHPStan, or AI tools.
- Public docs, OpenAPI text, and public error metadata in **English** (ADR 0008).

---

## 2. Layered architecture (the spine)

```text
HTTP handler (thin)
  → UseCase (application logic, business invariants)
    → RepositoryInterface (data access contract)
      → PdoRepositoryAdapter (persistence detail / SQL)
```

- **Use cases are independent** of HTTP, DB, templates, CLI, and the embed/admin frontend.
- Depend on **interfaces** at infrastructure boundaries.
- **Constructor injection only**; no `new` for testable dependencies; no PSR-11 container
  used as a service locator inside use cases or domain objects.
- **Group by domain concept, not by layer** (`src/Submission/…`, not `src/UseCases/…`).

### Handler (controller) boundary — thin

A handler maps the PSR-7 request into a use-case input, calls the use case, returns a
response. It does **not** contain business logic and does **not** call repositories.

```php
final class CreateSubmissionHandler
{
    public function __construct(
        private readonly CreateSubmissionUseCaseInterface $useCase,
        private readonly JsonResponseFactory $response,
    ) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $input = $this->mapper->fromRequest($request);   // format validation here
        $output = $this->useCase->execute($input);
        return $this->response->created(['id' => $output->id]);
    }
}
```

### UseCase

- One method, always `execute(InputDTO): OutputDTO`.
- Input/output are typed **readonly** DTOs — never raw arrays or PSR-7 objects.
- Enforces **business invariants** (allowed origin, honeypot, rate, consent, state rules).
- Throws **named domain exceptions** callers can act on; never echoes SQL/HTTP concerns.
- Owns no DB transaction unless it owns the boundary (then via the framework transaction
  manager, not raw PDO).

### RepositoryInterface + Pdo adapter

- Interface methods use **domain verbs** (`findById`, `existsByPublicKey`, `save`),
  return domain objects/primitives, nullable for valid "not found".
- **All SQL lives in `Pdo*Repository`**, built on
  `DatabaseQueryExecutorInterface` (not raw PDO). Cast row values to typed PHP on the way
  out. Interfaces live in the application namespace, not `src/Database/`.

---

## 3. HTTP surfaces & runtime

| Prefix | Audience | Auth |
| --- | --- | --- |
| `/admin/*` | Operator | JWT (`BearerTokenMiddleware`) + capability (ADR 0006) |
| `/api/*` | Machine clients (Concierge ingest, automation) | Service token |
| `/public/*` | Embed visitors | No JWT; **origin allowlist + rate limit + honeypot + body cap** (ADR 0010) |
| `GET /health` | Anyone | None |

- PSR-7 messages, PSR-15 middleware/handlers, PSR-17 factories. Explicit, readable route
  tables. `public_html/index.php` is the front controller.
- **Middleware order is explicit and documented.** Baseline concerns: request id, CORS
  (reflect only allowed origins, never `*` in prod), security headers, request size limit,
  JSON parse, auth — follow NENE2 `middleware-security` and `http-runtime`.
- **Multi-tenancy:** every tenant-scoped query is filtered by the resolved
  `organization_id`; cross-tenant access is prohibited (ADR 0006).

---

## 4. Request validation (layered)

```text
Middleware:  size / content-type / JSON parse / auth / CORS / request id / origin allowlist
Handler:     path/query/body mapping → readonly DTO → format & API-semantic validation
UseCase:     business invariants (uniqueness, state, consent, spam, rate-dependent rules)
```

- Convert HTTP input to **readonly DTOs/command objects before** calling a use case;
  never pass raw request arrays inward.
- Non-trivial mapping goes in a `{Verb}{Noun}InputMapper` that throws `ValidationException`
  (collecting `ValidationError` items).
- Business invariants stay in use cases (must hold for CLI, tests, and MCP too).

---

## 5. Errors & logging

- **RFC 9457 Problem Details** (`application/problem+json`) for all public JSON errors.
  Base type URI `https://nene-contact.dev/problems/{slug}` (naming §4).
- Map domain exceptions → Problem Details **at the HTTP error boundary**, not in use cases.
  Validation failures → `validation-failed` (422) with structured `errors[]`.
- **Never** leak stack traces, SQL, file paths, secrets, or private ids in responses.
- Structured logs (PSR-3) with request id; **never** log secrets, tokens, raw submission
  bodies, or full PII (charter §N1, §10).

---

## 6. Dependency injection & wiring

- PSR-11 container boundary; **explicit wiring** via small, domain-focused service
  providers (`SubmissionServiceProvider`, …). Bind interfaces, not concretes, where test
  substitution matters. Register in the runtime bootstrap (`RuntimeServiceProvider` path).
- No autowiring-by-reflection/attributes as default; no container access inside
  domain/use-case code.

---

## 7. Common framework objects (reuse, do not reinvent)

| Concern | Use (NENE2) |
| --- | --- |
| JSON responses | `JsonResponseFactory` |
| Routing | `Router` / route registrars |
| Pagination | `PaginationQuery` (`items` / `limit` / `offset`) |
| Auth | `BearerTokenMiddleware`, `TokenVerifierInterface`, JWT config |
| DB access | `DatabaseQueryExecutorInterface`, `DatabaseTransactionManagerInterface` |
| Validation | `ValidationException`, `ValidationError` |
| Errors | RFC 9457 Problem Details mapping |
| Config | Typed config objects loaded at the config boundary |

Full list and the "reuse-framework-objects" rule: [`nene2-compliance.md`](./nene2-compliance.md).

---

## 8. Database

- Migrations in `database/migrations/`, seeds in `database/seeds/`, schema snapshots in
  `database/schema/` (naming §5). Framework core stays database-independent.
- Soft-delete → hard-delete after grace for personal data; audit metadata survives
  (charter §5). Append-only `audit_events` (ADR 0013).

---

## 9. Sibling handoff (Upstream/)

- HTTP clients live in `src/Upstream/` (`DealClient`, `InvoiceClient`, `VaultClient`,
  `RecordsClient`); use cases depend on **interfaces**. HTTP only — never a shared DB
  (ADR 0002).
- Idempotent via `external_reference = submission_id`. Upstream failure **does not delete**
  the submission; surface `handoff_status=failed` with retry (audited).

---

## 10. Testing

- Unit-test use cases and domain behavior **without a DB** (inject an
  `InMemory{Entity}Repository` test double).
- Integration-test `Pdo*Repository` against the test DB (SQLite/MySQL per NENE2 strategy)
  for SQL correctness and type casting.
- HTTP/contract tests for public API behavior and Problem Details shape.
- Deterministic, small tests; builders/fixtures over hidden setup. Bug fixes ship a
  regression test.

---

## 11. Non-goals

- Active-record / ORM models; reflection or annotation DI; service-locator in domain code.
- Business logic in middleware or router callbacks.
- Money/cents/tax/PDF logic (that is NeNe Invoice — scope-contract DON'T).
- Code generation from OpenAPI/DB as the first path.

## Related

- ADR 0006 (multi-tenancy & roles), ADR 0010 (embed/public security), ADR 0013 (audit)
- [`naming-conventions.md`](./naming-conventions.md), [`nene2-compliance.md`](./nene2-compliance.md)
- Self-review: [`../review/backend-api.md`](../review/backend-api.md)

Last updated: 2026-06-04
