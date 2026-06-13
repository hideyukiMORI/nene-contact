<?php

declare(strict_types=1);

namespace NeneContact\Media;

/** Result of re-encoding an uploaded image: safe bytes + canonical metadata. */
final readonly class ProcessedImage
{
    public function __construct(
        public string $bytes,
        public string $mime,
        public string $extension,
        public int $width,
        public int $height,
    ) {
    }
}
