<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

final readonly class ListContactFormsResult
{
    /** @param list<ContactForm> $items */
    public function __construct(
        public array $items,
        public int $total,
        public int $limit,
        public int $offset,
    ) {
    }
}
