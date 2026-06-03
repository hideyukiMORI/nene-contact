<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface SubmissionRepositoryInterface
{
    /** Inserts the submission using its own organization_id; returns the new id. */
    public function create(Submission $submission): int;

    /** Organization-scoped (inbox). */
    public function findById(int $id): ?Submission;

    /**
     * Organization-scoped (inbox).
     *
     * @return list<Submission>
     */
    public function findAll(int $limit, int $offset): array;

    public function count(): int;
}
