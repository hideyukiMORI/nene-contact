<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

/**
 * Stores attachment bytes outside the database (charter §2: never inlined into
 * notifications; retrievable only via the audited admin path).
 */
interface AttachmentStorageInterface
{
    /** Stores the bytes and returns an opaque storage key. */
    public function put(int $organizationId, string $bytes): string;

    /** Reads the bytes for a storage key, or null if missing. */
    public function get(string $storageKey): ?string;

    /** Physically removes the bytes for a storage key (retention erasure, ADR 0016). */
    public function erase(string $storageKey): void;
}
