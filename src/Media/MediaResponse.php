<?php

declare(strict_types=1);

namespace NeneContact\Media;

/**
 * Media metadata for API responses + sanitized audit snapshots (no bytes, no storage key —
 * the storage key is internal; the public_path is the servable URL).
 */
final readonly class MediaResponse
{
    /** @return array<string, mixed> */
    public static function toArray(MediaAsset $asset): array
    {
        return [
            'id' => $asset->id,
            'url' => $asset->publicPath,
            'mime' => $asset->mime,
            'width' => $asset->width,
            'height' => $asset->height,
            'byte_size' => $asset->byteSize,
            'original_name' => $asset->originalName,
            'created_at' => $asset->createdAt,
        ];
    }
}
