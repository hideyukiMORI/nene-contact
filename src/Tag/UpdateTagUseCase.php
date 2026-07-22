<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use Nene2\Http\ClockInterface;
use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Edits a tag (PATCH semantics: null fields keep the stored value), org-scoped (ADR 0019).
 * Unknown/foreign/deleted id → {@see TagNotFoundException} (404); a rename that collides with
 * another non-deleted label → {@see TagLabelConflictException} (409). Persists then audits
 * `tag.updated` with before/after (ADR 0013).
 */
final readonly class UpdateTagUseCase implements UpdateTagUseCaseInterface
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

    public function execute(?int $actorUserId, int $id, UpdateTagInput $input): Tag
    {
        $organizationId = $this->orgId->get();

        $current = $this->repository->findById($id);
        if ($current === null) {
            throw new TagNotFoundException($id);
        }

        $label = $input->label ?? $current->label;
        $color = $input->color ?? $current->color;
        $sortOrder = $input->sortOrder ?? $current->sortOrder;

        if ($label !== $current->label && $this->repository->labelExists($label, $id)) {
            throw new TagLabelConflictException($label);
        }

        $now = $this->clock->now()->format('Y-m-d H:i:s');
        $this->repository->update($id, $label, $color, $sortOrder, $now);

        $this->audit->record(
            $actorUserId,
            $organizationId,
            'tag.updated',
            'tag',
            $id,
            ['label' => $current->label, 'color' => $current->color, 'sort_order' => $current->sortOrder],
            ['label' => $label, 'color' => $color, 'sort_order' => $sortOrder],
        );

        return new Tag(
            id: $id,
            organizationId: $organizationId,
            label: $label,
            color: $color,
            sortOrder: $sortOrder,
            createdAt: $current->createdAt,
            updatedAt: $now,
            deletedAt: null,
        );
    }
}
