# Agent / AI Guide

Entry point for AI agents working on **NeNe Contact** (public repo `nene-contact`).

## Domain (read first)

| Product | Repository | Domain |
| --- | --- | --- |
| **NeNe Contact** | `nene-contact` (this) | Embeddable forms, submissions inbox, notifications |
| **NeNe Concierge** | `nene-concierge` | Scenario chat and step actions |
| **NeNe Deal** | `nene-deal` | Sales pipeline |
| **NeNe Invoice** | `nene-invoice` | Quote, invoice, payment management |

See [ADR 0009](docs/adr/0009-separate-from-nene-concierge.md).

## Read First

- **Scope contract (binding):** `docs/explanation/scope-contract.md`
- **Privacy & spam (binding):** `docs/explanation/privacy-and-spam-compliance.md`
- **Terminology registry (binding):** `docs/explanation/terminology.md`
- **Embed widget spec (binding):** `docs/explanation/embed-widget-spec.md`
- **Sibling integrations:** `docs/integrations/sibling-products.md`
- **NENE2 inheritance:** `docs/inheritance-from-nene2.md`
- **Current work:** `docs/todo/current.md`
- **Roadmap:** `docs/roadmap.md`

## Operating Rules

- Issue-driven; no direct commits to `main`
- **Every identifier** must match `docs/explanation/terminology.md` before use
- Do **not** add chat scenario engines — **`nene-concierge`**
- Do **not** add quotes, invoices, reconciliation, bank CSV, or document archive
- **Follow NENE2 conventions** when runtime lands — `docs/development/nene2-compliance.md`
- Namespace: `NeneContact\`
- **Repository docs: English only** (ADR 0008)
- **Product locales: `ja` / `en` only** (ADR 0011) — no third locale, no general i18n framework
- Siblings integrate via **HTTP only** — never shared databases (ADR 0002)

## Framework

[NENE2](https://github.com/hideyukiMORI/NENE2) via Composer when runtime lands.
