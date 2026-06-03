<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface GetContactFormByIdUseCaseInterface
{
    public function execute(int $id): ContactForm;
}
