# Personal Data Protection & Contact Compliance — Binding Rules

**Status: binding (non-negotiable).** This document is the source of truth for
NeNe Contact's adherence to Japanese personal-data and electronic-contact law. A
privacy or legal professional reviewing the system must be able to find **zero
deviations** from the rules below.

These are not guidelines. They are **MUST** requirements. Where a rule here conflicts
with UX, performance, implementation convenience, or any other concern, **compliance
wins** — every time, without exception.

See also: [`scope-contract.md`](./scope-contract.md),
[`privacy-and-spam-compliance.md`](./privacy-and-spam-compliance.md) (operational layer),
[`domain-model.md`](./domain-model.md), [ADR 0010](../adr/0010-embed-public-api-security.md),
[ADR 0012](../adr/0012-data-protection-compliance-binding.md),
[ADR 0013](../adr/0013-audit-logging.md), and the self-review checklist
[`../review/compliance.md`](../review/compliance.md).

---

## 0. Governing principle

1. **Compliance is non-negotiable.** Correct adherence to the law takes precedence over
   every other product goal.
2. **No silent deviation.** Any departure from the rules in this document — even
   temporary — requires an **ADR** that records the reason, the scope, and the
   compliance impact. Code may not merge a deviation without that ADR.
3. **No money, no professional sign-off gate.** NeNe Contact handles **no payments,
   invoices, or tax figures**, so it carries **no accounting or tax obligation** and
   needs **no 税理士 / 会計士 / 弁護士 sign-off to proceed** during development. This is
   the deliberate difference from NeNe Invoice, whose `accounting-compliance.md` §0
   requires a 税理士 sign-off recorded in the deviating ADR. In Contact, a deviation ADR
   proceeds on **maintainer self-authority** (ADR 0012). The quality **bar is still
   professional-review-ready** — a privacy lawyer must find zero deviations — but it is
   not a blocking external gate.
4. **Engineering is not the legal authority.** This document is engineering's binding
   interpretation of the law. When a requirement is genuinely unclear, **stop and
   record the open question in an ADR** rather than guessing; resolve the interpretation
   here once settled. Optional legal review is encouraged for high-risk changes but is
   never a merge blocker (ADR 0012).
5. **Single source of truth for personal data.** Each personal-data field is captured
   once against the form schema and stored once, org-scoped. No layer silently copies
   personal data outside the documented submission record, notifications, and authorized
   sibling handoffs.

---

## 1. Statutory basis

NeNe Contact targets the following Japanese rules. This list states *what we comply
with*; it is not legal advice. Jurisdiction scope is **Japan law only** — see §9 for the
explicit position on non-Japanese visitors.

| Area | Rule set |
| --- | --- |
| Personal information | 個人情報保護法（APPI） — purpose limitation, security control, disclosure/correction/suspension rights |
| Sensitive personal info | 要配慮個人情報 — special handling and, in principle, no collection (§8) |
| My Number | マイナンバー法 — **prohibited** as a form field (§8) |
| Electronic contact | 特定電子メール法 — outbound notification email rules (§7) |
| Commercial display | 特定商取引法（表記）— operator's site duty; Contact provides the field/consent surface, not the legal text |

When any of these change (statutory fields, retention rules, consent rules), treat it as
a compliance defect until the product is updated, and open a P0 Issue.

---

## 2. Personal data inventory & purpose limitation

| Data | Source | Binding rule |
| --- | --- | --- |
| Name, email, phone, free text | Visitor submission | Collect **only** fields defined on the form schema (purpose limitation). Store org-scoped. |
| IP address, user agent | Request metadata | Store for abuse investigation only. **Excluded** from MCP/export by default (§11). |
| Attachment bytes | Optional file field | Size/type allowlist; virus-scan hook (Phase 3+); never inlined into notifications. |
| Consent record | Submission | Store *what* was consented to and *when*, immutably alongside the submission. |

- The form schema is the **declared purpose**. The system **MUST NOT** capture, infer, or
  enrich personal data beyond the declared fields.
- Operators remain the data controller for their site's privacy notice and lawful basis;
  Contact is the processing software they self-host.

---

## 3. Consent

- `consent_required` (per form) and `consent_label` (per-locale `ja`/`en`, ADR 0011)
  control an explicit consent checkbox in the embed.
- When `consent_required = true`, a submission **MUST** be rejected unless consent is
  affirmatively given. The checkbox **MUST NOT** be pre-checked.
- The granted consent (label text + timestamp) is recorded on the submission and is
  **immutable** — it is evidence, not a mutable preference.

---

## 4. Data-subject rights (本人の権利)

The product **MUST** give operators the tools to honor APPI data-subject requests:

- **Disclosure (開示)** — operator can view and export a submission's full content.
- **Correction (訂正)** — operator can amend stored values, with the change captured in
  the audit trail (§10).
- **Suspension / deletion (利用停止・削除)** — operator can delete a submission
  (soft-delete → hard-delete after a documented grace period, §5).
