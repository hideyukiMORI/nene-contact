# ADR 0002: Separate Product from Sibling NeNe Applications

## Status

accepted

## Context

NeNe Contact handles embeddable forms and submission inboxes. Siblings own chat (Concierge), billing (Invoice), pipeline (Deal), CMS (Records), documents (Vault), and bank CSV (Profile).

## Decision

- Independent repository and deployable unit.
- Dependency direction: **`NeNe Contact → sibling HTTP API`** for handoff and optional reads. Siblings may **`→ Contact`** only via documented public or service endpoints (e.g. Concierge ingest).
- **No shared database** with any sibling.
- **No embedded** Concierge, Invoice, or Records code in this repository.
- MCP tools map to **Contact OpenAPI only**.

```
Embed / Admin / MCP
    ↓
NeNe Contact API (forms, submissions, notifications)
    ↓
NeNe Contact database (owned here)
    ↓ optional HTTP
Deal · Invoice · Vault · Records
```

## Consequences

**Benefits**

- Clear OSS story; Contact usable without installing Invoice.
- Security: billing JWT ≠ contact admin JWT.

**Costs**

- Handoff failures must be retried from Contact; contract tests per sibling.

## Related

- [`../integrations/sibling-products.md`](../integrations/sibling-products.md)
- ADR 0009
