<?php

declare(strict_types=1);

/**
 * Retention purge job (charter §5). Two stages:
 *   1. retention expiry  → soft-delete submissions older than their form's retention
 *      (override, else RetentionPolicy::DEFAULT_RETENTION_DAYS).
 *   2. grace expiry      → erase PII in place for submissions soft-deleted longer than
 *      RetentionPolicy::GRACE_DAYS (ADR 0016: the row survives for the audit trail; field
 *      values / ip / user_agent are cleared and purged_at is set).
 *
 * Usage:
 *   php tools/purge-submissions.php            # dry-run (default): reports counts only
 *   php tools/purge-submissions.php --apply    # perform the destructive purge
 *
 * Dry-run is the default so operators preview before any bulk destruction.
 */

use NeneContact\Http\RuntimeContainerFactory;
use NeneContact\Submission\PurgeSubmissionsUseCaseInterface;

require dirname(__DIR__) . '/vendor/autoload.php';

$apply = in_array('--apply', array_slice($argv, 1), true);

$container = (new RuntimeContainerFactory(dirname(__DIR__)))->create();

$useCase = $container->get(PurgeSubmissionsUseCaseInterface::class);
assert($useCase instanceof PurgeSubmissionsUseCaseInterface);

$result = $useCase->execute($apply);

if ($result->applied) {
    fwrite(STDOUT, "Purge applied: {$result->expired} expired (soft-deleted), {$result->purged} purged (PII erased in place), {$result->attachmentsErased} attachment(s) erased.\n");
} else {
    fwrite(STDOUT, "Dry-run (no changes): {$result->expired} would be soft-deleted on retention expiry, {$result->purged} would have PII erased after grace, {$result->attachmentsErased} attachment(s) would be erased.\n");
    fwrite(STDOUT, "Re-run with --apply to perform the purge.\n");
}
