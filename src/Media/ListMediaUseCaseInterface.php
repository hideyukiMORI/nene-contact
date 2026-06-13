<?php

declare(strict_types=1);

namespace NeneContact\Media;

interface ListMediaUseCaseInterface
{
    /** @return list<MediaAsset> live assets for the resolved organization */
    public function execute(): array;
}
