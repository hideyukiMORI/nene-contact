<?php

declare(strict_types=1);

namespace NeneContact\Tests\Attachment;

use NeneContact\Attachment\AttachmentStorageInterface;

final class InMemoryAttachmentStorage implements AttachmentStorageInterface
{
    /** @var array<string, string> */
    public array $stored = [];

    public function put(int $organizationId, string $bytes): string
    {
        $key = $organizationId . '/' . bin2hex(random_bytes(16));
        $this->stored[$key] = $bytes;

        return $key;
    }

    public function get(string $storageKey): ?string
    {
        return $this->stored[$storageKey] ?? null;
    }

    public function erase(string $storageKey): void
    {
        unset($this->stored[$storageKey]);
    }
}
