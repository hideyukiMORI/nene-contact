<?php

declare(strict_types=1);

namespace NeneContact\Submission;

/**
 * Documented retention defaults (charter §5). A form may override retention via
 * `retention_days`; when it is null the system uses {@see DEFAULT_RETENTION_DAYS} so
 * personal data is never retained indefinitely by accident. Deletion is two-stage:
 * retention expiry soft-deletes the submission; after {@see GRACE_DAYS} the purge job
 * hard-deletes the personal data.
 */
final class RetentionPolicy
{
    /** Default retention when a form sets no explicit policy. */
    public const DEFAULT_RETENTION_DAYS = 365;

    /** Grace period between soft-delete and hard-delete (purge). */
    public const GRACE_DAYS = 30;

    /** Grace before an uploaded-but-never-submitted attachment (orphan) is erased. */
    public const ORPHAN_GRACE_DAYS = 1;

    public static function retentionDaysFor(?int $formRetentionDays): int
    {
        return $formRetentionDays ?? self::DEFAULT_RETENTION_DAYS;
    }
}
