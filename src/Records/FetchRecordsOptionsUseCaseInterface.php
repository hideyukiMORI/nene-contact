<?php

declare(strict_types=1);

namespace NeneContact\Records;

interface FetchRecordsOptionsUseCaseInterface
{
    /**
     * Fetches select options for a Records entity (read-only).
     *
     * @return list<array{value: string, label: string}>
     *
     * @throws \NeneContact\Upstream\UpstreamRequestException when Records is unavailable
     */
    public function execute(string $source): array;
}
