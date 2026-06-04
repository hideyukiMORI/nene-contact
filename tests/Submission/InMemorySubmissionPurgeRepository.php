<?php

declare(strict_types=1);

namespace NeneContact\Tests\Submission;

use NeneContact\Submission\SubmissionPurgeRepositoryInterface;

final class InMemorySubmissionPurgeRepository implements SubmissionPurgeRepositoryInterface
{
    /** @var list<int> */
    public array $softDeletedIds = [];

    /** @var list<int> */
    public array $erasedIds = [];

    /**
     * @param list<array{id: int, organization_id: int, submitted_at: string, retention_days: int}> $active
     * @param list<array{id: int, organization_id: int, deleted_at: string}> $softDeleted
     */
    public function __construct(
        private array $active = [],
        private array $softDeleted = [],
    ) {
    }

    /** @return list<array{id: int, organization_id: int, submitted_at: string, retention_days: int}> */
    public function findActiveWithRetention(int $defaultRetentionDays): array
    {
        return $this->active;
    }

    /** @return list<array{id: int, organization_id: int, deleted_at: string}> */
    public function findSoftDeleted(): array
    {
        return $this->softDeleted;
    }

    public function softDeleteById(int $id): void
    {
        $this->softDeletedIds[] = $id;
    }

    public function erasePiiById(int $id): void
    {
        $this->erasedIds[] = $id;
    }
}
