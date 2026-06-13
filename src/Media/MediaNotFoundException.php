<?php

declare(strict_types=1);

namespace NeneContact\Media;

use RuntimeException;

final class MediaNotFoundException extends RuntimeException
{
    public function __construct(public readonly int $mediaId)
    {
        parent::__construct("Media asset {$mediaId} was not found.");
    }
}
