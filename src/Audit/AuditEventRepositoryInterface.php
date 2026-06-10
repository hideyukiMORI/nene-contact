<?php

declare(strict_types=1);

namespace NeneContact\Audit;

interface AuditEventRepositoryInterface
{
    public function append(AuditEvent $event): int;
}
