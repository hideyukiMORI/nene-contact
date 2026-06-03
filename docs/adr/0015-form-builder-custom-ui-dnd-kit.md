# ADR 0015: Admin Form Builder — Custom UI + dnd-kit (React Flow Not Adopted)

## Status

accepted

## Context

The admin needs a GUI to build a contact form from field parts. A node-based canvas library
such as **React Flow** was considered, since "visual builder" often suggests a graph editor.

But Contact's data model is an **ordered list of fields**, not a graph: `form_field` carries
`field_type`, `label`, `required`, `options_json`, and `sort_order` (terminology §5,
domain-model). There are no edges between fields. Form layout is "static or progressive UI
only" — and even a progressive (multi-step) form is steps-of-fields, still a list, not a
free graph.

Node-graph editing is also the signature of **NeNe Concierge**'s visual chat scenarios,
which ADR 0009 / scope-contract X1 explicitly keep out of Contact. Introducing a graph
canvas here would drift across that product boundary.

`frontend-standards.md` requires an ADR before adopting a UI library, so this records both
the rejection (React Flow) and the one library we do adopt (dnd-kit).

## Decision

1. **The form builder is a custom UI** on the existing stack (React + TypeScript +
   TanStack Query + React Hook Form + Zod + design tokens): a field-type **palette**, an
   ordered **field list**, a **config panel**, and a **live preview**.
2. **React Flow (and any node-graph/canvas library) is NOT adopted.** Branching/conditional
   behavior, if ever needed, is a declarative **rules panel** — never a graph; conversational
   branching belongs to NeNe Concierge over HTTP (ADR 0009).
3. **dnd-kit is adopted solely for drag-to-reorder** of the field list. Rationale:
   accessible reordering (keyboard, touch, screen-reader; WCAG 2.2 AA per frontend-standards)
   is error-prone to hand-roll. `react-beautiful-dnd` is rejected (effectively unmaintained).
   dnd-kit is headless and composes with the theme-token layer.
4. **Preview reuses the embed schema renderer** — the same `contact_form` model renders both
   the builder preview and the public widget, so they cannot diverge.
5. Placement follows `frontend-standards.md`: builder workflow in
   `features/edit-contact-form/`, resource model/mapper/hooks in `entities/contact-form/`,
   reusable primitives in `shared/ui/`. Locales `ja`/`en` only (ADR 0011).

## Consequences

**Benefits**

- Minimal dependency surface; no canvas/coordinate/viewport machinery for a list UI.
- Stays clearly inside the product boundary (no scenario-graph editing).
- Accessible reordering without hand-rolled DnD; preview/widget share one renderer.

**Costs**

- One new frontend dependency (dnd-kit) to keep updated (Dependabot/Renovate).
- A future conditional-logic feature needs a rules-panel design (not "just add nodes").

## Related

- ADR 0009 (Concierge boundary), ADR 0011 (ja/en locales)
- [`../development/frontend-standards.md`](../development/frontend-standards.md)
- [`../explanation/embed-widget-spec.md`](../explanation/embed-widget-spec.md), [`../explanation/domain-model.md`](../explanation/domain-model.md)
