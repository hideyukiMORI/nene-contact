# Milestone M4: Channels + webhooks

**Phase 3** · complete the notification surface beyond email and add attachments.
✅ **Complete** (2026-06-04): dispatch #84/#85, webhooks #86/#87, attachments #88/#89 + #90/#91.

## Goal

Notifications reach the right channels and integrations: Slack and Chatwork dispatch on
new submission (channels are already stored; only email dispatches today), signed outbound
webhooks for operator automation, and a file-attachment field.

## Acceptance criteria

- [x] **Slack dispatch** on new submission, using stored channel config (DO D5). (#84/#85)
- [x] **Chatwork dispatch** on new submission, using stored channel config (DO D5). (#84/#85)
- [x] Notification templates use **field summaries only** — never full attachment bytes,
      never secrets (charter §7).
- [x] **Signed outbound webhooks** on new submission to operator-configured URLs, with a
      verifiable HMAC signature (DO D6); target URL is operator responsibility. (#86/#87)
- [x] **File attachment field** (DO D12): size/type allowlist; separate multipart endpoint;
      attachment bytes never inlined into notifications; virus-scan hook stub; retention
      erase-in-place + orphan cleanup (ADR 0016). (#88/#89, #90/#91)
- [x] All channel/secret config encrypted at rest (#74); per-channel dispatch failures are
      isolated (best-effort) and never drop the submission.
- [x] OpenAPI updated; mutations audited (ADR 0013); `composer check` green.

## Out of scope

- Marketing / bulk email or ESP lists — permanently out of scope (charter §7, scope DON'T).
- Vault attachment archival handoff (M5).
- Auto-send operator email replies (DON'T X9; draft-only AI is Phase 4+).

## Related

- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (D5, D6, D12)
- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (§7 anti-spam, §6 secrets)
- [`../integrations/sibling-products.md`](../integrations/sibling-products.md)

Last updated: 2026-06-04
