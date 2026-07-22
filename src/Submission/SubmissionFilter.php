<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * Inbox filter for the admin submissions list. All fields optional; nulls mean "no filter".
 * `q` matches raw submitted content server-side (never shipped raw to the client — the list
 * response masks values, charter §11). `from`/`to` are 'YYYY-MM-DD' (inclusive) on submitted_at.
 * `tagIds` is an AND filter — a submission must carry **all** listed tags (ADR 0019).
 */
final readonly class SubmissionFilter
{
    /**
     * @param list<int> $tagIds
     */
    public function __construct(
        public ?string $status = null,
        public ?int $contactFormId = null,
        public ?string $from = null,
        public ?string $to = null,
        public ?string $q = null,
        public ?string $sort = null,
        public array $tagIds = [],
    ) {
    }
}
