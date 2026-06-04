<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface SubmissionRepositoryInterface
{
    /** Inserts the submission using its own organization_id; returns the new id. */
    public function create(Submission $submission): int;

    /** Organization-scoped (inbox). */
    public function findById(int $id): ?Submission;

    /** Organization-scoped status update. */
    public function updateStatus(int $id, string $status): void;

    /** Organization-scoped soft-delete (sets deleted_at; hides the record from the inbox). */
    public function softDelete(int $id): void;

    /**
     * Organization-scoped (inbox).
     *
     * @return list<Submission>
     */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;
}
