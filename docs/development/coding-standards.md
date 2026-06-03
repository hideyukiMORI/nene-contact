# Coding Standards (index)

NeNe Contact inherits NENE2 standards and adds product-specific rules.

## Binding local docs

| Topic | Document |
| --- | --- |
| Scope | [`../explanation/scope-contract.md`](../explanation/scope-contract.md) |
| Terminology | [`../explanation/terminology.md`](../explanation/terminology.md) |
| NENE2 compliance (when coding starts) | [`nene2-compliance.md`](./nene2-compliance.md) |
| Backend placement (when coding starts) | [`backend-standards.md`](./backend-standards.md) |

## NENE2 upstream (framework)

- https://github.com/hideyukiMORI/NENE2/blob/main/docs/development/coding-standards.md

## Product rules (always)

- Namespace `NeneContact\`
- Handler → UseCase → Repository
- JSON **snake_case**
- No Concierge, Invoice, or Clear domain logic in this repo

Last updated: 2026-06-03
