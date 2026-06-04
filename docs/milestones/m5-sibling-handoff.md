# Milestone M5: Sibling handoff

**Phase 3** · optional HTTP handoff of qualified submissions to sibling apps — over HTTP
only, never a shared database (ADR 0002). 🚧 **Deal handoff landed**; Vault attachment
archive is the next slice.

## Goal

An operator can hand a qualified submission to **NeNe Deal** (create opportunity) or
**NeNe Vault** (archive attachment) over HTTP. Contact remains the SSOT for submissions;
siblings remain SSOT for their domains. Failures never destroy the submission.

## Acceptance criteria

- [x] **`src/Upstream/`** HTTP clients introduced; UseCases depend on interfaces (not
      concrete clients), per sibling-products implementation rules. (#112 — `DealClientInterface`)
- [x] **Contact → Deal**: create `opportunity` from a submission, idempotent via
      `external_reference = submission_id` (DO D11, Phase 3+). (#112)
- [ ] **Contact → Vault**: upload a submission attachment as a received document (DO D12,
      Phase 3+). — next M5 slice.
- [x] **`SubmissionLink`** stores sibling IDs (`deal_opportunity_id`, `vault_document_id`,
      …) after HTTP success (DO D11). (#112 — `submission_links`, one row per target)
- [x] **Non-destructive failure**: upstream failure does not delete the submission; surface
      `handoff_status=failed` with **retry in admin** (`POST /admin/submissions/{id}/handoffs/deal`). (#112)
- [x] Handoff attempts and retries are audited (ADR 0013, DO D8) — `handoff.created` /
      `handoff.retried`, ids only (no PII). (#112)
- [x] Environment variables per sibling-products (`NENE_DEAL_*`, `NENE_VAULT_*`); service
      tokens sent as bearer credentials, never logged. (#112 — Deal vars wired; Vault next slice)

## Out of scope

- Contact → Invoice draft client and Contact → Records read (Phase 4+, M6).
- Concierge → Contact ingest (Phase 4+, M6).
- Any sibling business logic — Contact only posts/links over HTTP (DON'T X1–X8).

## Related

- [`../integrations/sibling-products.md`](../integrations/sibling-products.md)
- [`../integrations/invoice-handoff-contract.md`](../integrations/invoice-handoff-contract.md) (draft, M6)
- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (D8, D11, D12; X8)
- ADR 0002 (separate from siblings)

Last updated: 2026-06-04
