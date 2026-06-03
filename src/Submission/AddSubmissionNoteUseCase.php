<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\Audit\AuditRecorderInterface;

final readonly class AddSubmissionNoteUseCase implements AddSubmissionNoteUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private SubmissionNoteRepositoryInterface $notes,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $submissionId, string $body): SubmissionNote
    {
        $submission = $this->submissions->findById($submissionId);

        if ($submission === null) {
            throw new SubmissionNotFoundException($submissionId);
        }

        $id = $this->notes->create(new SubmissionNote(
            organizationId: $submission->organizationId,
            submissionId: $submissionId,
            body: $body,
            authorUserId: $actorUserId,
        ));

        // Redacted snapshot — the note body is operator content and is not copied into the trail.
        $this->audit->record(
            $actorUserId,
            $submission->organizationId,
            'submission_note.created',
            'submission_note',
            $id,
            null,
            ['id' => $id, 'submission_id' => $submissionId],
        );

        return new SubmissionNote(
            organizationId: $submission->organizationId,
            submissionId: $submissionId,
            body: $body,
            authorUserId: $actorUserId,
            id: $id,
        );
    }
}
