<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\ClockInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Creates a tag in the caller's organization (ADR 0019). Rejects a duplicate label
 * (case-sensitive, among non-deleted rows) with {@see TagLabelConflictException} → 409. Persists
 * then audits `tag.created` (ADR 0013, Contact's persist-then-audit model).
 */
final readonly class CreateTagUseCase implements CreateTagUseCaseInterface
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

    public function execute(?int $actorUserId, CreateTagInput $input): Tag
    {
        $organizationId = $this->orgId->get();

        if ($this->repository->labelExists($input->label)) {
            throw new TagLabelConflictException($input->label);
        }

        $now = $this->clock->now()->format('Y-m-d H:i:s');

        $id = $this->repository->save(new Tag(
            id: null,
            organizationId: $organizationId,
            label: $input->label,
            color: $input->color,
            sortOrder: 0,
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null,
        ));

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'tag.created',
            'tag',
            $id,
            null,
            ['label' => $input->label, 'color' => $input->color],
        );

        return new Tag(
            id: $id,
            organizationId: $organizationId,
            label: $input->label,
            color: $input->color,
            sortOrder: 0,
            createdAt: $now,
            updatedAt: $now,
            deletedAt: null,
        );
    }
}
