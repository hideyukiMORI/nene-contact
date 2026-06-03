# Inheritance from NENE2

NeNe Contact is a **consumer application** on [NENE2](https://github.com/hideyukiMORI/NENE2). This document maps what is inherited vs owned locally.

## Inherited from NENE2 (reference upstream)

| Topic | NENE2 path |
| --- | --- |
| HTTP runtime, middleware order | `docs/development/coding-standards.md` |
| Problem Details | `docs/development/error-codes.md` |
| Validation layering | `docs/development/coding-standards.md` |
| MCP policy | `docs/integrations/mcp-tools.md` |
| OpenAPI workflow | `docs/howto/add-openapi-endpoint.md` |
| Session / JWT patterns | `docs/development/authentication-boundary.md` |
| Mailer | `docs/development/email-sending.md` |

Install: `composer require hideyukimori/nene2`. Read `vendor/hideyukimori/nene2/docs/` at runtime.

## Owned in nene-contact (local SSOT)

| Topic | Local path |
| --- | --- |
| Scope / DO / DON'T | `docs/explanation/scope-contract.md` |
| Embed widget | `docs/explanation/embed-widget-spec.md` |
| Privacy & spam | `docs/explanation/privacy-and-spam-compliance.md` |
| Terminology | `docs/explanation/terminology.md` |
| Sibling HTTP contracts | `docs/integrations/` |
| Product ADRs | `docs/adr/` |
| Concierge boundary | `docs/adr/0009-separate-from-nene-concierge.md` |

## Deviations

Record any intentional deviation from NENE2 in a new ADR in this repository.

Last updated: 2026-06-03
