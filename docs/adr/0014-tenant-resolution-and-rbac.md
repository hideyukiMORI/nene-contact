# ADR 0014: Tenant Resolution Strategies and RBAC (mirror NeNe Records)

## Status

accepted

## Context

ADR 0006 adopted multi-tenancy as foundational but did not pin **how** the organization is
resolved per request, nor the role/capability mechanism. NeNe Records already runs a
proven implementation on NENE2 (`src/Organization/Resolution/`, `src/Auth/`); reusing its
shape avoids reinventing tenancy and keeps the suite consistent.

Contact differs from Records in one important way: its **public embed** is submitted from
**arbitrary third-party domains**, so host-based strategies (subdomain / custom domain)
cannot identify the tenant on the public surface. The `public_form_key` already encodes
which form — and therefore which organization — a submission belongs to.

## Decision

1. **Reuse the NeNe Records mechanism**: an `OrgResolverMiddleware` driven by a pluggable
   `OrgResolutionStrategyInterface`, storing the resolved org id in a
   `RequestScopedHolder<int>` that repositories read, plus `Role` / `Capability` enums, a
   `CapabilityResolver` (route+method → capability), and a `CapabilityMiddleware` that
   checks the role capability **and** that a non-superadmin JWT `org_id` equals the
   resolved org id.
2. **Admin resolution strategies** are selected by `TENANT_RESOLUTION`:
   `single` (env, default), `path`, `subdomain`, `custom_domain`.
3. **Per-surface resolution (Contact-specific):**
   - `/admin/*` → strategy + JWT org match.
   - `/public/forms/{public_form_key}/*` → org from the **form** via `public_form_key`
     (no host strategy; embed is cross-origin by design).
   - `/api/*` → org from the **org-scoped service token** (charter P9).
4. **Roles:** `superadmin` (cross-tenant, incl. `manage_organizations`), `admin` (one org,
   all except `manage_organizations`), `editor` (one org, submissions inbox only).
5. **Repository scoping is mandatory:** every tenant-scoped query filters by
   `organization_id` from the holder; superadmin org-management routes are the only
   cross-tenant code, by explicit design.
6. **Bypass paths** (`/health`, `/admin/auth/`, superadmin org management) skip org
   resolution.

Full spec: [`../development/multi-tenancy.md`](../development/multi-tenancy.md).

## Consequences

**Benefits**

- Tenant isolation is structural and consistent with NeNe Records / the suite.
- Public embed works from any host without a tenant host strategy.
- Capability-per-route keeps authorization explicit and testable.

**Costs**

- Every repository method takes the org holder; public/service surfaces need their own
  resolution path (form key / token) distinct from the admin strategy.

**Follow-up**

- Implement in Phase 1 runtime (Issue #5 — multi-tenant org + auth).
- Contract tests asserting cross-tenant reads/writes are impossible.

## Related

- ADR 0006 (multi-tenancy adopted), ADR 0010 (public security), ADR 0013 (audit)
- [`../development/multi-tenancy.md`](../development/multi-tenancy.md)
- NeNe Records ADR 0006 + `src/Organization/Resolution/`, `src/Auth/` (precedent)
