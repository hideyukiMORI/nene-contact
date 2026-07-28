<?php

declare(strict_types=1);

namespace NeneContact\Audit;

interface ExportAuditEventsUseCaseInterface
{
    /**
     * Builds the CSV for the audit events matching $filter and records the export itself.
     */
    public function execute(AuditEventFilter $filter, ?int $actorUserId): string;
}
