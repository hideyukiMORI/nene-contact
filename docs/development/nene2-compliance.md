# NENE2 Compliance (binding when runtime exists)

NeNe Contact **must** reuse NENE2 framework objects instead of reimplementing them.

## Required patterns

| Concern | Use |
| --- | --- |
| JSON responses | `JsonResponseFactory` |
| Routing | `Router` / route registrars |
| Pagination | `PaginationQuery` |
| Auth | `BearerTokenMiddleware`, JWT config |
| DB access | `DatabaseQueryExecutorInterface`, `DatabaseTransactionManagerInterface` |
| Validation | `ValidationException`, `ValidationError` |
| Errors | RFC 9457 Problem Details |

## Layout (planned)

```
src/
  ContactForm/
  Submission/
  Notification/
  Upstream/          # Deal, Invoice, Vault, Records HTTP clients
  Http/
```

## Tests

- UseCase tests without DB where possible
- SQLite PDO tests for repositories

## Related

- [`../inheritance-from-nene2.md`](../inheritance-from-nene2.md)

Last updated: 2026-06-03
