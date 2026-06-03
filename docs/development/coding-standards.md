# Coding Standards (binding index)

NeNe Contact is a **NENE2 consumer application**. It **inherits NENE2's coding standards**
and adds product-specific rules. **Compliance is mandatory.**

> **MUST-comply.** Every code, schema, OpenAPI, and frontend change **MUST** follow these
> documents and the NENE2 upstream they extend. Violations of naming, placement,
> layering, dependency direction, data flow, validation, error-handling, security, or
> testing rules **block merge to `main`**. A deviation requires an **ADR** (self-authority,
> ADR 0012 model) — never a silent exception.

## Binding local documents

| Topic | Document |
| --- | --- |
| **Naming (identifiers, all surfaces)** | [`naming-conventions.md`](./naming-conventions.md) |
| **Backend (architecture, DI, validation, errors)** | [`backend-standards.md`](./backend-standards.md) |
| **Multi-tenancy (resolution, scoping, RBAC)** | [`multi-tenancy.md`](./multi-tenancy.md) |
| **Audit logging (before/after, every op)** | [`audit-logging.md`](./audit-logging.md) |
| **Frontend (admin SPA + embed widget)** | [`frontend-standards.md`](./frontend-standards.md) |
| **i18n message catalog (all UI strings)** | [`i18n-message-catalog.md`](./i18n-message-catalog.md) |
| **Reuse NENE2 framework objects** | [`nene2-compliance.md`](./nene2-compliance.md) |
| **Terminology registry (canonical strings)** | [`../explanation/terminology.md`](../explanation/terminology.md) |
| **Scope (DO/DON'T)** | [`../explanation/scope-contract.md`](../explanation/scope-contract.md) |
| **Compliance charter (binding)** | [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) |
| **Commits** | [`commit-conventions.md`](./commit-conventions.md) |

## NENE2 upstream (framework source of truth)

Read at runtime under `vendor/hideyukimori/nene2/docs/development/`. Canonical online:

- coding-standards, project-layout, domain-layer, dependency-injection
- request-validation, api-error-responses, authentication-boundary
- frontend-integration, database-migrations, http-runtime, configuration

Where a NENE2 rule and a Contact document differ, **the Contact document wins for this
repo**; where Contact is silent, **NENE2 applies**. Intentional deviations from NENE2 are
recorded in a Contact ADR ([`../inheritance-from-nene2.md`](../inheritance-from-nene2.md)).

## Product rules (always)

- PHP namespace `NeneContact\`; every file `declare(strict_types=1);`; classes `final`,
  DTOs `readonly`.
- Layering: **Handler → UseCase → RepositoryInterface → Pdo*Repository**; group by domain
  concept (no `Handlers/`/`Repositories/`/`UseCases/` folders).
- JSON **snake_case**; SQL only in `Pdo*Repository`; RFC 9457 Problem Details for errors.
- Locales **`ja` / `en` only** (ADR 0011); repository docs/commits **English** (ADR 0008).
- No Concierge / Invoice / Deal / Clear / Records domain logic here; siblings over HTTP
  only (ADR 0002). No money / tax / PDF.

## Verification (when runtime lands)

```bash
composer check     # PHPUnit + PHPStan + php-cs-fixer
composer openapi   # OpenAPI contract validation
composer mcp       # MCP catalog validation
npm run check --prefix frontend
```

Self-review before PR: [`../review/`](../review/) — backend, frontend, compliance,
governance.

Last updated: 2026-06-04
