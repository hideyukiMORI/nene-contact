<?php

declare(strict_types=1);

namespace NeneContact\Api;

interface ListAgentSubmissionsUseCaseInterface
{
    /**
     * Lists submissions for the agent surface. When $includePii is true the raw values will be
     * returned by the response, so this records an audited bulk PII access (`submission.exported`,
     * charter §11); the default redacted read is not audited (no PII disclosed).
     */
    public function execute(int $limit, int $offset, bool $includePii): AgentSubmissionListResult;
}
