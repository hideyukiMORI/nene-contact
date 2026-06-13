<?php

declare(strict_types=1);

namespace NeneContact\Media;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class DeleteMediaUseCase implements DeleteMediaUseCaseInterface
{
    /** @param RequestScopedHolder<int> $orgId */
    public function __construct(
        private MediaAssetRepositoryInterface $assets,
        private MediaStorageInterface $storage,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, int $id): void
    {
        $organizationId = $this->orgId->get();
        $before = $this->assets->findById($id);

        // Cross-tenant targets are treated as not found (no existence leak).
        if ($before === null || $before->organizationId !== $organizationId) {
            throw new MediaNotFoundException($id);
        }

        // Soft-delete the metadata row (ADR 0016 — audit linkage survives), then erase the public
        // file so a deleted brand image stops being served. Media is not visitor PII.
        $this->assets->softDelete($id);
        $this->storage->erase($before->storageKey);

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'media.deleted',
            'media',
            $id,
            MediaResponse::toArray($before),
            null,
        );
    }
}
