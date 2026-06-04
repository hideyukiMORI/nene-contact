<?php

declare(strict_types=1);

namespace NeneContact\Api;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\Submission\SubmissionRepositoryInterface;

final readonly class ListAgentSubmissionsUseCase implements ListAgentSubmissionsUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private SubmissionRepositoryInterface $submissions,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(int $limit, int $offset, bool $includePii): AgentSubmissionListResult
    {
        $items = $this->submissions->findAll($limit, $offset);
        $total = $this->submissions->count();

        if ($includePii) {
            // Bulk PII disclosure via the agent surface — audited like a CSV export (§11).
            $this->audit->record(
                null,
                $this->orgId->get(),
                'submission.exported',
                'submission',
                null,
                null,
                ['via' => 'agent_api', 'include_pii' => true, 'count' => count($items)],
            );
        }

        return new AgentSubmissionListResult($items, $total, $limit, $offset);
    }
}
