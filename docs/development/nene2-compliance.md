# NENE2 Compliance (binding when runtime exists)

NeNe Contact **MUST** reuse NENE2 framework objects and conventions instead of
reimplementing them. This is the inherited-vs-overridden map and the reuse rule.

> **MUST-comply.** Reinventing a concern NENE2 already provides (responses, routing,
> pagination, auth, DB access, validation, error mapping, config) is a defect and **blocks
> merge**. Use the framework object. A justified divergence requires an ADR
> ([`../inheritance-from-nene2.md`](../inheritance-from-nene2.md)).

## Reuse these framework objects (do not reinvent)

| Concern | Use |
| --- | --- |
| JSON responses | `JsonResponseFactory` |
| Routing | `Router` / route registrars |
| Pagination | `PaginationQuery` (`items` / `limit` / `offset`) |
| Auth | `BearerTokenMiddleware`, `TokenVerifierInterface`, JWT config |
| DB access | `DatabaseQueryExecutorInterface`, `DatabaseTransactionManagerInterface` |
| Validation | `ValidationException`, `ValidationError` |
| Errors | RFC 9457 Problem Details mapping |
| DI | PSR-11 container + explicit service providers |
| Config | Typed config objects at the config-loading boundary |

## Inherited vs owned

| Concern | Source of truth |
| --- | --- |
| HTTP runtime, middleware order, PSR-7/15/17 | **NENE2** (`http-runtime`, `middleware-security`) |
| Domain layer (Handler/UseCase/Repository) | **NENE2** `domain-layer` + Contact [`backend-standards.md`](./backend-standards.md) |
| DI / wiring | **NENE2** `dependency-injection` |
| Request validation layering | **NENE2** `request-validation` |
| Problem Details | **NENE2** `api-error-responses` (Contact base URI `nene-contact.dev/problems/`) |
| Auth boundary / JWT | **NENE2** `authentication-boundary`, ADR 0008 (JWT) |
| Frontend integration baseline | **NENE2** `frontend-integration` + Contact [`frontend-standards.md`](./frontend-standards.md) |
| Naming of Contact identifiers | **Contact** [`naming-conventions.md`](./naming-conventions.md) + [`../explanation/terminology.md`](../explanation/terminology.md) |
| Embed widget, public-API security | **Contact** ADR 0010, [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md) |
| Personal-data compliance | **Contact** [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) |

## Layout (planned)

```text
src/
  Organization/  Auth/  User/
  ContactForm/  FormField/
  Submission/  SubmissionNote/
  Notification/        # EmailNotifier, SlackNotifier, ChatworkNotifier
  Webhook/
  Audit/               # AuditRecorder, audit_events (ADR 0013)
  Upstream/            # DealClient, InvoiceClient, VaultClient, RecordsClient (HTTP only)
  Http/
```

## Install & read upstream

```bash
composer require hideyukimori/nene2
# then read: vendor/hideyukimori/nene2/docs/development/
```

## Tests

- UseCase tests without a DB (in-memory repository doubles).
- PDO repository tests against the test DB (SQLite/MySQL per NENE2 strategy).
- HTTP/contract tests for public API + Problem Details shape.

## Related

- [`../inheritance-from-nene2.md`](../inheritance-from-nene2.md)
- [`coding-standards.md`](./coding-standards.md), [`backend-standards.md`](./backend-standards.md), [`naming-conventions.md`](./naming-conventions.md)

Last updated: 2026-06-04
