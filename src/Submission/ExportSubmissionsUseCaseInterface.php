<?php

declare(strict_types=1);

namespace NeneContact\Submission;

interface ExportSubmissionsUseCaseInterface
{
    /** Builds a CSV of the resolved organization's submissions and records the export. */
    public function execute(?int $actorUserId): string;
}
