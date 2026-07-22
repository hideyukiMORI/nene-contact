<?php

declare(strict_types=1);

namespace NeneContact\Tag;

use RuntimeException;

final class TagLabelConflictException extends RuntimeException
{
    public function __construct(public readonly string $label)
    {
        parent::__construct("A tag labelled '{$label}' already exists in this organization.");
    }
}
