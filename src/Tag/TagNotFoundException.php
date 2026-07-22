<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use RuntimeException;

final class TagNotFoundException extends RuntimeException
{
    public function __construct(int $id)
    {
        parent::__construct("Tag {$id} not found.");
    }
}
