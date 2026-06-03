# ADR 0010: Embed and Public API Security

## Status

accepted

## Context

Public endpoints are exposed to arbitrary websites and bots. Contact must resist spam and credential stuffing without breaking legitimate embeds.

## Decision

1. **Allowed origins** — server-side check on `Origin` / `Referer` against per-form allowlist.
2. **Rate limiting** — per IP and per `public_form_key` on submit (NENE2 throttle middleware).
3. **Honeypot** — required field type; silent accept on trip (no error detail to bots).
4. **Body size cap** — reject oversized JSON before parsing field values.
5. **No PII in URLs** — form keys only in path; never email in query string.
6. **CORS** — reflect only allowed origins; no `*` in production config.
7. **embed.js** — static asset with Subresource Integrity hash documented in operator guide (Phase 2).

## Consequences

- Operators must maintain allowlist when staging domains change.
- Security tests required in CI for public routes (Phase 1+).

## Related

- [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md)
- [`../explanation/privacy-and-spam-compliance.md`](../explanation/privacy-and-spam-compliance.md)
