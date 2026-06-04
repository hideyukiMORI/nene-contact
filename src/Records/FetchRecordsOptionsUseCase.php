<?php

declare(strict_types=1);

namespace NeneContact\Records;

use NeneContact\Upstream\RecordsClientInterface;

final readonly class FetchRecordsOptionsUseCase implements FetchRecordsOptionsUseCaseInterface
{
    public function __construct(
        private RecordsClientInterface $records,
    ) {
    }

    /** @return list<array{value: string, label: string}> */
    public function execute(string $source): array
    {
        // Read-only catalog lookup; Records remains the SSOT for the option list (ADR 0002).
        return $this->records->fetchOptions($source);
    }
}
