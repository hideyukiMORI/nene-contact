<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

/**
 * HTTP boundary to NeNe Deal (ADR 0002 — HTTP only, never a shared database). Use cases
 * depend on this interface, not the concrete client, so the handoff is testable with a fake.
 */
interface DealClientInterface
{
    /**
     * Creates (or idempotently re-creates) an opportunity in Deal from a submission.
     *
     * @param string               $externalReference idempotency key — the Contact submission id (DO D11)
     * @param array<string, mixed> $payload           opportunity fields (operator's own data)
     *
     * @return string the Deal opportunity id to store as `submission_link.deal_opportunity_id`
     *
     * @throws UpstreamRequestException when Deal is not configured or the request fails
     */
    public function createOpportunity(string $externalReference, array $payload): string;
}
