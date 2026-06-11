<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface GetSubmissionTechnicalMetaUseCaseInterface
{
    /**
     * Discloses the submission's technical reception metadata (IP / User-Agent) for abuse
     * investigation, recording the access as an audit event (ADR 0018). Returns the full
     * submission; the caller presents only ip / user_agent.
     */
    public function execute(?int $actorUserId, int $id): Submission;
}
