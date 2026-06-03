# Commit Conventions

NeNe Contact follows [Conventional Commits](https://www.conventionalcommits.org/) with **English** type, scope, description, and body (ADR 0008).

## Format

```
<type>(<scope>): <description> (#<issue>)
```

## Types

| type | Use |
| --- | --- |
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change without behavior change |
| `test` | Tests |
| `chore` | Maintenance |

## Rules

- Include GitHub Issue number in subject when an Issue exists.
- Do not commit secrets or `.env` files.

## Related

- NENE2: https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/commit-conventions.md
