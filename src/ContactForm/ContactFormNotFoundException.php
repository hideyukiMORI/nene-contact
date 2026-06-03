<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use RuntimeException;

final class ContactFormNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Contact form {$id} not found.");
    }
}
