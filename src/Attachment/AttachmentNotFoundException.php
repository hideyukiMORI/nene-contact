<?php

declare(strict_types=1);

namespace NeneContact\Attachment;

use RuntimeException;

final class AttachmentNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Attachment {$id} not found.");
    }
}
