<?php

declare(strict_types=1);

namespace NeneContact\Media;

/**
 * Stores media bytes on a publicly-servable filesystem path. Unlike submission attachments
 * (private, audited download), media assets are operator brand images served directly to the
 * embed on third-party sites, so they live under a cacheable, unguessable public URL.
 */
interface MediaStorageInterface
{
    /**
     * Writes the bytes for an org and returns the storage key + the public URL path.
     *
     * @return array{0: string, 1: string} [storageKey, publicPath]
     */
    public function put(int $organizationId, string $bytes, string $extension): array;

    /** Removes the bytes for a storage key (best-effort; metadata row is soft-deleted). */
    public function erase(string $storageKey): void;
}
