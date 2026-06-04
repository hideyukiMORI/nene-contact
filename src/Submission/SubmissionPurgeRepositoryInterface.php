<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * Cross-tenant access for the retention purge job (system context, no request-scoped
 * organization). Reads candidate metadata only — never submitted field values — so the
 * purge decision touches no PII.
 */
interface SubmissionPurgeRepositoryInterface
{
    /**
     * Active (not soft-deleted) submissions with their form's effective retention in days
     * (form override, else the supplied default).
     *
     * @return list<array{id: int, organization_id: int, submitted_at: string, retention_days: int}>
     */
    public function findActiveWithRetention(int $defaultRetentionDays): array;

    /**
     * Soft-deleted submissions awaiting hard-delete.
     *
     * @return list<array{id: int, organization_id: int, deleted_at: string}>
     */
    public function findSoftDeleted(): array;

    public function softDeleteById(int $id): void;

    /**
     * Erases a submission's personal data in place (ADR 0016): the row survives for the
     * audit trail; field values / ip / user_agent are cleared and `purged_at` is set. No
     * physical row deletion.
     */
    public function erasePiiById(int $id): void;
}
