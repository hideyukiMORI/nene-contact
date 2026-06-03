<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use LogicException;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class UpdateSubmissionStatusUseCase implements UpdateSubmissionStatusUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id, string $status): Submission
    {
        $before = $this->submissions->findById($id);

        if ($before === null) {
            throw new SubmissionNotFoundException($id);
        }

        $this->submissions->updateStatus($id, $status);

        $after = $this->submissions->findById($id);

        if ($after === null) {
            throw new LogicException('Submission disappeared immediately after status update.');
        }

        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'submission.updated',
            'submission',
            $id,
            SubmissionResponse::toAuditSnapshot($before),
            SubmissionResponse::toAuditSnapshot($after),
        );

        return $after;
    }
}
