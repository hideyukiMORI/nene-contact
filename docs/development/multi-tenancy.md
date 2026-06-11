# Multi-Tenancy (binding)

NeNe Contact is **multi-tenant from the foundation** (ADR 0006). Multi-tenancy is a
**build-time premise**, not a later feature: every tenant-scoped query is filtered by the
resolved `organization_id`, and cross-tenant access is impossible except for `superadmin`.

This spec mirrors **NeNe Records'** working implementation
(`src/Organization/Resolution/`, `src/Auth/`) and adapts it to Contact's three HTTP
surfaces. It is the binding implementation standard for Phase 1+ runtime.

> **Enforcement:** a tenant-scoped repository query that is **not** filtered by
> `organization_id` is a defect that **blocks merge**. Cross-tenant listing/reads/writes
> are prohibited except explicit `superadmin` organization-management routes. Deviations
> require an ADR (self-authority, ADR 0012 model).

Read with: [`backend-standards.md`](./backend-standards.md),
[`naming-conventions.md`](./naming-conventions.md),
[ADR 0006](../adr/0006-multi-tenancy-and-roles.md),
[ADR 0014](../adr/0014-tenant-resolution-and-rbac.md).

---

## 1. Model

- **`organization`** is the tenant. Every tenant-scoped table carries **`organization_id`**:
  `contact_forms`, `form_fields`, `submissions`, `submission_notes`,
  `notification_channels`, `submission_links`, `audit_events`, `users` (ADR 0006).
- A single-SMB install runs as **one** organization (resolution mode `single`); agencies
  run many on one instance.
- `superadmin` may have `organization_id = null` and operates cross-tenant.

---

## 2. Tenant resolution by HTTP surface

Org resolution happens in middleware **before authorization**. The org id is stored in a
request-scoped holder (`RequestScopedHolder<int>`) that repositories read; the request also
carries `nene2.org.id` / `nene2.org.slug` attributes.

| Surface | How the organization is resolved |
| --- | --- |
| **`/admin/*`** | `OrgResolverMiddleware` + a pluggable strategy (`TENANT_RESOLUTION`), then `CapabilityMiddleware` verifies the **JWT `org_id` equals the resolved org id** (superadmin bypasses). |
| **`/public/forms/{public_form_key}/*`** | Resolved from the **form's** `organization_id` via `public_form_key` lookup. The embed runs on arbitrary third-party domains, so host strategies do **not** apply here. Allowed-origin + rate limit + honeypot (ADR 0010) are enforced separately. |
| **`/api/*`** (service) | Resolved from the **org-scoped service token** presented by the machine client (charter P9). The token determines the tenant; no host strategy. |

### Admin resolution strategies (`OrgResolutionStrategyInterface`)

Selected by the `TENANT_RESOLUTION` env value:

| Value | Strategy | Identifier source |
| --- | --- | --- |
| `single` | `EnvResolutionStrategy` | fixed org slug from env (single-SMB default) |
| `path` | `PathPrefixResolutionStrategy` | first path segment (`/{org}/admin/...`) |
| `subdomain` | `SubdomainResolutionStrategy` | host subdomain (`{org}.example.com`) |
| `custom_domain` | `CustomDomainResolutionStrategy` | full host, matched to `organizations.custom_domain` |

`OrgResolverMiddleware`: strategy → identifier → `findBySlug()` then
`findByCustomDomain()`; inactive org → `403 org-inactive`; unknown → `404 org-not-found`;
unresolved → `404 org-not-resolved`. **Bypass prefixes** (no org context):
`/health`, `/admin/auth/` (login), and superadmin organization-management routes.

---

## 3. Roles & capabilities

`Role` (backed string enum) and `Capability` (enum), mirroring NeNe Records.

| Role | Value | Scope |
| --- | --- | --- |
| Superadmin | `superadmin` | Cross-tenant; everything incl. `manage_organizations` |
| Admin | `admin` | One org; everything except `manage_organizations` |
| Editor | `editor` | One org; operates the submissions inbox only |

