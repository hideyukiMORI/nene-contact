<?php

declare(strict_types=1);

namespace NeneContact\Media;

/**
 * An operator-uploaded media asset (e.g. a HERO image). Bytes live on the public filesystem;
 * this carries only metadata. Org-owned brand asset — not visitor PII.
 */
final readonly class MediaAsset
{
    public function __construct(
        public int $organizationId,
        public string $storageKey,
        public string $publicPath,
        public string $mime,
        public int $byteSize,
        public ?int $width = null,
        public ?int $height = null,
        public ?string $originalName = null,
        public ?int $createdBy = null,
        public ?int $id = null,
        public ?string $createdAt = null,
        public ?string $updatedAt = null,
    ) {
    }
}
