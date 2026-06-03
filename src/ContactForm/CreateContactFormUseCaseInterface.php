<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface CreateContactFormUseCaseInterface
{
    public function execute(?int $actorUserId, CreateContactFormInput $input): ContactForm;
}