- **Export** — CSV export of submissions (PII fields included only via the documented
  admin path, audit-logged).

These are operator-facing capabilities; Contact does not adjudicate the request, it
makes compliance **possible and auditable**.

---

## 5. Retention & deletion

- **Configurable retention** per organization (retention days on `contact_form` / org
  policy). A purge job deletes expired submissions.
- **Soft delete → hard delete.** Deletion is two-stage: soft-delete hides the record;
  hard-delete removes personal data after a documented grace period.
- **Audit metadata survives.** The audit log retains *that* a record existed and *who*
  deleted it (without re-storing the deleted personal data) — deletion is provable.
- **No silent indefinite retention.** A form without a retention policy uses a documented
  default; the system **MUST NOT** retain personal data forever by accident.
- Operators are warned before any bulk destructive retention action.

---

## 6. Security boundary

Binding security rules live in [ADR 0010](../adr/0010-embed-public-api-security.md). The
compliance-critical subset:

- **Allowed origins** enforced server-side on every public submit.
- **Rate limiting** per IP and per `public_form_key`.
- **Honeypot** field on every public form; silent accept on trip (no bot-useful error).
- **Body size cap** before parsing.
- **No PII in URLs** — keys only in path; never email in query string.
- **CORS** reflects only allowed origins; never `*` in production.
- **Encryption at rest** for channel secrets and service tokens; **no raw secrets** in
  logs, notifications, or exports.
- **TLS required** for public embed in production (operator checklist).

---

## 7. Notifications & anti-spam (特定電子メール法)

- Outbound notifications go to **operator-configured recipients/channels** (email, Slack,
  Chatwork) — they are **transactional**, triggered by a submission. Contact is **not** a
  marketing mailer / ESP and **MUST NOT** ship newsletter or bulk-marketing lists (X-ref
  scope DON'T).
- Notification templates use **field summaries**, never full attachment bytes and never
  secrets.
- Outbound email **MUST** carry accurate sender identification and a working reply path,
  consistent with 特定電子メール法 expectations for the transactional context.
- Signed outbound webhooks are operator-configured; their target URLs are operator
  responsibility.

---

## 8. Prohibited & sensitive data

The system **MUST** structurally prevent collection of data Contact has no lawful reason
to hold:

- **My Number (マイナンバー)** — **prohibited** as any form field type.
- **Raw payment card numbers** — **prohibited** as any form field type.
- **要配慮個人情報** (race, creed, medical, criminal record, etc.) — not collected by
  default; if an operator genuinely needs a sensitive field, it requires an explicit,
  documented form configuration and the operator's lawful basis — never a silent default.
- Operators **MUST NOT** be able to inject arbitrary field types that bypass these
  prohibitions; field config is **declarative JSON** validated against the allowed type
  registry (no operator JavaScript — XSS/ADR 0010).

---

## 9. Cross-border / non-Japanese visitors (越境移転)

- NeNe Contact is **self-hosted by the operator**; the operator chooses where the
  instance runs and is the data exporter/importer for any cross-border transfer.
- **Jurisdiction scope is Japan law only.** Contact is built to APPI and the rules above.
  It is **not** warranted as GDPR/UK-GDPR/ePrivacy compliant; serving EU/UK/other
  visitors lawfully (越境移転の同意・SCC等) is the **operator's responsibility**, stated
  in operator docs. The bilingual `ja`/`en` UI (ADR 0011) does not imply EU-law coverage.

---

## 10. Audit trail

- Admin **mutations** (form edits, status changes, notes, deletions, handoff retries) and
  **PII access** (viewing/exporting a submission containing personal data) are auditable
  events: **who / when / what** — see [ADR 0013](../adr/0013-audit-logging.md).
- Audit records follow the **no-silent-mutation** rule: append-only; secrets and full PII
  payloads are **not** re-stored in the audit log (sanitized snapshots only).

---

## 11. AI / MCP

- MCP read tools return **redacted** payloads (no IP/UA, masked PII) unless an explicit
  admin tool sets `include_pii=true`, which is **audit-logged** (§10).
- No MCP tool sends email, posts to a channel, or executes a handoff on the operator's
  behalf without an explicit **write tool + confirmation token** (Phase 4+). There is no
  autonomous outbound action on personal data.
- MCP maps to **Contact OpenAPI only** — never a sibling database (ADR 0002).

---

## 12. How this rule applies to every change

Any change that touches form fields, submissions, consent, notifications, retention,
exports, audit, security middleware, or MCP **MUST**:

1. Be reviewed against this document and [`../review/compliance.md`](../review/compliance.md).
2. State its compliance impact in the PR.
3. If it deviates from any rule here, carry an **ADR** recording the reason and impact
   (self-authority — no external sign-off gate, §0.3 / ADR 0012). No exceptions.

If you are unsure whether a change has compliance impact, **assume it does** and run the
checklist.

Last updated: 2026-06-04
