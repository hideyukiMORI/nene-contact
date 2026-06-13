<?php

declare(strict_types=1);

namespace NeneContact\Tests\Media;

use NeneContact\Media\MediaStorageInterface;

final class FakeMediaStorage implements MediaStorageInterface
{
    /** @var list<array{org: int, bytes: int, ext: string}> */
    public array $puts = [];
    /** @var list<string> */
    public array $erased = [];

    /** @return array{0: string, 1: string} */
    public function put(int $organizationId, string $bytes, string $extension): array
    {
        $this->puts[] = ['org' => $organizationId, 'bytes' => strlen($bytes), 'ext' => $extension];
        $key = $organizationId . '/' . str_repeat('a', 32) . '.' . $extension;

        return [$key, '/media/' . $key];
    }

    public function erase(string $storageKey): void
    {
        $this->erased[] = $storageKey;
    }
}
