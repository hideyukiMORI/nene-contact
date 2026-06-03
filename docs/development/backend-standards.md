# Backend Standards (draft)

Applies when PHP runtime lands. Inherited from NENE2 and NeNe Profile patterns.

## Architecture

- Domain-grouped folders under `src/` (`ContactForm/`, `Submission/`, …)
- Thin `Handler` classes
- `UseCase` + `RepositoryInterface` + `Pdo*Repository`
- No SQL outside repositories

## HTTP surfaces

| Prefix | Audience |
| --- | --- |
| `/admin/*` | Operator JWT |
| `/api/*` | Service token (Concierge ingest, automation) |
| `/public/*` | Embed visitors (origin + rate limit) |

## Multi-tenancy

Every tenant table query includes `organization_id` from resolved org context.

## Related

- ADR 0006
- [`nene2-compliance.md`](./nene2-compliance.md)

Last updated: 2026-06-03
