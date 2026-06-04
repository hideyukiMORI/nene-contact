# Milestone M4: Channels + webhooks

**Phase 3** · complete the notification surface beyond email and add attachments.

## Goal

Notifications reach the right channels and integrations: Slack and Chatwork dispatch on
new submission (channels are already stored; only email dispatches today), signed outbound
webhooks for operator automation, and a file-attachment field.

## Acceptance criteria

- [ ] **Slack dispatch** on new submission, using stored channel config (DO D5).
- [ ] **Chatwork dispatch** on new submission, using stored channel config (DO D5).
- [ ] Notification templates use **field summaries only** — never full attachment bytes,
      never secrets (charter §7).
- [ ] **Signed outbound webhooks** on new submission to operator-configured URLs, with a
      verifiable signature (DO D6); target URL is operator responsibility.
- [ ] **File attachment field** (DO D12): size/type allowlist; separate multipart endpoint
      (not the 64 KiB JSON submit); attachment bytes never inlined into notifications;
      virus-scan hook stub for Phase 3+ (charter §2).
- [ ] All channel/secret config encrypted at rest; dispatch failures surfaced to the
      operator (do not drop the submission).
- [ ] OpenAPI updated; mutations audited (ADR 0013); `composer check` green.

## Out of scope

- Marketing / bulk email or ESP lists — permanently out of scope (charter §7, scope DON'T).
- Vault attachment archival handoff (M5).
- Auto-send operator email replies (DON'T X9; draft-only AI is Phase 4+).

## Related

- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (D5, D6, D12)
- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) (§7 anti-spam, §6 secrets)
- [`../integrations/sibling-products.md`](../integrations/sibling-products.md)

Last updated: 2026-06-04
