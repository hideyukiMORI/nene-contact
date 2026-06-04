<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\ContactForm\ContactFormRepositoryInterface;

final readonly class ListAgentFormsUseCase implements ListAgentFormsUseCaseInterface
{
    public function __construct(
        private ContactFormRepositoryInterface $forms,
    ) {
    }

    /** @return list<\NeneContact\ContactForm\ContactForm> */
    public function execute(int $limit, int $offset): array
    {
        // Forms carry no submitted PII; reads are organization-scoped by the repository.
        return $this->forms->findAll($limit, $offset);
    }
}
