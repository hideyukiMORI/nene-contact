<?php

declare(strict_types=1);

namespace NeneContact\Audit;

interface ListAuditEventsUseCaseInterface
{
    public function execute(int $limit, int $offset): ListAuditEventsResult;
}
