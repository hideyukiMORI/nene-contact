<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

final readonly class Attachment
{
    public function __construct(
        public int $organizationId,
        public int $contactFormId,
        public string $fieldName,
        public string $originalFilename,
        public string $contentType,
        public int $sizeBytes,
        public ?string $storageKey = null,
        public ?int $submissionId = null,
        public string $scanStatus = 'skipped',
        public ?int $id = null,
        public ?string $createdAt = null,
    ) {
    }
}
