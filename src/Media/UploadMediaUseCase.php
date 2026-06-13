<?php

declare(strict_types=1);

namespace NeneContact\Media;

use LogicException;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class UploadMediaUseCase implements UploadMediaUseCaseInterface
{
    /** @param RequestScopedHolder<int> $orgId */
    public function __construct(
        private MediaImageProcessor $processor,
        private MediaStorageInterface $storage,
        private MediaAssetRepositoryInterface $assets,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, string $rawBytes, ?string $originalName): MediaAsset
    {
        $organizationId = $this->orgId->get();

        // Re-encode through GD (strips EXIF/metadata, downscales). Throws on a non-image.
        $image = $this->processor->process($rawBytes);

        [$storageKey, $publicPath] = $this->storage->put($organizationId, $image->bytes, $image->extension);

        $name = $originalName !== null && trim($originalName) !== '' ? mb_substr($originalName, 0, 255) : null;
        $id = $this->assets->save(new MediaAsset(
            organizationId: $organizationId,
            storageKey: $storageKey,
            publicPath: $publicPath,
            mime: $image->mime,
            byteSize: strlen($image->bytes),
            width: $image->width,
            height: $image->height,
            originalName: $name,
            createdBy: $actorUserId,
        ));

        $asset = $this->assets->findById($id);
        if ($asset === null) {
            throw new LogicException('Media asset disappeared immediately after upload.');
        }

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'media.uploaded',
            'media',
            $id,
            null,
            MediaResponse::toArray($asset),
        );

        return $asset;
    }
}
