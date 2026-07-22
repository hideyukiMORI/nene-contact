<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\ClockInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Soft-deletes a tag (ADR 0016 — never a physical DELETE), org-scoped (ADR 0019). Retiring a tag
 * removes it from pickers/filters while its past assignments and audit trail survive. The delete
 * runs first (throwing {@see TagNotFoundException} for an unknown/foreign id, so no audit for a
 * non-event); idempotent for an already-deleted tag. Persists then audits `tag.deleted`.
 */
final readonly class DeleteTagUseCase implements DeleteTagUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId resolved organization for this request
     */
    public function __construct(
        private TagRepositoryInterface $repository,
        private AuditRecorderInterface $audit,
        private ClockInterface $clock,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, int $id): void
    {
        $organizationId = $this->orgId->get();
        $deletedAt = $this->clock->now()->format('Y-m-d H:i:s');

        $this->repository->softDelete($id, $deletedAt);

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'tag.deleted',
            'tag',
            $id,
            null,
            ['deleted_at' => $deletedAt],
        );
    }
}
