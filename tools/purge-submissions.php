<?php

declare(strict_types=1);

/**
 * Retention purge job (charter §5). Two stages:
 *   1. retention expiry  → soft-delete submissions older than their form's retention
 *      (override, else RetentionPolicy::DEFAULT_RETENTION_DAYS).
 *   2. grace expiry      → hard-delete submissions soft-deleted longer than
 *      RetentionPolicy::GRACE_DAYS (personal data removed; deletion stays auditable).
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
    fwrite(STDOUT, "Purge applied: {$result->expired} expired (soft-deleted), {$result->purged} purged (hard-deleted).\n");
} else {
    fwrite(STDOUT, "Dry-run (no changes): {$result->expired} would be soft-deleted on retention expiry, {$result->purged} would be hard-deleted after grace.\n");
    fwrite(STDOUT, "Re-run with --apply to perform the purge.\n");
}
