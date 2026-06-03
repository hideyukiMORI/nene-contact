# Sibling Product Integration

NeNe Contact integrates with other NeNe ecosystem products **via HTTP only**. See ADR 0002.

## Dependency direction

```
NeNe Concierge  →  HTTP  →  NeNe Contact   (ingest submission — Phase 4+)
NeNe Contact    →  HTTP  →  NeNe Deal      (create opportunity — Phase 3+)
NeNe Contact    →  HTTP  →  NeNe Invoice   (draft client / quote — Phase 4+)
NeNe Contact    →  HTTP  →  NeNe Vault     (attachment archive — Phase 3+)
NeNe Contact    →  HTTP  →  NeNe Records   (read select options — Phase 4+)
```

Never embed sibling code. Never share databases.

## Planned integrations

| Sibling | Direction | Use case | Phase |
| --- | --- | --- | --- |
| **NeNe Deal** | Contact → Deal | Create `opportunity` from submission (`external_reference=submission_id`) | 3+ |
| **NeNe Invoice** | Contact → Invoice | Create draft `client` (+ optional `quote`) from submission | 4+ |
| **NeNe Vault** | Contact → Vault | Upload submission attachment as received document | 3+ |
| **NeNe Records** | Contact → Records (read) | Populate `select` field options from entity API | 4+ |
| **NeNe Concierge** | Concierge → Contact | Scenario action posts submission at end of flow | 4+ |
| **NeNe Clear** | — | No default integration | — |
| **NeNe Profile** | — | No default integration | — |
| **NeNe Corpus** | — | No default integration (may coexist on same site) | — |

## Contact service API (planned)

Machine clients (Concierge, Suite automation) use **`/api/*`** with service bearer tokens:

- `POST /api/submissions` — ingest with `source` (`concierge`, `import`, …)
- `GET /api/submissions/{id}` — read for automation

Admin operators use **`/admin/*`** with JWT.

Public visitors use **`/public/forms/{public_form_key}/…`** without JWT.

## Environment variables (planned)

| Variable | Purpose |
| --- | --- |
| `NENE_DEAL_API_BASE_URL` | Deal handoff |
| `NENE_DEAL_SERVICE_TOKEN` | Scoped write |
| `NENE_INVOICE_API_BASE_URL` | Invoice handoff |
| `NENE_INVOICE_SERVICE_TOKEN` | Scoped write to Invoice `/api/*` |
| `NENE_VAULT_API_BASE_URL` | Attachment upload |
| `NENE_VAULT_SERVICE_TOKEN` | Scoped write |
| `NENE_RECORDS_API_BASE_URL` | Read-only catalog |
| `NENE_RECORDS_BEARER_TOKEN` | Read token |
| `NENE_CONCIERGE_WEBHOOK_SECRET` | Verify inbound signed posts from Concierge (optional) |

HTTP clients live in `src/Upstream/` when runtime lands. UseCases depend on interfaces.

## Implementation rules

- Upstream failures **do not delete** the submission; surface `handoff_status=failed` with retry in admin.
- Idempotent handoff using `external_reference` = Contact `submission_id`.
- Contract tests when sibling OpenAPI stabilizes.

## Reporting bugs

| Symptom | Open Issue in |
| --- | --- |
| Deal opportunity API missing fields | nene-deal |
| Invoice draft-client endpoint | nene-invoice |
| Concierge action cannot POST Contact | nene-concierge |
| NENE2 middleware / Problem Details | NENE2 |

## Related

- [`invoice-handoff-contract.md`](./invoice-handoff-contract.md) (draft)
- [`concierge-ingest-contract.md`](./concierge-ingest-contract.md) (draft)

Last updated: 2026-06-03
