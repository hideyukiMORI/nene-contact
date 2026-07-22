<?php

declare(strict_types=1);

/**
 * Guard (ADR 0013): every mutating use case must leave an audit trail. We approximate
 * "mutating" structurally: a concrete `*UseCase` either references `AuditRecorderInterface`
 * (it records who/what/before/after), or it is a declared read-only use case on the
 * allowlist below. A use case that is neither fails the build — so a new mutation that
 * forgets to audit cannot merge, and a genuinely read-only use case is a visible, reviewed
 * allowlist entry rather than a silent omission. Wired into `composer check` as a merge gate.
 *
 * When you add a use case:
 *   - mutating  -> inject AuditRecorderInterface and call ->record(...); nothing to do here.
 *   - read-only -> add its `Area/NameUseCase.php` path to READ_ONLY_USE_CASES with a reason.
 */

$root = dirname(__DIR__) . '/src';

/**
 * Read-only use cases: they perform no mutation, so they record no audit_event.
 * Keyed by path relative to src/. Keep the reason current — if one starts writing,
 * remove it here and add auditing instead.
 *
 * @var array<string, string>
 */
const READ_ONLY_USE_CASES = [
    'Api/ListAgentFormsUseCase.php' => 'lists forms for an agent (read)',
    'Audit/ListAuditEventsUseCase.php' => 'lists audit events for the org (read)',
    'Auth/GetUserByIdUseCase.php' => 'fetches one user (read)',
    'Auth/ListUsersUseCase.php' => 'lists users (read)',
    'Auth/LoginUseCase.php' => 'verifies credentials and issues a token; no domain write',
    'ContactForm/GetContactFormByIdUseCase.php' => 'fetches one form (read)',
    'ContactForm/ListContactFormsUseCase.php' => 'lists forms (read)',
    'Handoff/ListSubmissionHandoffsUseCase.php' => 'lists handoffs for a submission (read)',
    'Media/ListMediaUseCase.php' => 'lists media assets for the org (read)',
    'Notification/GetNotificationChannelUseCase.php' => 'fetches one channel (read; config redacted)',
    'Notification/ListNotificationChannelsUseCase.php' => 'lists channels (read)',
    'Organization/GetOrganizationByIdUseCase.php' => 'fetches one organization (read)',
    'Organization/ListOrganizationsUseCase.php' => 'lists organizations (read)',
    'Records/FetchRecordsOptionsUseCase.php' => 'fetches option lists from the Records sibling (read)',
    'ServiceToken/ListServiceTokensUseCase.php' => 'lists service tokens for the org (read)',
    'Submission/GetSubmissionByIdUseCase.php' => 'admin submission detail read (masking/audit handled at the agent surface)',
    'Submission/ListSubmissionNotesUseCase.php' => 'lists internal notes (read)',
    'Submission/ListSubmissionsUseCase.php' => 'admin submission list read (masked)',
    'Tag/ListTagsUseCase.php' => 'lists the org tag vocabulary (read)',
];

$missing = [];   // mutating-by-default use cases with neither audit nor allowlist entry
$staleAllowlist = []; // allowlist entries whose file no longer exists

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
);

/** @var SplFileInfo $file */
foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }

    $name = $file->getFilename();
    if (!str_ends_with($name, 'UseCase.php') || str_ends_with($name, 'UseCaseInterface.php')) {
        continue;
    }

    $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
    $contents = (string) file_get_contents($file->getPathname());

    $isAudited = str_contains($contents, 'AuditRecorderInterface');
    $isAllowlisted = array_key_exists($relative, READ_ONLY_USE_CASES);

    if (!$isAudited && !$isAllowlisted) {
        $missing[] = $relative;
    }
}

foreach (array_keys(READ_ONLY_USE_CASES) as $relative) {
    if (!is_file($root . '/' . $relative)) {
        $staleAllowlist[] = $relative;
    }
}

if ($missing !== [] || $staleAllowlist !== []) {
    if ($missing !== []) {
        fwrite(STDERR, "Unaudited use case(s) (ADR 0013 — every mutation records who/what/before/after):\n");
        foreach ($missing as $m) {
            fwrite(STDERR, "  src/{$m}\n");
        }
        fwrite(STDERR, "  -> inject AuditRecorderInterface and call ->record(...), or, if truly read-only,\n");
        fwrite(STDERR, "     add it to READ_ONLY_USE_CASES in tools/check-usecases-audited.php with a reason.\n");
    }
    if ($staleAllowlist !== []) {
        fwrite(STDERR, "Stale READ_ONLY_USE_CASES entries (file no longer exists — remove them):\n");
        foreach ($staleAllowlist as $s) {
            fwrite(STDERR, "  src/{$s}\n");
        }
    }
    exit(1);
}

fwrite(STDOUT, "Every use case is audited or an allowlisted read-only — OK.\n");
