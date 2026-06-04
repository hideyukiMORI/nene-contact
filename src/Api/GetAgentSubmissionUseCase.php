<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\Submission\Submission;
use NeneContact\Submission\SubmissionNotFoundException;
use NeneContact\Submission\SubmissionRepositoryInterface;

final readonly class GetAgentSubmissionUseCase implements GetAgentSubmissionUseCaseInterface
{
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(int $id, bool $includePii): Submission
    {
        $submission = $this->submissions->findById($id);

        if ($submission === null) {
            throw new SubmissionNotFoundException($id);
        }

        if ($includePii) {
            // PII disclosure via the agent surface — audited (§11); no raw values in the trail.
            $this->audit->record(
                null,
                $submission->organizationId,
                'submission.viewed',
                'submission',
                $id,
                null,
                ['via' => 'agent_api', 'include_pii' => true],
            );
        }

        return $submission;
    }
}
