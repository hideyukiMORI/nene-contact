<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface ListContactFormsUseCaseInterface
{
    public function execute(int $limit, int $offset): ListContactFormsResult;
}
