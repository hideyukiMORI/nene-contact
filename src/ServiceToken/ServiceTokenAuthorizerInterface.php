<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

/**
 * Checks a presented service token against the registry at request time (#386).
 *
 * Unlike {@see ServiceTokenRepositoryInterface}, lookups here are **not** org-scoped: the
 * `jti` is globally unique and the request org is derived from the token itself, so revocation
 * must be enforceable before any org scoping is trusted.
 *
 * Contact service tokens always carry a `jti` from issuance — there is no pre-registry token
 * population (this is Contact's first service-token primitive). A token lacking the `jti` claim
 * is therefore never exempt from revocation: the auth dispatcher MUST reject it as invalid
 * (401) and never fall through to signature-only trust.
 */
interface ServiceTokenAuthorizerInterface
{
    /**
     * True when a non-revoked registry row exists for the `jti`. Returns false for an unknown
     * or revoked `jti` (fail-closed).
     */
    public function isActive(string $jti): bool;
}
