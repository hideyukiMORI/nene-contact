<?php

declare(strict_types=1);

namespace NeneContact\Media;

interface UploadMediaUseCaseInterface
{
    /**
     * Re-encodes the raw upload, stores it publicly, persists metadata and audits the upload.
     *
     * @throws \Nene2\Validation\ValidationException when the bytes are not a supported image
     */
    public function execute(?int $actorUserId, string $rawBytes, ?string $originalName): MediaAsset;
}
