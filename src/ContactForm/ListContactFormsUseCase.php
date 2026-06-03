<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class ListContactFormsUseCase implements ListContactFormsUseCaseInterface
{
    public function __construct(
        private ContactFormRepositoryInterface $forms,
    ) {
    }

    public function execute(int $limit, int $offset): ListContactFormsResult
    {
        return new ListContactFormsResult(
            items: $this->forms->findAll($limit, $offset),
            total: $this->forms->count(),
            limit: $limit,
            offset: $offset,
        );
    }
}
