<?php

declare(strict_types=1);

namespace NeneContact\Handoff;

/**
 * Persistence for sibling handoff links. Organization-scoped (ADR 0006). Upsert by
 * (submission_id, target); no deletion (ADR 0016).
 */
interface SubmissionLinkRepositoryInterface
{
    /** Submission-level link for a target (attachment_id IS NULL), e.g. Deal. */
    public function findBySubmissionAndTarget(int $submissionId, string $target): ?SubmissionLink;

    /** Per-attachment link for a target (e.g. Vault); pass null for submission-level targets. */
    public function findBySubmissionTargetAttachment(int $submissionId, string $target, ?int $attachmentId): ?SubmissionLink;

    /** @return list<SubmissionLink> */
    public function findBySubmission(int $submissionId): array;

    /** Inserts a new link or updates the existing one for (submission_id, target, attachment_id); returns its id. */
    public function save(SubmissionLink $link): int;
}
