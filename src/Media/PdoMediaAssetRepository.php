<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Database\DatabaseQueryExecutorInterface;

final readonly class PdoMediaAssetRepository implements MediaAssetRepositoryInterface
{
    private const COLUMNS = 'id, organization_id, storage_key, public_path, mime, width, height, byte_size, original_name, created_by, created_at, updated_at';

    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function save(MediaAsset $asset): int
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'INSERT INTO media_assets (organization_id, storage_key, public_path, mime, width, height, byte_size, original_name, created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $asset->organizationId,
                $asset->storageKey,
                $asset->publicPath,
                $asset->mime,
                $asset->width,
                $asset->height,
                $asset->byteSize,
                $asset->originalName,
                $asset->createdBy,
                $now,
                $now,
            ],
        );

        return $this->query->lastInsertId();
    }

    /** @return list<MediaAsset> */
    public function listByOrganization(int $organizationId): array
    {
        $rows = $this->query->fetchAll(
            'SELECT ' . self::COLUMNS . ' FROM media_assets WHERE organization_id = ? AND deleted_at IS NULL ORDER BY id DESC',
            [$organizationId],
        );

        return array_map(fn (array $row): MediaAsset => $this->mapRow($row), $rows);
    }

    public function findById(int $id): ?MediaAsset
    {
        $row = $this->query->fetchOne(
            'SELECT ' . self::COLUMNS . ' FROM media_assets WHERE id = ? AND deleted_at IS NULL',
            [$id],
        );

        return $row !== null ? $this->mapRow($row) : null;
    }

    public function softDelete(int $id): void
    {
        $now = date('Y-m-d H:i:s');
        $this->query->execute(
            'UPDATE media_assets SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
            [$now, $now, $id],
        );
    }

    /** @param array<string, mixed> $row */
    private function mapRow(array $row): MediaAsset
    {
        return new MediaAsset(
            organizationId: (int) $row['organization_id'],
            storageKey: (string) $row['storage_key'],
            publicPath: (string) $row['public_path'],
            mime: (string) $row['mime'],
            byteSize: (int) $row['byte_size'],
            width: isset($row['width']) ? (int) $row['width'] : null,
            height: isset($row['height']) ? (int) $row['height'] : null,
            originalName: isset($row['original_name']) ? (string) $row['original_name'] : null,
            createdBy: isset($row['created_by']) ? (int) $row['created_by'] : null,
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
