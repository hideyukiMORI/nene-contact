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
| **API contract (OpenAPI 3.1)** | [`docs/openapi/openapi.yaml`](./docs/openapi/openapi.yaml) |
| **Agents** | [`AGENTS.md`](./AGENTS.md) |
| **Roadmap** | [`docs/roadmap.md`](./docs/roadmap.md) |

## Status

Backend foundation and the compliance core are in place; the admin SPA and embed widget are landing.

- ✅ **Runtime + multi-tenant + auth** (org/JWT/RBAC), audit, contact-form & submission domains, rate limiting, OpenAPI 3.1 gate, org-scoped user management.
- ✅ **Compliance hardening (M2)** — consent, prohibited-field registry, retention + purge, data-subject delete/correct, channel-secret encryption; **no physical row deletion** (PII erased in place, [ADR 0016](./docs/adr/0016-no-physical-deletion-pii-erase-in-place.md)).
- ✅ **Notifications + webhooks + attachments (M4)** — email / Slack / Chatwork dispatch, signed outbound webhooks, file attachments.
- ✅ **Embed widget** (`public_html/embed.js`) — floating / button / inline, schema-driven.
- 🚧 **Admin SPA** (`frontend/`, React + TS + Vite → `public_html/admin/`) — login, form builder, inbox (list/detail/status/notes), channels, users landed.
- 🚧 **Sibling handoff (M5)** — Contact → Deal opportunity handoff over HTTP (`src/Upstream/`, idempotent, retry, audited; [ADR 0002](./docs/adr/0002-separate-from-sibling-products.md)); Contact → Vault archive next.
- ⏳ Next: M5 Vault attachment archive and MCP tools.

See [`docs/roadmap.md`](./docs/roadmap.md) and [`docs/todo/current.md`](./docs/todo/current.md).

## Quick Start

```bash
git clone https://github.com/hideyukiMORI/nene-contact.git
cd nene-contact
composer install
composer check                                   # phpunit + phpstan(8) + php-cs-fixer
php -S 127.0.0.1:8900 -t public_html public_html/index.php
curl http://127.0.0.1:8900/health                # {"status":"ok","service":"NENE2"}
# or the full stack (fixed 89xx lane): docker compose up
```

On a fresh database the entrypoint applies migrations automatically; create the
organization the single-tenant resolver expects (`ORG_SLUG`, default `default`)
once, plus a bootstrap operator:

```bash
docker compose exec app php tools/create-organization.php "Default" default
docker compose exec app php tools/create-user.php admin@example.com 'change-me' admin 1
```

NENE2 is consumed via a Composer `path` repository (`../NENE2`). Copy `.env.example` to
`.env` to override config (problem-details base URL, tenant resolution, database).
Channel secrets are encrypted at rest — set `NENE_CONTACT_ENCRYPTION_KEY` (see `.env.example`).

### Frontend (admin SPA + embed widget)

```bash
npm ci --prefix frontend
npm run check --prefix frontend        # type-check + lint + format + test
npm run build --prefix frontend        # admin → public_html/admin/  (served at /admin/)
```

The admin SPA lives in `frontend/` (React + TypeScript + Vite, [`frontend-standards.md`](./docs/development/frontend-standards.md)); its build output (`public_html/admin/`) is generated, not committed. The public embed widget is `public_html/embed.js`; try it via `/embed-demo.html?form=YOUR_KEY`.

## Local ports (fixed — do not revert to defaults)

| Service | Host port |
| --- | --- |
| PHP / API (admin SPA at `/admin/`, embed at `/embed.js`) | **8900** |
| phpMyAdmin | **8901** |
| MySQL | **3391** |

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
