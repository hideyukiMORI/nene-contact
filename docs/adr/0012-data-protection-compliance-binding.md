# ADR 0012: Personal-Data Protection Compliance is Binding (No Professional Sign-Off Gate)

## Status

accepted

## Context

NeNe Contact captures visitor **personal data** (name, email, phone, free text,
attachments, request metadata) through embeddable public forms. It must be defensible to
a privacy/legal professional reviewing the system — the same engineering-discipline bar
the maintainer applies to NeNe Invoice's accounting rules.

NeNe Invoice's `accounting-compliance.md` §0 makes any deviation from its tax rules
require an **explicit 税理士 sign-off recorded in the deviating ADR**, because money and
statutory tax liability are involved. NeNe Contact is different: it handles **no money,
no invoices, no tax figures**, so it carries **no accounting/tax obligation** and the
financial-professional sign-off gate does not apply.

We still want a rock-solid, non-negotiable compliance standard — just without a blocking
external approval step that would stall a money-free product.

## Decision

1. **`docs/explanation/data-protection-compliance.md` is binding (non-negotiable).** A
   privacy/legal professional reviewing the system must find **zero deviations**.
   Compliance wins over UX, performance, and convenience.
2. **No external professional sign-off gate.** Because Contact handles no money,
   development does **not** require 税理士 / 会計士 / 弁護士 approval to proceed. This is
   the deliberate contrast with NeNe Invoice.
3. **Deviation procedure = ADR + maintainer self-authority.** Any departure from the
   binding rules — even temporary — requires an ADR stating reason, scope, and compliance
   impact. The ADR proceeds on maintainer self-authority; no external sign-off is needed
   to merge.
4. **Legal review is encouraged, never blocking.** For high-risk changes, optional
   privacy-lawyer review is recommended in the ADR, but its absence does not block merge.
5. **Jurisdiction scope is Japan law only** (APPI and the rules in the charter §1).
   GDPR/EU coverage is explicitly **operator responsibility** (charter §9).

## Consequences

**Benefits**

- Professional-review-ready standard without a process gate that suits a money product but
  not a free-of-money one.
- Clear, fast deviation path (ADR only) keeps a documentation-phase product moving.

**Costs**

- The maintainer carries the residual risk of a self-authorized deviation; the ADR record
  is the accountability mechanism.

**Follow-up**

- Keep the charter and `docs/review/compliance.md` in lockstep.

## Related

- [`../explanation/data-protection-compliance.md`](../explanation/data-protection-compliance.md)
- [`../explanation/privacy-and-spam-compliance.md`](../explanation/privacy-and-spam-compliance.md)
- ADR 0010 (embed/public-API security), ADR 0013 (audit logging)
- NeNe Invoice `accounting-compliance.md` §0 (the gated precedent this ADR deliberately diverges from)
