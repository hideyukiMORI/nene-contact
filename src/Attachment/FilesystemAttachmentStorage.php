<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use RuntimeException;

/**
 * Filesystem-backed attachment storage under {baseDir}/{organization_id}/{key}. The key
 * is organization-prefixed so erasure and listing stay tenant-isolated.
 */
final readonly class FilesystemAttachmentStorage implements AttachmentStorageInterface
{
    public function __construct(
        private string $baseDir,
    ) {
    }

    public function put(int $organizationId, string $bytes): string
    {
        $key = $organizationId . '/' . bin2hex(random_bytes(16));
        $path = $this->path($key);
        $dir = dirname($path);

        if (!is_dir($dir) && !mkdir($dir, 0o770, true) && !is_dir($dir)) {
            throw new RuntimeException('Could not create attachment directory.');
        }

        if (file_put_contents($path, $bytes) === false) {
            throw new RuntimeException('Could not write attachment.');
        }

        return $key;
    }

    public function get(string $storageKey): ?string
    {
        $path = $this->path($storageKey);
        if (!is_file($path)) {
            return null;
        }

        $bytes = file_get_contents($path);

        return $bytes === false ? null : $bytes;
    }

    public function erase(string $storageKey): void
    {
        $path = $this->path($storageKey);
        if (is_file($path)) {
            unlink($path);
        }
    }

    private function path(string $storageKey): string
    {
        // Guard against traversal: keys are <int>/<hex> produced by put().
        if (!preg_match('#^\d+/[0-9a-f]{32}$#', $storageKey)) {
            throw new RuntimeException('Invalid storage key.');
        }

        return rtrim($this->baseDir, '/') . '/' . $storageKey;
    }
}
