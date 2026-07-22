<?php

declare(strict_types=1);

namespace NeneContact\Tag;

/**
 * Lists the org's non-deleted tags (read-only, ADR 0019). Ordering (sort_order then label) is
 * the repository's; org scoping comes from the request-scoped holder inside it.
 */
final readonly class ListTagsUseCase implements ListTagsUseCaseInterface
{
    public function __construct(
        private TagRepositoryInterface $repository,
    ) {
    }

    public function execute(int $limit, int $offset): ListTagsResult
    {
        return new ListTagsResult(
            items: $this->repository->findAll($limit, $offset),
            total: $this->repository->count(),
        );
    }
}
