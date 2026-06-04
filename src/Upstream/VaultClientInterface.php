<?php

declare(strict_types=1);

namespace NeneContact\Upstream;

/**
 * HTTP boundary to NeNe Vault (ADR 0002 — HTTP only, never a shared database). Use cases
 * depend on this interface, not the concrete client, so the handoff is testable with a fake.
 */
interface VaultClientInterface
{
    /**
     * Archives an attachment in Vault as a received document.
     *
     * @param string               $externalReference idempotency key (DO D12)
     * @param string               $filename          original filename
     * @param string               $contentType       MIME type of the bytes
     * @param string               $bytes             the file bytes
     * @param array<string, mixed> $metadata          document metadata (operator's own data)
     *
     * @return string the Vault document id to store as `submission_link.vault_document_id`
     *
     * @throws UpstreamRequestException when Vault is not configured or the request fails
     */
    public function archiveDocument(string $externalReference, string $filename, string $contentType, string $bytes, array $metadata): string;
}
