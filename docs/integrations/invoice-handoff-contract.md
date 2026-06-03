# Invoice Handoff Contract (draft)

**Status: draft** — binding when NeNe Invoice exposes the target `/api/*` operations and both repos accept the contract.

## Purpose

Define how a **submission** in Contact becomes a **draft client** (and optional quote) in Invoice without shared databases.

## Producer (NeNe Contact)

1. After operator confirms handoff (or auto-rule in Phase 4+), Contact calls Invoice with service token.
2. Payload includes: `external_reference` = `submission_id`, `organization_id` mapping, name, email, phone, free-text summary.
3. On success, Contact stores `invoice_client_id` (and optional `invoice_quote_id`) on `submission_link`.
4. On failure, submission remains; `handoff_status=failed` with error code preserved for admin retry.

## Consumer (NeNe Invoice)

1. Expose idempotent `POST /api/clients/draft` (or documented equivalent).
2. Reject duplicate `external_reference` with `200` + existing ids (idempotent replay).
3. Invoice remains SSOT for all billing fields.

## Auth

- Invoice issues service token scoped to `write:draft_clients` per organization.
- Contact stores token in org settings (encrypted).

## Not in scope

- Creating finalized invoices without operator action in Invoice admin.
- Payment or reconciliation.

Last updated: 2026-06-03
