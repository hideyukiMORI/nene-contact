<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

/**
 * Attachment metadata for API responses. Never includes the storage key or bytes.
 */
final readonly class AttachmentResponse
{
    /** @return array<string, mixed> */
    public static function toArray(Attachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'field_name' => $attachment->fieldName,
            'original_filename' => $attachment->originalFilename,
            'content_type' => $attachment->contentType,
            'size_bytes' => $attachment->sizeBytes,
            'scan_status' => $attachment->scanStatus,
            'created_at' => $attachment->createdAt,
        ];
    }
}
