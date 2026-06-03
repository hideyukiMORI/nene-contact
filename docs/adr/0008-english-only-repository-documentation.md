# ADR 0008: English-Only Repository Documentation

## Status

accepted

## Context

NeNe Contact targets international embed use cases and aligns with NeNe Clear and NeNe Vault documentation language policy. Japanese marketing copy may live in publication-strategy or product marketing sites, not in this repository's binding engineering docs.

## Decision

- All files under `docs/`, `README.md`, `AGENTS.md`, and `.cursor/rules/` are **English**.
- GitHub Issues and PR bodies for this repo: **English** (recommended).
- Conventional Commits: English `type`, `scope`, description, and body.
- Admin UI may offer **ja + en** locales (separate ADR when UI starts).

## Consequences

**Benefits**

- Consistent with MCP/OpenAPI English contracts.

**Costs**

- Maintainers write ADRs in English.

## Related

- NeNe Vault ADR 0008 (precedent)
