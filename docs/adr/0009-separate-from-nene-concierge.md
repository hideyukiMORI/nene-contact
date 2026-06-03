# ADR 0009: Separate Domain from NeNe Concierge

## Status

accepted

## Context

Both products support embeddable front-office UX and can notify Slack or Chatwork. Without a hard boundary, Concierge scenarios and Contact forms duplicate each other and confuse operators ("which tool do I use?").

## Decision

### NeNe Contact owns ONLY

- Declarative **contact forms** and field validation
- **embed.js** and public submit API
- **Submission inbox**, status, export, operator notes
- Per-form **notification channels**
- Optional **HTTP handoff** to Deal / Invoice / Vault

### NeNe Contact does NOT own

- Visual **scenario graphs**, branches, or chat session state → **Concierge**
- Step actions inside a conversation (except calling Contact HTTP API as an action) → **Concierge**
- Product recommendation logic inside chat → **Concierge** (may read Records)

### Integration (one direction at a time)

```
Concierge scenario ──HTTP POST──► Contact submission API
Contact ──✗──► Concierge (no scenario editing from Contact admin)
```

Concierge stores `contact_submission_id` in session metadata when an action node posts to Contact.

### Operator guidance

| Need | Product |
| --- | --- |
| "Contact us" / support form / file upload form | **Contact** |
| Guided FAQ, qualification chat, branching sales flow | **Concierge** |
| End chat with ticket in inbox | Concierge action → Contact |

## Consequences

- Contact MVP does not import Concierge runtime or scenario JSON.
- Concierge docs link to Contact for form-shaped leads.

## Related

- [`../explanation/scope-contract.md`](../explanation/scope-contract.md)
- [`../integrations/sibling-products.md`](../integrations/sibling-products.md)
