# ADR 0019: Submission tags — org-managed vocabulary, orthogonal to status

## Status

accepted

## Context

Operators triage submissions (`scope-contract.md` §29: "status, notes, export"). Today the
only classification axis is **`submission.status`** — a single-valued lifecycle
(`open` / `in_progress` / `resolved` / `spam`, [terminology §5](../explanation/terminology.md)).
Status answers *"how far along is this?"* but not *"what kind of inquiry is this?"*, and the
useful set of kinds is **business-specific**: an EC shop wants 返品 / 在庫, a firm wants
相談 / 見積, a team with hiring wants 応募. A fixed enum cannot serve every 業態.

We want a second, **orthogonal, multi-valued** classification the operator controls. The
obvious primitive is **tags**. Two forces shape the decision:

1. **Compliance** — the charter forbids collecting or *inferring* 要配慮個人情報 (sensitive
   personal information; [`data-protection-compliance.md`](../explanation/data-protection-compliance.md)
   §8) and limits processing to the form's declared purpose (§2). A **free-form** tag field
   lets an operator type `妊娠中` / a medical condition / a belief onto a person's inquiry —
   *minting* 要配慮個人情報 as ad-hoc text after the fact. This is the operator-input analogue
   of the form-side prohibited-field registry (#66) and is the single biggest risk here.
2. **Consistency** — free-text tags fragment (`見積` / `お見積り` / `見積もり`), which breaks
   filtering, the whole point of triage.

Both push the same way. This ADR records how tags are modelled so implementation Issues can
follow a settled contract.

## Decision

**Tags are an org-managed vocabulary applied to submissions — multi-valued, tenant-scoped,
audited, and orthogonal to `status`.**

- **Managed vocabulary, not free-form.** An admin defines the org's tag set (label + colour)
  under org settings; operators **apply tags from that set** (multi-select), they do not type
  free text onto a submission. Quick-create from the apply UI is allowed but it **creates a
  governed vocabulary row** (visible/manageable in settings), never an untracked string. This
  is the primary compliance guardrail: sensitive attributes cannot be minted per-submission,
  and the shared vocabulary is reviewable in one place.
- **Compliance guardrail is explicit.** The tag-management screen carries a short warning:
  *do not encode 要配慮個人情報 (health, beliefs, social status, …) in tags.* Tag labels are
  **operator-internal metadata**: a single string (not a per-locale `ja`/`en` object — tags
  are never shown to the visitor and never appear in the public embed or schema), so no visitor
  personal data is collected by tagging. Applying a tag is nonetheless *processing* → audited
  (below). A hard denylist is deferred; guidance first (revisit trigger: misuse observed).
- **Orthogonal to status.** Tags neither replace nor gate `status`. `status` stays the single
  lifecycle; tags are cross-cutting kind/category labels. A submission has one status and zero
  or more tags.
- **Multi-tenant (ADR 0006 / 0014).** `tags` are scoped by `organization_id`; a submission may
  be tagged only with tags of its own organization. Cross-tenant tagging is impossible by
  construction (resolved-org filter on every query).
- **Append-only / no physical deletion (ADR 0016).** `tags` soft-delete (`deleted_at`); the
  `submission_tags` join is append-only with a soft **remove** (`deleted_at`) so *untag* is
  auditable and reversible without `DELETE`. A soft-deleted tag disappears from the pickers and
  filters but its historical assignments (and audit trail) survive. Tag assignments are **not
  PII**, so they persist on a submission's erase-in-place PII purge (the tombstone keeps them).
- **Audited (ADR 0013).** Vocabulary mutations record `tag.created` / `tag.updated` /
  `tag.deleted` (actor + before/after); applying/removing records `submission.tagged` /
  `submission.untagged` (actor + tag id/label, no submission PII in the snapshot).
- **Filterable.** The inbox filters by tag **server-side**, composing with the existing
  status / form / period / search filters (ADR 0017 masked-by-default list is unchanged; tags
  are metadata, not PII).
- **Colour from a fixed token set**, not free hex — tags reuse the badge colour language so the
  console stays visually coherent (light + dark).

### Boundary vs NeNe Deal (kept deliberately narrow)

Tags are **flat classification labels only**. They are **not** ordered pipeline stages, have no
automation, no forecast, no kanban SSOT. An org that needs a real sales pipeline uses **NeNe
Deal** (scope-contract X6). If a request starts turning tags into a workflow engine, that is a
signal it belongs in Deal, not Contact. This keeps tags within Contact's "triage" remit.

## Consequences

**Benefits**

- Operators get a business-specific second axis without Contact becoming a CRM.
- The managed vocabulary makes the sensitive-data risk *structural* (one reviewable list) rather
  than scattered free text, and keeps filtering reliable.
- Reuses the established rails: org-scoping (ADR 0014), audit (ADR 0013), no-physical-deletion
  (ADR 0016), masked inbox (ADR 0017) — no new architectural surface.

**Costs**

- Two new tables + CRUD + apply/remove endpoints + audit wiring + console screens: a medium,
  multi-Issue feature (split under the spec).
- The compliance guardrail is *guidance*, not enforcement — a determined operator can still put
  a sensitive word in a managed tag. Mitigated by the single-list reviewability and the warning;
  a denylist remains a future option if misuse appears.
- Single-string labels (no `ja`/`en`) means a bilingual org sees one label language; acceptable
  because tags are internal operator metadata, not visitor-facing (revisit if operators ask).

## Related

- Spec: [`../development/submission-tags.md`](../development/submission-tags.md)
- [`../explanation/terminology.md`](../explanation/terminology.md) §2/§8/§9 (registered identifiers)
- ADR 0013 (audit), ADR 0014 (tenant scoping), ADR 0016 (no physical deletion), ADR 0017 (masked inbox)
- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) §2/§8
- [`../explanation/scope-contract.md`](../explanation/scope-contract.md) (triage in-scope; X6 CRM → Deal)
