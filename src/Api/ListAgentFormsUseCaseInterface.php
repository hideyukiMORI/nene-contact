<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\ContactForm\ContactForm;

interface ListAgentFormsUseCaseInterface
{
    /** @return list<ContactForm> */
    public function execute(int $limit, int $offset): array;
}
