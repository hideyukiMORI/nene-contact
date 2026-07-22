<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * Persistence for tag assignments on submissions (ADR 0019). Reads join the org's non-deleted
 * `tags` (scoped by the resolved organization, ADR 0014). Assignments are append-only with a
 * soft remove (ADR 0016); one active row per (submission_id, tag_id).
 */
interface SubmissionTagRepositoryInterface
{
    /**
     * Applies the tag to the submission at the given timestamp. Idempotent: a no-op when an
     * active assignment already exists; a soft-removed one is reactivated.
     */
    public function add(int $submissionId, int $tagId, string $createdAt): void;

    /**
     * Soft-removes the assignment at the given timestamp. Idempotent: a no-op when no active
     * assignment exists.
     */
    public function remove(int $submissionId, int $tagId, string $deletedAt): void;

    /**
     * Active tag views ({id,label,color}) for one submission, in the tag's sort order.
     *
     * @return list<array{id: int, label: string, color: string}>
     */
    public function findTagViewsForSubmission(int $submissionId): array;

    /**
     * Active tag views grouped by submission id, for a page of submissions (avoids N+1).
     *
     * @param list<int> $submissionIds
     * @return array<int, list<array{id: int, label: string, color: string}>>
     */
    public function findTagViewsForSubmissions(array $submissionIds): array;
}
