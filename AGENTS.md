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
- **Compliance charter (binding):** `docs/explanation/data-protection-compliance.md`
- **Privacy & spam (operational):** `docs/explanation/privacy-and-spam-compliance.md`
- **Terminology registry (binding):** `docs/explanation/terminology.md`
- **Embed widget spec (binding):** `docs/explanation/embed-widget-spec.md`
- **Sibling integrations:** `docs/integrations/sibling-products.md`
- **NENE2 inheritance:** `docs/inheritance-from-nene2.md`
- **Coding standards (binding):** `docs/development/coding-standards.md`
- **Current work:** `docs/todo/current.md`
- **Roadmap:** `docs/roadmap.md`

## Operating Rules

- **One task = one Issue = one PR (MANDATORY)** — create a dedicated Issue before any edit; split multi-part work into separate Issues
- **Auto-merge on completion (MANDATORY)** — ready PRs are merged automatically (`gh pr merge --merge --delete-branch`); no manual approval gate (standing maintainer policy)
- Issue-driven; **never commit or push directly to `main`**
- **Every identifier** must match `docs/explanation/terminology.md` before use
- Do **not** add chat scenario engines — **`nene-concierge`**
- Do **not** add quotes, invoices, reconciliation, bank CSV, or document archive
- **Follow NENE2 coding conventions (MUST-comply)** — binding: `docs/development/coding-standards.md` (index), `naming-conventions.md`, `backend-standards.md`, `frontend-standards.md`, `nene2-compliance.md`. NENE2 `docs/development/` is upstream SSOT; reuse framework objects; violations block merge.
- **Multi-tenant by default** — `docs/development/multi-tenancy.md` (ADR 0006, ADR 0014, mirrors NeNe Records). Every tenant-scoped query filters by resolved `organization_id`; cross-tenant access is superadmin-only.
- **Audit every mutation (before/after)** — `docs/development/audit-logging.md` (ADR 0013, mirrors NeNe Invoice). Each mutating use case records actor + before + after; PII view/export audited; append-only.
- **All UI strings in message catalogs** — `docs/development/i18n-message-catalog.md` (ADR 0011). Every user-facing string via `t(key)` from `shared/i18n/messages/{ja,en}.ts` (ja authoritative); no hardcoded strings; instant switching.
- Namespace: `NeneContact\`
- **Repository docs: English only** (ADR 0008)
- **Product locales: `ja` / `en` only** (ADR 0011) — no third locale, no general i18n framework
- Siblings integrate via **HTTP only** — never shared databases (ADR 0002)

## Framework

[NENE2](https://github.com/hideyukiMORI/NENE2) via Composer when runtime lands.
