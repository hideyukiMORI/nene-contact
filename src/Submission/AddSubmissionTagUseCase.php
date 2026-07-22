<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Http\ClockInterface;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\Tag\TagNotFoundException;
use NeneContact\Tag\TagRepositoryInterface;

/**
 * Applies an org tag to a submission (ADR 0019). Both the submission and the tag are resolved
 * org-scoped (ADR 0014), so a foreign submission or a foreign/unknown tag is a 404 and no
 * cross-tenant assignment is possible. Idempotent (re-applying is a no-op). Persists then audits
 * `submission.tagged` — the snapshot carries `{tag_id, label}`, never submission field values
 * (ADR 0013).
 */
final readonly class AddSubmissionTagUseCase implements AddSubmissionTagUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private TagRepositoryInterface $tags,
        private SubmissionTagRepositoryInterface $assignments,
        private AuditRecorderInterface $audit,
        private ClockInterface $clock,
    ) {
    }

    public function execute(?int $actorUserId, int $submissionId, int $tagId): void
    {
        $submission = $this->submissions->findById($submissionId);
        if ($submission === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        $tag = $this->tags->findById($tagId);
        if ($tag === null) {
            throw new TagNotFoundException($tagId);
        }

        $now = $this->clock->now()->format('Y-m-d H:i:s');
        $this->assignments->add($submissionId, $tagId, $now);

        $this->audit->record(
            $actorUserId,
            $submission->organizationId,
            'submission.tagged',
            'submission',
            $submissionId,
            null,
            ['tag_id' => $tagId, 'label' => $tag->label],
        );
    }
}
