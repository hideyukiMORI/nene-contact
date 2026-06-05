# ADR 0017: Admin inbox is masked-by-default; filtering/search run server-side

## Status

accepted

## Context

The admin submissions list (`GET /admin/submissions`) originally serialized **raw**
`field_values` for **every** row, unaudited. The admin SPA inbox then displayed the sender
and searched content client-side over a fetched window — an **unaudited bulk PII disclosure**.

This is inconsistent with the rest of the platform's PII model
([`data-protection-compliance.md`](../explanation/data-protection-compliance.md) §11,
[ADR 0013](./0013-audit-logging.md)):

- The **agent / MCP** read surface returns **redacted (masked)** payloads by default — *not*
  audited, because no PII is disclosed — and only the explicit `include_pii=true` path returns
  raw values, which **is** audit-logged.
- **Bulk PII export** (CSV) is allowed only via the documented admin path and is **audit-logged**.

So the platform already treats *bulk raw PII* as an audited, explicit event. The admin inbox
list was the one surface handing out raw bulk PII with no audit and no masking.

A second force: doing search/filtering client-side requires shipping enough data to the
client to search — i.e. shipping PII in bulk — which is exactly what we want to avoid.

## Decision

1. **The admin inbox list is masked by default.** `GET /admin/submissions` serializes
   `field_values` through `PiiMasker::maskValues` (the same redaction the agent surface uses).
   The bulk list never discloses raw PII, so — consistent with the agent redacted read — it is
   **not** audited. Full content remains available only on the **single** submission detail
   (an intentional, per-record disclosure), and CSV export remains the audited bulk path.

2. **Filtering and search run server-side.** The list accepts `status`, `contact_form_id`,
   `from`, `to`, and `q` (free-text over submitted content). The server matches raw content but
   returns only masked rows, so raw values are never shipped in bulk to the client. The
   response includes `status_counts` for the current query so the status tabs stay accurate
   without a second round-trip. This keeps the inbox correct and scalable instead of filtering
   a client-held window.

The sender shown in the inbox is therefore a **masked** value (e.g. `j***@e***.com`); operators
open the detail for the full content.

## Consequences

- No surface returns raw bulk PII without an audit record; the admin inbox aligns with the
  agent/MCP redaction model and §11.
- The frontend no longer holds or searches raw PII; it drives a server query.
- A future "reveal/export with audit" affordance, if wanted in the inbox, would follow the
  existing `include_pii=true` + audit pattern rather than reintroducing bulk raw reads.
