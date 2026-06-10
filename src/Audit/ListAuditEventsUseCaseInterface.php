<?php

declare(strict_types=1);

namespace NeneContact\Audit;

interface ListAuditEventsUseCaseInterface
{
    public function execute(AuditEventFilter $filter, int $limit, int $offset): ListAuditEventsResult;
}
