<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

/**
 * Persistence for sibling handoff links. Organization-scoped (ADR 0006). Upsert by
 * (submission_id, target); no deletion (ADR 0016).
 */
interface SubmissionLinkRepositoryInterface
{
    public function findBySubmissionAndTarget(int $submissionId, string $target): ?SubmissionLink;

    /** @return list<SubmissionLink> */
    public function findBySubmission(int $submissionId): array;

    /** Inserts a new link or updates the existing one for (submission_id, target); returns its id. */
    public function save(SubmissionLink $link): int;
}
