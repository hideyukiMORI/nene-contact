# Records Native Embed Contract (draft)

**Status: draft** — binding when NeNe Records ships the first-party block + SSR render + server-to-server relay, and the owner gives GO. The contact side (service-token primitive + ingest) landed ahead of records (#386/#388); this document is the interface records builds against.

Design record: `_work/reports/contact-records-native-embed-contract-sketch-2026-07-17.md` (hub-approved) and `_work/discussion-log/2026-07-17.md` (案1 selection). Mirrors the reciprocal `nene-clear/docs/integrations/invoice-upstream-contract.md` shape.

## Purpose

Let a Records public site render a **first-party** Contact form (same-origin, no CSP change, no client-exposed token) and relay the submission to Contact server-to-server. The visitor never leaves Records; Contact remains the SSOT for forms, submissions, notifications, and audit.

## Flow

```
Author places a declarative nene-contact block (references a public_form_key)
Records SSR renders the first-party form (inline / modal / chat variants)
Visitor submits → Records backend
    POST {contact}/api/submissions
    Authorization: Bearer {service_token}         # per-org, server-held, never sent to the browser
    Body: { source: "first_party", contact_form_id, consent?, field_values{...} }
    ← 201 { id, status, source }
Contact records the submission, notifies, and sends the sender auto-reply as usual.
```

## Auth — per-organization service token

Contact **issues** the token; Records **stores** it server-side and presents it. (Same direction as Concierge → Contact; the issuer is the receiver, so the JWT signing secret never leaves Contact — Records only ever holds an opaque Bearer string.)

| Aspect | Contract |
| --- | --- |
| Kind | Stateless HMAC JWT with `org`, `scopes`, `jti`, `sub`, `iat`, `exp` claims. The value is **never stored** by Contact — only the `jti` + metadata, in the `service_tokens` registry. |
| Header | `Authorization: Bearer <jwt>`. Org is taken from the token's `org` claim, **not** the URL. |
| Scope | `ingest:submissions` (org-level). A form-limited variant (`ingest:form:{id}`) is a deferred option. |
| Subject | `service:records` by default; another first-party site issues under its own `service:{name}`. |
| Issue | `POST /admin/service-tokens` (ManageSettings, audited). Plaintext returned **once** in the 201 body, never again. |
| List / revoke | `GET /admin/service-tokens`, `DELETE /admin/service-tokens/{id}` (soft `revoked_at`, idempotent). Revocation takes effect immediately (request-time `jti` check). |
| No-jti rejection | A token lacking a `jti` claim is rejected `401` — Contact issues every token with one, so a missing `jti` is never exempt from revocation. |

### TTL policy (hub review, point 3)

A records connect token is a **permanent integration credential**, so issuance TTL is bounded **1 hour … 1 year** with the **default at the maximum (1 year)** — never a short default that would silently expire the link. Operate it by **revocation** (kill compromised/retired tokens via `DELETE`) or **renewal** (issue a fresh token before expiry and swap it in on the Records side). Do not rely on short-lived rotation.

### Token storage discipline (Records side)

Because the JWT is a bearer credential, Records MUST store it encrypted at rest, mask it in any admin UI, and keep it out of logs/error payloads. Contact holds no copy to leak (registry stores `jti` + metadata only).

## Endpoint — `POST /api/submissions`

Reuses the existing service ingest endpoint (also used by Concierge via the machine key). Request/response/errors are in `docs/openapi/openapi.yaml` (`agentIngestSubmission`).

- **Request**: `{ source: "first_party", contact_form_id, consent?, field_values{...} }`. `field_values` are validated against the form (required, email format, consent when the form requires it) exactly like the public submit. Only schema-declared fields are stored (purpose limitation); no honeypot field is expected (see Records obligations).
- **Success**: `201 { id, status, source }`.
- **Errors** (RFC 9457, invoice-aligned): `401 unauthorized` (bad/expired/missing token or missing `jti`), `401 service-token-revoked`, `403 insufficient-scope` (not a service principal, or lacks `ingest:submissions`), `422 validation-failed`, `429 rate-limited`.
- **Reading the form to render**: Records fetches the form schema server-side via the existing public `GET /public/forms/{public_form_key}/schema` (no PII, no auth needed). No new read endpoint is required.

### Auth carve-out semantics (hub review, point 2)

`POST /api/submissions` is carved out of the NENE2 static machine-key gate via `machineApiKeyExcludedPaths`, which matches **exact paths only** (NENE2 `ApiKeyAuthenticationMiddleware` — `excludedPaths` are exact, not prefixes). So exactly the one path `/api/submissions` is owned by `ServiceApiAuthMiddleware`; sibling paths like `/api/submissions/{id}` and the rest of `/api/*` (the MCP agent read surface) remain under the `/api/` prefix machine-key gate, unchanged. On the carved-out path the dispatcher chooses Bearer-vs-static with **no fall-through**: an `Authorization: Bearer` header commits to the service-token path (a bad token ends in 4xx, never retried against the machine key); if both are present, Bearer wins.

## Rate limiting (hub review, point 1)

`POST /api/submissions` is throttled **per-organization (300/min)** and **per-form (120/min)**, fixed-window. The public submit throttle is keyed per client IP, which is useless here because a first-party relay submits from a single fixed IP. These limits apply to **all ingest callers on this endpoint** — both the Bearer service-token path (records) **and** the static machine-key path (Concierge) — i.e. they are a shared ceiling on the ingest endpoint, an addition to prior behaviour, not a records-only rule.

Spam/abuse content filtering and per-visitor throttling are Records' responsibility (Records has the real client IP and session); Contact treats a token-authenticated, schema-valid payload as trusted input.

## Records obligations

- Render the first-party form and run the **first-line defence** (honeypot, per-visitor rate limit, bot mitigation) on the Records side — this MUST ship in the same wave as, or before, the token relay, because Contact's ingest deliberately skips the honeypot for trusted service input.
- Hold the service token server-side only (never emit to the browser); store encrypted, mask in UI, keep out of logs.
- Map block/field names to Contact form field names; send `consent: true` when the form requires consent.
- Treat `contact_form_id` + `public_form_key` as the binding identifiers (from the declarative block).

## Contact obligations

- Validate `contact_form_id` belongs to the token's org (cross-tenant writes are impossible — the form is looked up within the resolved org).
- Never store the token value; enforce revocation at request time; audit issue/revoke.
- Keep the public submit path (`/public/forms/*`) and the AYANE production form untouched by this lane.

## Not in scope

- Client-side JavaScript embed on the Records site (案2, records#937 — pocketed).
- Any change to the public embed widget or the hosted form page (`/form/{public_form_key}`).

## Related

- [`sibling-products.md`](./sibling-products.md), [`concierge-ingest-contract.md`](./concierge-ingest-contract.md)
- `docs/explanation/terminology.md` §Service tokens, §10 (Embed / public API)
- OpenAPI: `docs/openapi/openapi.yaml` (`issueServiceToken`, `revokeServiceToken`, `listServiceTokens`, `agentIngestSubmission`)

Last updated: 2026-07-18
