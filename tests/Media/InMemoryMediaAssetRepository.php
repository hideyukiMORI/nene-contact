<?php

declare(strict_types=1);

namespace NeneContact\Tests\Media;

use NeneContact\Media\MediaAsset;
use NeneContact\Media\MediaAssetRepositoryInterface;

final class InMemoryMediaAssetRepository implements MediaAssetRepositoryInterface
{
    /** @var array<int, MediaAsset> */
    public array $assets = [];

    private int $nextId = 1;

    public function seed(MediaAsset $asset): void
    {
        $id = $asset->id ?? $this->nextId;
        $this->assets[$id] = $asset;
        $this->nextId = max($this->nextId, $id + 1);
    }

    public function save(MediaAsset $asset): int
    {
        $id = $this->nextId++;
        $this->assets[$id] = new MediaAsset(
            organizationId: $asset->organizationId,
            storageKey: $asset->storageKey,
            publicPath: $asset->publicPath,
            mime: $asset->mime,
            byteSize: $asset->byteSize,
            width: $asset->width,
            height: $asset->height,
            originalName: $asset->originalName,
            createdBy: $asset->createdBy,
            id: $id,
            createdAt: '2026-06-14 00:00:00',
            updatedAt: '2026-06-14 00:00:00',
        );

        return $id;
    }

    /** @return list<MediaAsset> */
    public function listByOrganization(int $organizationId): array
    {
        $out = [];
        foreach ($this->assets as $a) {
            if ($a->organizationId === $organizationId) {
                $out[] = $a;
            }
        }

        return $out;
    }

    public function findById(int $id): ?MediaAsset
    {
        return $this->assets[$id] ?? null;
    }

    public function softDelete(int $id): void
    {
        unset($this->assets[$id]);
    }
}
