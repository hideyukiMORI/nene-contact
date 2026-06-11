# ADR 0018: Staged disclosure of submission reception metadata

## Status

accepted

## Context

Every submission carries **reception metadata** (受信メタ) describing *how* it arrived,
distinct from the visitor-entered field values:

- `submitted_at` — when it was received.
- `source` — origin channel (`form` / `concierge` / `import` / `api`,
  see [ADR 0010](./0010-embed-public-api-security.md)).
- `source_url` — the page the embed widget was on when it was submitted (referer).
- `ip` and `user_agent` — request metadata captured for **abuse investigation only**
  ([`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) §2).

Today `ip` / `user_agent` / `submitted_at` / `source` are stored, but the admin inbox detail
only surfaces `submitted_at`; `source` is hidden and `source_url` is not captured at all. So
operators cannot answer basic operational questions ("which page did this come from?",
"is this a spam burst from one client?") from the inbox.

The naive fix — dump all reception meta into the detail view — collides with the compliance
charter. Charter §2 classifies **IP and user agent as personal data** stored *for abuse
investigation only*, and §11 keeps them **out of the default read surface** (MCP/export return
no IP/UA unless an explicit, audit-logged `include_pii=true` path is used). [ADR 0017](./0017-admin-inbox-masked-by-default-server-side-search.md)
already foreshadows the resolution: *"a future reveal/export with audit affordance … would
follow the existing `include_pii=true` + audit pattern."*

So the question is not *whether* to show reception meta, but *how to split it* so the safe,
operational parts are always visible while the personal-data parts keep their purpose
limitation and leave an access trail.

## Decision

Reception metadata is disclosed in **two stages**.

### 1. Safe meta — shown by default

`source`, `submitted_at`, and `source_url` are non-personal operational metadata. They are
returned on the normal submission detail response (`SubmissionResponse::toArray()`) and shown
in the inbox detail layout by default. No audit event — disclosing them reveals no personal
data (consistent with the masked-list reasoning in ADR 0017).

`source_url` is the embed host page URL. A page URL is not, in itself, personal data; it is
treated as safe meta. (Operators remain the controller for what their own page URLs contain.)

### 2. Technical info (IP / User-Agent) — disclosed on demand, audited

IP and User-Agent are **excluded from every default payload** — the detail response, the list,
MCP, and export — unchanged from charter §2/§11. They are obtainable only through a dedicated,
explicit action:

- A separate endpoint, `GET /admin/submissions/{id}/technical-meta`, returns
  `{ ip, user_agent }` for a single submission.
- The endpoint's use case **records an audit event before returning the values** — action
  `submission_technical_meta.viewed`, entity `submission`, with actor + organization + id.
  The access itself is the audited event (a sensitive *read*, like `submission.viewed` in
  audit-logging §1); the snapshot stores no raw IP/UA in the trail (charter §10).
- The reveal is **role-gated** (admin and above) as defense in depth — the audit trail is the
  primary control, the role gate is the secondary one.
- The frontend never receives IP/UA until the operator explicitly clicks "show technical info
  (for abuse investigation)", which triggers the endpoint call. Client-side "hide a value that
  was already shipped" is explicitly **not** acceptable — the value must not leave the server
  until the audited call is made.

This is the same shape as the established `include_pii=true` + audit pattern, scoped to the two
abuse-investigation fields rather than to the field values.

### Not in MCP

The technical-meta endpoint is **not** exposed as an MCP tool. MCP read tools stay redacted
(charter §11); IP/UA disclosure is an operator action behind admin auth and audit, not an
agent capability.

## Consequences

**Benefits**

- Operators get the operational reception meta they need (origin page, channel, time) without
  any new personal-data exposure.
- IP/UA keep their charter §2 purpose limitation and now carry an **access audit trail** they
  previously lacked — a net compliance improvement, not a deviation.
- Reuses the existing audited-disclosure pattern (ADR 0017, charter §11) instead of inventing a
  new exception.

**Costs**

- An extra round-trip to reveal IP/UA (by design — it is the audit boundary).
- A new audit action and an `source_url` column to register and maintain.

**Follow-up**

- #227 — capture & store `source_url`.
- #228 — audited technical-meta disclosure endpoint.
- #229 — surface reception meta in the inbox detail layout + audited reveal control.
- Pre-existing gap (out of scope here): the full submission **detail** view returns raw field
  values without recording `submission.viewed`; audit-logging §1 lists it as auditable. Tracked
  separately.

## Related

- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) §2, §10, §11
- [ADR 0013](./0013-audit-logging.md) (audit logging), [ADR 0017](./0017-admin-inbox-masked-by-default-server-side-search.md) (masked-by-default inbox, reveal-with-audit precedent)
- [ADR 0010](./0010-embed-public-api-security.md) (embed/public API, `source`), [ADR 0012](./0012-data-protection-compliance-binding.md) (self-authority)
- [`../development/audit-logging.md`](../development/audit-logging.md), [`../explanation/terminology.md`](../explanation/terminology.md) §8, §9, §16
- Issues #226 (this ADR), #227, #228, #229
