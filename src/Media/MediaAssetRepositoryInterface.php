<?php

declare(strict_types=1);

namespace NeneContact\Media;

interface MediaAssetRepositoryInterface
{
    public function save(MediaAsset $asset): int;

    /** @return list<MediaAsset> live assets for the org, newest first */
    public function listByOrganization(int $organizationId): array;

    public function findById(int $id): ?MediaAsset;

    /** Soft-delete (ADR 0016): set deleted_at; the row + audit linkage survive. */
    public function softDelete(int $id): void;
}
