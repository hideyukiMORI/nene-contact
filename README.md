# NeNe Contact

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![PHP 8.4](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php)](https://www.php.net/)

**Embeddable contact forms — self-hosted for Japan SMB and global sites.**

**NeNe Contact** lets operators build contact forms from reusable field parts,
deploy them with a **one-line embed script** (floating button, inline, or trigger),
route notifications to **email / Slack / Chatwork**, and manage submission history
in admin — on [NENE2](https://github.com/hideyukiMORI/NENE2).

> **Separate product.** Contact does **not** run chat scenarios
> ([`nene-concierge`](https://github.com/hideyukiMORI/nene-concierge)),
> issue invoices ([`nene-invoice`](https://github.com/hideyukiMORI/nene-invoice)),
> reconcile payments ([`nene-clear`](https://github.com/hideyukiMORI/nene-clear)),
> or act as a CMS ([`nene-records`](https://github.com/hideyukiMORI/nene-records)).
> See [ADR 0009](./docs/adr/0009-separate-from-nene-concierge.md).

## Domain (binding)

| Product | Repository | What it does |
| --- | --- | --- |
| **NeNe Contact** | `nene-contact` (this) | Form builder, embed widget, submissions inbox, notifications |
| **NeNe Concierge** | `nene-concierge` | Visual chat scenarios and step actions |
| **NeNe Deal** | `nene-deal` | B2B pipeline; optional handoff target from Contact |
| **NeNe Invoice** | `nene-invoice` | Billing documents; optional draft-client handoff |
| **NeNe Records** | `nene-records` | Typed entity CMS; optional read-only field options |

## Goals

- **Bilingual (ja / en)** — forms, admin, and notifications in Japanese and English only; Japan-tuned, not general multilingual ([ADR 0011](./docs/adr/0011-bilingual-japanese-english-scope.md))
- **Composable forms** — text, email, select, textarea, file (bounded), honeypot
- **Embed anywhere** — `<script src="…/embed.js" data-form="…">` with trigger modes
- **Operator inbox** — list, status, notes, export; multi-tenant from day one
- **Notifications** — email, Slack, Chatwork; signed outbound webhooks
- **Sibling handoff** — HTTP only to Deal / Invoice / Vault (Phase 3+); no shared DB
- **OpenAPI + MCP** — documented HTTP boundaries for humans and AI agents
- **Compliant by design** — binding APPI/Japan-law charter, professional-review-ready; no money means no sign-off gate ([compliance charter](./docs/explanation/data-protection-compliance.md), [ADR 0012](./docs/adr/0012-data-protection-compliance-binding.md))

## Documentation (read first)

| Topic | Document |
| --- | --- |
| **Scope contract (GOAL / DO / DON'T)** | [`docs/explanation/scope-contract.md`](./docs/explanation/scope-contract.md) |
| **Compliance charter (binding)** | [`docs/explanation/data-protection-compliance.md`](./docs/explanation/data-protection-compliance.md) |
| **Privacy & spam (operational)** | [`docs/explanation/privacy-and-spam-compliance.md`](./docs/explanation/privacy-and-spam-compliance.md) |
| **Embed widget contract** | [`docs/explanation/embed-widget-spec.md`](./docs/explanation/embed-widget-spec.md) |
| **Terminology registry (binding)** | [`docs/explanation/terminology.md`](./docs/explanation/terminology.md) |
| **Sibling integrations** | [`docs/integrations/sibling-products.md`](./docs/integrations/sibling-products.md) |
| **Coding standards (binding)** | [`docs/development/coding-standards.md`](./docs/development/coding-standards.md) |
| **Agents** | [`AGENTS.md`](./AGENTS.md) |
| **Roadmap** | [`docs/roadmap.md`](./docs/roadmap.md) |

## Status

**Phase 0** — governance and product design. Runtime scaffold follows Issue #4+.

## Local ports (fixed — do not revert to defaults)

| Service | Host port |
| --- | --- |
| PHP / API | **8900** |
| phpMyAdmin (when added) | **8901** |
| MySQL (when added) | **3391** |

Use the **89xx** lane only. Do not reuse NENE2 (82xx), Clear (83xx), Profile (84xx), or Invoice (85xx) ports.

## Ecosystem layer

```
Front office:  Records · Corpus · Concierge · Contact (this)
Sales:         Deal → Invoice (handoff)
Back office:   Profile → Clear · Vault
```

Portfolio copy: [publication-strategy `nene-family-suite-copy`](https://github.com/hideyukiMORI/publication-strategy/blob/main/docs/products/nene-family-suite-copy.md).

## License

MIT — see [LICENSE](./LICENSE).
