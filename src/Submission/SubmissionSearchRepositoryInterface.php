<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * Server-side, organization-scoped inbox search/filter. Kept separate from
 * SubmissionRepositoryInterface so unrelated test doubles need not implement it.
 */
interface SubmissionSearchRepositoryInterface
{
    /**
     * @return list<Submission>
     */
    public function search(SubmissionFilter $filter, int $limit, int $offset): array;

    /** Total matching the filter (for pagination). */
    public function countMatching(SubmissionFilter $filter): int;

    /**
     * Per-status counts for the filter with its own status constraint ignored, so the
     * status tabs show totals across statuses for the current query/form/date.
     *
     * @return array<string, int>
     */
    public function statusCounts(SubmissionFilter $filter): array;
}
