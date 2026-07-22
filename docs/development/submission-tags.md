# Submission tags (spec)

Buildable spec for operator submission tags. Decision + rationale: **[ADR 0019](../adr/0019-submission-tags-managed-vocabulary.md)**.
Binding rails: multi-tenancy (ADR 0014), audit (ADR 0013), no-physical-deletion (ADR 0016),
masked inbox (ADR 0017), compliance charter §2/§8.

## Model

Two tables, both org-scoped and append-only / soft-delete (ADR 0016).

### `tags` — the org vocabulary

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint PK | |
| `organization_id` | bigint FK | tenant scope (ADR 0014); every query filters on the resolved org |
| `label` | varchar(60) | operator-internal display text; **single string** (not per-locale — never visitor-facing) |
| `color` | varchar(20) | one of the fixed tag colour tokens (below); not free hex |
| `sort_order` | int | manual ordering in pickers/settings |
| `created_at` / `updated_at` | datetime | |
| `deleted_at` | datetime null | soft-delete; hidden from pickers/filters, assignments survive |

Unique: `(organization_id, label)` among non-deleted rows.

### `submission_tags` — the assignment (join)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint PK | |
| `submission_id` | bigint FK | |
| `tag_id` | bigint FK | must belong to the submission's organization |
| `created_at` | datetime | when applied |
| `deleted_at` | datetime null | soft **remove** (untag); append-only, never `DELETE` |

Unique active assignment: `(submission_id, tag_id)` among non-deleted rows (re-tag reactivates
or inserts a fresh row; one active row per pair).

**Colour tokens** (fixed set, reuse the badge palette, light+dark): `slate` `wisteria`
`teal` `green` `amber` `rose` `orange`. Register the exact list in terminology §6-style if it
grows; default `slate`.

## API (`/admin/*`, JWT + RBAC, org-scoped, snake_case JSON)

Vocabulary (admin-managed):

| operationId | Method · path | Notes |
| --- | --- | --- |
| `listTags` | `GET /admin/tags` | org's non-deleted tags, `sort_order` then label |
| `createTag` | `POST /admin/tags` | `{label, color?}` → 201; 409 on duplicate label; audited `tag.created` |
| `updateTag` | `PATCH /admin/tags/{id}` | `{label?, color?, sort_order?}`; audited `tag.updated` |
| `deleteTag` | `DELETE /admin/tags/{id}` | soft-delete; audited `tag.deleted`; assignments survive |

Assignment (operator, editor+):

| operationId | Method · path | Notes |
| --- | --- | --- |
| `addSubmissionTag` | `POST /admin/submissions/{id}/tags` | `{tag_id}`; idempotent (re-add = no-op if active); tag must be same-org; audited `submission.tagged` |
| `removeSubmissionTag` | `DELETE /admin/submissions/{id}/tags/{tagId}` | soft-remove; idempotent; audited `submission.untagged` |

Read surface: the submission **list** and **detail** responses gain `tags: [{id, label, color}]`
(active assignments only). The masked list (ADR 0017) still masks field values; tags are metadata
and are returned unmasked.

Inbox filter: `GET /admin/submissions?tag_id=…` (repeatable) composes with the existing
`status` / `contact_form_id` / `from` / `to` / `q` / `sort`. Multiple `tag_id` = AND by default
(submissions carrying **all** listed tags); revisit OR if operators ask.

## Audit (ADR 0013, entity in parentheses)

- `tag.created` / `tag.updated` / `tag.deleted` (entity `tag`) — actor + before/after label/color.
- `submission.tagged` / `submission.untagged` (entity `submission`) — actor + `{tag_id, label}`;
  **no submission field values** in the snapshot.

## Console UI

1. **Tag management** (org settings): list + create/edit (label + colour swatch) + reorder +
   soft-delete, with the **compliance warning** banner (do not encode 要配慮個人情報). Admin only.
2. **Apply on a submission** (inbox detail): a tag picker (multi-select from the org set, with
   quick-create → `createTag`) rendering the submission's tags as coloured chips; add/remove
   calls the assignment API.
3. **Inbox**: tags shown as small chips on rows; a **tag filter** control beside the status
   filter (chips/dropdown), driving `tag_id`. Empty state and counts consistent with the
   existing filter row.

All strings via the i18n catalog (ADR 0011); colours from the fixed token set (light+dark).

## Acceptance

- Admin CRUD of tags (201 / 409 duplicate / 422 invalid colour / soft-delete), org-scoped
  (another org's tag id → 404), each mutation audited.
- Operator add/remove on a submission: idempotent, same-org enforced (cross-org tag → 422/404),
  audited `submission.tagged` / `submission.untagged` with no PII in the snapshot.
- Submission list/detail include active `tags`; a soft-deleted tag drops out of pickers/filters
  but its past assignments remain visible on already-tagged submissions.
- `?tag_id=` filters server-side and composes with status/period/search; masked-by-default list
  unchanged.
- Erase-in-place PII purge (ADR 0016) leaves tag assignments intact (they are not PII).

## Issue breakdown

1. **Tag domain + vocabulary CRUD** — `tags` table + `Tag` domain + `listTags`/`createTag`/
   `updateTag`/`deleteTag` + audit + OpenAPI.
2. **Assignment** — `submission_tags` + `addSubmissionTag`/`removeSubmissionTag` + `tags` on
   submission list/detail responses + audit.
3. **Inbox tag filter** — `?tag_id=` server-side, composing with existing filters.
4. **Console: tag management screen** (org settings) + compliance warning.
5. **Console: chips + apply picker + inbox tag filter control.**
