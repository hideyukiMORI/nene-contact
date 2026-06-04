# Milestone M6: AI/MCP + deeper siblings

**Phase 4** · expose Contact to AI agents via MCP over the OpenAPI surface, and complete
the deeper sibling integrations.

## Goal

AI agents operate on Contact through **MCP tools mapped to Contact OpenAPI only** — never a
sibling database (ADR 0002) — read-first, with writes gated by confirmation + audit. The
remaining sibling directions (Invoice, Records, Concierge ingest) come online.

## Acceptance criteria

- [ ] **MCP read catalog** over the OpenAPI surface (DO D10): forms and submissions; returns
      **redacted** payloads by default (no IP/UA, masked PII); `include_pii=true` is an
      explicit admin tool and is **audit-logged** (charter §11).
- [ ] **MCP write tools** require an explicit **write tool + confirmation token** and are
      audited; **no autonomous outbound action** on personal data (charter §11, DON'T X9).
- [ ] MCP maps to Contact OpenAPI only — no sibling DB access (ADR 0002).
- [ ] **Contact → Invoice**: create draft `client` (+ optional quote) from a submission,
      idempotent, service token (Phase 4+).
- [ ] **Contact → Records (read)**: populate `select` field options from the entity API
      (read-only, Phase 4+).
- [ ] **Concierge → Contact ingest**: `POST /api/submissions` with `source=concierge` via
      service bearer token; inbound posts verified (`NENE_CONCIERGE_WEBHOOK_SECRET`).
- [ ] OpenAPI covers `/api/*` service surface; mutations audited; `composer check` green.

## Out of scope

- Auto-sending operator email replies (DON'T X9 — draft-only AI only).
- Executing Concierge scenario graphs in Contact (DON'T X1).

## Related

- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (§11 AI/MCP)
- [`../integrations/concierge-ingest-contract.md`](../integrations/concierge-ingest-contract.md) (draft)
- [`../integrations/invoice-handoff-contract.md`](../integrations/invoice-handoff-contract.md) (draft)
- [`../integrations/sibling-products.md`](../integrations/sibling-products.md)
- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (D9, D10; X1, X9)
- ADR 0002 (HTTP-only siblings)

Last updated: 2026-06-04
