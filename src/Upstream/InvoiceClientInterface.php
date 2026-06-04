<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

/**
 * HTTP boundary to NeNe Invoice (ADR 0002 — HTTP only, never a shared database). Use cases
 * depend on this interface, not the concrete client, so the handoff is testable with a fake.
 */
interface InvoiceClientInterface
{
    /**
     * Creates (or idempotently re-creates) a draft client in Invoice from a submission.
     *
     * @param string               $externalReference idempotency key — the Contact submission id
     * @param array<string, mixed> $payload           draft-client fields (operator's own data)
     *
     * @return string the Invoice client id to store as `submission_link.invoice_client_id`
     *
     * @throws UpstreamRequestException when Invoice is not configured or the request fails
     */
    public function createDraftClient(string $externalReference, array $payload): string;
}
