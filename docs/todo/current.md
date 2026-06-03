# Current TODO

**Phase 0 — Governance** 🔄 in progress on branch `docs/1-governance-foundation`

## Phase 0 checklist

- [x] Repository scaffold (README, LICENSE, AGENTS, CLAUDE, Cursor rules)
- [x] Scope contract, embed spec, privacy compliance, terminology
- [x] ADRs 0001, 0002, 0006, 0007, 0008, 0009, 0010
- [x] Sibling integration map + draft handoff contracts
- [ ] GitHub Issue #1 + PR merge to `main`
- [ ] Add NeNe Contact row to publication-strategy family copy (optional follow-up)

## Next (Phase 1)

- [ ] #4 Runtime scaffold — NENE2 app, `GET /health`, composer, CI
- [ ] #5 Multi-tenant organization + auth (ADR 0006)
- [ ] #6 OpenAPI 3.1 baseline

## Handoff notes

- Concierge boundary: ADR 0009 — no scenario engine in Contact.
- Invoice handoff: draft contract in `docs/integrations/invoice-handoff-contract.md`; awaits Invoice `/api/*` endpoints.
- Local ports: API **8900**, phpMyAdmin **8901**, MySQL **3391**.

Last updated: 2026-06-03
