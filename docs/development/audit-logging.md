# Audit Logging (binding)

Every operation that changes data records **who changed what, and how** — with the
**before and after** state — so a reviewer or the operator can reconstruct the full history
of any record. This is a **build-time premise** (ADR 0013), grounded in NeNe Invoice's
working implementation (`src/Audit/`), adapted to Contact.

> **Enforcement:** a **mutating** use case that does **not** record an `audit_event` with
> `before` + `after` is a defect that **blocks merge**. Secrets and full PII are **never**
> written to the trail (sanitized snapshots only). Deviations require an ADR (self-authority,
> ADR 0012 model).

Read with: [`backend-standards.md`](./backend-standards.md),
[`multi-tenancy.md`](./multi-tenancy.md),
[ADR 0013](../adr/0013-audit-logging.md),
[`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md) §10.

---

## 1. What is audited

| Category | Audited? | Notes |
| --- | --- | --- |
| **Create** | ✓ | `before = null`, `after =` new sanitized snapshot |
| **Update** | ✓ | `before` and `after` snapshots — the diff is *what changed and how* |
| **Delete** (soft or hard) | ✓ | `before =` last snapshot, `after = null`; trail **survives** the deletion |
| **PII access** (submission view / export) | ✓ | `submission.viewed` / `submission.exported` (charter §4, §11) |
| **Audit-trail export** | ✓ | `audit_event.exported` — the trail records who bulk-read it (`{count, filter}`, no snapshots; #522) |

> **Adding an action? Three places, one PR (review gate).** A new `{entity}.{verb}` must be
> (1) registered in [terminology §9](../explanation/terminology.md), (2) added to the console's
> label dictionaries (`features/list-audit-events/lib/labels.ts` + the `audit.entity.*` /
> `audit.verb.*` keys in `ja.ts` / `en.ts`), and (3) covered by `labels.test.ts`. The label
> lookup **falls back to the raw action string**, so a missed entry does not fail anything — it
> just ships `submission.tagged` to the operator's screen and looks intentional. Three features
> shipped that way before the coverage test existed (#533).
| **Handoff retry / state** | ✓ | `handoff.retried` with before/after `handoff_status` |
| Ordinary list views / non-PII reads | ✗ | not audited (write volume) |

"Every operation" = **every mutation**, plus the sensitive **reads** of personal data.
This holds across `/admin/*`, `/api/*` (service), and any future CLI/MCP write path —
the record lives in the **use case**, which all surfaces go through.

---

## 2. The record (`audit_event`)

One append-only row per audited operation. Table `audit_events`, entity `AuditEvent`.

| Column | Meaning |
| --- | --- |
| `id` | PK |
| `actor_user_id` | Authenticated user who performed it (**who**); null for system/public |
| `organization_id` | Tenant the event belongs to (ADR 0006) |
| `action` | `{entity}.{verb}` (**what**), e.g. `submission.updated` (terminology §9) |
| `entity_type` / `entity_id` | Which record was affected |
| `before_json` | Sanitized snapshot **before** (null for create) |
| `after_json` | Sanitized snapshot **after** (null for delete) |
| `created_at` | When |

The **how** is derivable as the field-level diff of `before_json` → `after_json`; no
separate diff column is stored.

---

## 3. Recorder contract

```php
interface AuditRecorderInterface
{
    /**
     * @param array<string,mixed>|null $before sanitized snapshot before (null for create)
     * @param array<string,mixed>|null $after  sanitized snapshot after  (null for delete)
     */
    public function record(
        ?int $actorUserId,
        ?int $organizationId,
        string $action,
        string $entityType,
        ?int $entityId,
        ?array $before,
        ?array $after,
    ): void;
}
```

- Recorded **in the UseCase** — it has the actor/tenant context, the before/after state,
  and names the business action. Handlers pass the **actor user id** from token claims
  (`nene2.auth.claims`); the org id comes from the request-scoped holder (`multi-tenancy.md`).
- `PdoAuditEventRepository::append()` writes the row; reads (`findAll`/`count`) are
  org-scoped for the admin log view.

---

## 4. The capture idiom (mandatory)

Snapshot **before**, mutate, re-fetch **after**, record both:

```php
public function execute(?int $actorUserId, int $id, UpdateContactFormInput $input): ContactForm
{
    $before = $this->forms->findById($id);          // org-scoped read
    if ($before === null) {
        throw new ContactFormNotFoundException($id);
    }

    $this->forms->update(/* ...apply $input... */);
    $after = $this->forms->findById($id);           // re-read post-mutation

    $this->audit->record(
        $actorUserId,
        $this->orgId->get(),
        'contact_form.updated',
        'contact_form',
        $id,
        ContactFormResponse::toArray($before),       // sanitized snapshot
        ContactFormResponse::toArray($after),
    );

    return $after;
}
```

- **Snapshots reuse the `*Response` presenter** (`toArray()`) — the same shape returned by
  the API — so **secrets** (channel `config_json`, service tokens) and **full PII** are
  excluded by construction. Never hand-build a snapshot that re-includes a secret.
- Create: `before = null`, `after =` new snapshot. Delete: `before =` last snapshot,
  `after = null`.
- PII access: record `submission.viewed` / `submission.exported` with a redacted snapshot
  (no raw IP/UA; PII masked per charter §11).

---

## 5. Integrity & retention

- **Append-only.** Audit rows are never updated or deleted.
- **Survives entity deletion.** Deleting a submission leaves its audit trail intact —
  deletion is provable (charter §5). The trail does **not** re-store the deleted PII.
- **Org-scoped & tenant-isolated.** `organization_id` on every row; the admin read view is
  scoped (`multi-tenancy.md`).
- **Atomicity (follow-up).** Mutation + audit should run in **one transaction** via the
  framework transaction manager so a crash cannot leave a mutation unaudited. Until then,
  recording is synchronous immediately after the mutation.

---

## 6. Read access

- `GET /admin/audit-events` — list for `admin` (own org) and `superadmin`; paginated
  (`items`/`limit`/`offset`); gated by capability (`multi-tenancy.md`). Audit log access
  is itself a sensitive read and is rate-limited like other admin reads.

---

## 7. Identifiers

Registered in [`../explanation/terminology.md`](../explanation/terminology.md): entity
`audit_event` / `AuditEvent`; columns `actor_user_id`, `before_json`, `after_json`,
`entity_type`, `entity_id`; recorder `AuditRecorder` / `AuditRecorderInterface`; action
pattern `{entity}.{verb}` and registered verbs (§9).

## Related

- ADR 0013 (audit logging adopted), ADR 0006 (tenancy), ADR 0012 (compliance binding)
- NeNe Invoice `src/Audit/` (reference implementation), ADR 0008 (precedent)
- Self-review: [`../review/backend-api.md`](../review/backend-api.md)

Last updated: 2026-06-04
