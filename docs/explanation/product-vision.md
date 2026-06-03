# Product Vision

**NeNe Contact** — embeddable contact forms on NENE2.

## Origin

Every marketing site needs a contact form. Operators either wire fragile PHP mail scripts,
pay SaaS form fees per site, or bolt forms onto a CMS that was not built for a focused inbox.

Concierge handles **conversation**; it should not be forced to host a simple "contact us" form.
Contact owns **forms + inbox + notifications**.

## North Star

- Build a form from parts in admin
- Paste **one script line** on any site
- Notifications to email / Slack / Chatwork
- Inbox with status and export
- Optional handoff of qualified submissions to Deal or Invoice over HTTP

## Non-goals

- Chat scenarios, billing, bank CSV, reconciliation, document archive, full CRM
- Locales beyond `ja` / `en`; general multilingual / i18n framework (ADR 0011)

## Success criteria (MVP)

- One form, three field types, floating embed
- Submission stored and listed in admin
- One email notification + one Slack or Chatwork channel
- Rate limit + honeypot + allowed origins
- Bilingual `ja` / `en` form rendering (ADR 0011)
- OpenAPI validated; MCP read tools for inbox

## Related

- [`requirements.md`](./requirements.md)
- [`scope-contract.md`](./scope-contract.md)
- ADR 0011 (bilingual ja/en scope)

Last updated: 2026-06-04
