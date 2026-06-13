<?php

declare(strict_types=1);

namespace NeneContact\Media;

use RuntimeException;

/**
 * Stores media under {publicDir}/media/{organization_id}/{hash}.{ext}, served statically by the
 * web server (the .htaccess front-controller passes through real files). The storage key is the
 * org-prefixed relative path; the public path is "/media/...". The hash makes URLs unguessable.
 */
final readonly class PublicFilesystemMediaStorage implements MediaStorageInterface
{
    public function __construct(
        private string $publicDir,
    ) {
    }

    /** @return array{0: string, 1: string} */
    public function put(int $organizationId, string $bytes, string $extension): array
    {
        $ext = preg_match('/^[a-z0-9]{1,5}$/', $extension) === 1 ? $extension : 'bin';
        $storageKey = $organizationId . '/' . bin2hex(random_bytes(16)) . '.' . $ext;
        $path = $this->path($storageKey);
        $dir = dirname($path);

        if (!is_dir($dir) && !mkdir($dir, 0o755, true) && !is_dir($dir)) {
            throw new RuntimeException('Could not create media directory.');
        }
        if (file_put_contents($path, $bytes) === false) {
            throw new RuntimeException('Could not write media file.');
        }

        return [$storageKey, '/media/' . $storageKey];
    }

    public function erase(string $storageKey): void
    {
        if (preg_match('#^\d+/[0-9a-f]{32}\.[a-z0-9]{1,5}$#', $storageKey) !== 1) {
            return;
        }
        $path = $this->path($storageKey);
        if (is_file($path)) {
            unlink($path);
        }
    }

    private function path(string $storageKey): string
    {
        if (preg_match('#^\d+/[0-9a-f]{32}\.[a-z0-9]{1,5}$#', $storageKey) !== 1) {
            throw new RuntimeException('Invalid media storage key.');
        }

        return rtrim($this->publicDir, '/') . '/media/' . $storageKey;
    }
}
