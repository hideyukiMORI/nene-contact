<?php

declare(strict_types=1);

/**
 * Guard (ADR 0016): fail if any physical row deletion (`DELETE FROM` / `TRUNCATE`) appears
 * in src/. Records are append-only or soft-deleted; personal data is erased in place
 * (UPDATE), never by deleting rows. Wired into `composer check` as a merge gate.
 */

$root = dirname(__DIR__) . '/src';
$pattern = '/\b(DELETE\s+FROM|TRUNCATE)\b/i';

$violations = [];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
);

/** @var SplFileInfo $file */
foreach ($iterator as $file) {
    if (!$file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }

    $contents = (string) file_get_contents($file->getPathname());
    foreach (explode("\n", $contents) as $i => $line) {
        if (preg_match($pattern, $line) === 1) {
            $violations[] = sprintf('%s:%d: %s', $file->getPathname(), $i + 1, trim($line));
        }
    }
}

if ($violations !== []) {
    fwrite(STDERR, "Physical deletion is forbidden in src/ (ADR 0016 — soft-delete / PII erase-in-place only):\n");
    foreach ($violations as $v) {
        fwrite(STDERR, "  {$v}\n");
    }
    exit(1);
}

fwrite(STDOUT, "No physical deletion in src/ — OK.\n");