| Capability (enum case) | Gates |
| --- | --- |
| `ManageOrganizations` | Create/list/delete tenants (superadmin only) |
| `ManageUsers` | Org user management |
| `ManageForms` | `contact_form` + `form_field` CRUD |
| `ManageChannels` | `notification_channel` + webhook config |
| `ManageSettings` | Org settings |
| `ViewSubmissions` | Read submissions inbox |
| `ManageSubmissions` | Status, notes, delete, export, handoff retry |
| `ViewSubmissionTechnicalMeta` | Disclose a submission's IP / User-Agent (audited; abuse investigation, ADR 0018) |

Role → capability matrix (`Role::hasCapability()`):

| Capability | superadmin | admin | editor |
| --- | --- | --- | --- |
| ManageOrganizations | ✓ | ✗ | ✗ |
| ManageUsers / ManageForms / ManageChannels / ManageSettings | ✓ | ✓ | ✗ |
| ViewSubmissions / ManageSubmissions | ✓ | ✓ | ✓ |
| ViewSubmissionTechnicalMeta | ✓ | ✓ | ✗ |

`CapabilityResolver::resolve(path, method)` maps each admin route + method to the required
`Capability`; `CapabilityMiddleware` (after auth) returns `403 forbidden` when the role
lacks it, and `403 org-access-denied` when a non-superadmin JWT `org_id` ≠ resolved org id.

---

## 4. Repository scoping (the hard rule)

Every tenant-scoped `Pdo*Repository` injects the org holder and filters **every** query:

```php
final class PdoSubmissionRepository implements SubmissionRepositoryInterface
{
    /** @param RequestScopedHolder<int> $orgId */
    public function __construct(
        private readonly DatabaseQueryExecutorInterface $query,
        private readonly RequestScopedHolder $orgId,
    ) {}

    public function findById(int $id): ?Submission
    {
        $row = $this->query->fetchOne(
            'SELECT * FROM submissions WHERE id = ? AND organization_id = ?',
            [$id, $this->orgId->get()],
        );
        return $row !== null ? $this->hydrate($row) : null;
    }
}
```

- **No tenant query without `organization_id = ?`** — including `INSERT` (set it),
  `UPDATE`/`DELETE` (filter by it), and every `SELECT`/count.
- Repositories on **bypass** routes (superadmin org management) must not call
  `$orgId->get()`; they operate cross-tenant by explicit design.
- A submission is **never** cross-tenant listable (ADR 0006).

---

## 5. Middleware order (admin pipeline)

```text
request id → CORS → security headers → body size limit → JSON parse
  → OrgResolverMiddleware (sets org holder + attributes; bypass paths skip)
  → BearerTokenMiddleware (JWT → nene2.auth.claims)
  → CapabilityMiddleware (role capability + JWT org == resolved org)
  → routing → handler
```

Public (`/public/*`) and service (`/api/*`) pipelines resolve the org from the form key /
service token respectively (no JWT capability stage for public).

---

## 6. Audit & compliance ties

- Org-scoped audit: `audit_events` carries `organization_id`; admin mutations and PII
  access are recorded (ADR 0013).
- Tenant isolation is a security boundary (charter §6); a cross-tenant leak is a P0
  compliance defect.

---

## 7. Identifiers

All tenancy identifiers are registered in
[`../explanation/terminology.md`](../explanation/terminology.md): `organization_id`, roles
(`superadmin`/`admin`/`editor`), capability case names, request attributes
(`nene2.org.id`, `nene2.org.slug`), `TENANT_RESOLUTION` values, and org problem slugs
(`org-not-found`, `org-inactive`, `org-not-resolved`, `org-access-denied`).

## Related

- ADR 0006 (adopt multi-tenancy), ADR 0014 (resolution + RBAC design)
- NeNe Records `src/Organization/Resolution/`, `src/Auth/` (reference implementation)
- Self-review: [`../review/backend-api.md`](../review/backend-api.md)

Last updated: 2026-06-04
