<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface UpdateContactFormUseCaseInterface
{
    public function execute(?int $actorUserId, int $id, CreateContactFormInput $input): ContactForm;
}
