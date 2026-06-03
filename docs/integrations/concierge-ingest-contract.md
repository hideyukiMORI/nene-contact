# Concierge Ingest Contract (draft)

**Status: draft** — binding when Concierge ships the action node and Contact ships `/api/submissions`.

## Purpose

Allow a Concierge scenario step to **create a Contact submission** so operators use one inbox.

## Flow

```
Concierge session ends step "Save to inbox"
    POST Contact /api/submissions
    Authorization: Bearer {service_token}
    Body: { source: "concierge", concierge_session_id, contact_form_id, field_values, ... }
    ← 201 { submission_id }
Concierge stores submission_id in session metadata
```

## Contact obligations

- Validate `contact_form_id` belongs to the same `organization_id` as the token.
- Map Concierge-collected fields to form field names (explicit mapping in action config).
- Apply same spam/rate rules as public API where applicable.

## Concierge obligations

- Do not duplicate submission storage in Concierge DB long-term (reference id only).
- Document when to use Contact vs built-in email action.

## Related

- ADR 0009
- [`sibling-products.md`](./sibling-products.md)

Last updated: 2026-06-03
