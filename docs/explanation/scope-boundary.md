# Scope Boundary

One-page map of what NeNe Contact is relative to siblings.

```
Visitor site (any HTML)
    │ embed.js
    ▼
NeNe Contact — forms, submissions, notifications (SSOT)
    │ optional HTTP handoff
    ├── NeNe Deal      (opportunity)
    ├── NeNe Invoice   (draft client / quote)
    ├── NeNe Vault     (attachment archive)
    └── NeNe Records   (read-only select options)

NeNe Concierge ──HTTP──► Contact (ingest submission at end of scenario)
```

Contact does **not** call Clear or Profile. Billing questions in a form are text fields only until Invoice handoff exists.

See [`scope-contract.md`](./scope-contract.md) for binding DO/DON'T tables.

Last updated: 2026-06-03
