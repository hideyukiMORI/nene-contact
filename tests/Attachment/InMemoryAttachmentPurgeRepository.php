<?php

declare(strict_types=1);

namespace NeneContact\Tests\Attachment;

use NeneContact\Attachment\AttachmentPurgeRepositoryInterface;

final class InMemoryAttachmentPurgeRepository implements AttachmentPurgeRepositoryInterface
{
    /** @var list<int> */
    public array $purgedIds = [];

    /** @var list<int> */
    public array $orphanPurgedIds = [];

    /**
     * @param array<int, list<array{id: int, organization_id: int, storage_key: string}>> $erasableBySubmission
     * @param list<array{id: int, organization_id: int, storage_key: string, created_at: string}> $orphans
     */
    public function __construct(
        private array $erasableBySubmission = [],
        private array $orphans = [],
    ) {
    }

    /** @return list<array{id: int, organization_id: int, storage_key: string}> */
    public function findErasableBySubmission(int $submissionId): array
    {
        return $this->erasableBySubmission[$submissionId] ?? [];
    }

    /** @return list<array{id: int, organization_id: int, storage_key: string, created_at: string}> */
    public function findOrphans(): array
    {
        return $this->orphans;
    }

    public function markPurged(int $id): void
    {
        $this->purgedIds[] = $id;
    }

    public function markOrphanPurged(int $id): void
    {
        $this->orphanPurgedIds[] = $id;
    }
}
