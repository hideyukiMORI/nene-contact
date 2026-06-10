<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

interface DeleteContactFormUseCaseInterface
{
    public function execute(?int $actorUserId, int $id): void;
}
