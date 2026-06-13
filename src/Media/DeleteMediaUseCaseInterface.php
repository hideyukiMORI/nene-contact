<?php

declare(strict_types=1);

namespace NeneContact\Media;

interface DeleteMediaUseCaseInterface
{
    /** @throws MediaNotFoundException when the asset is missing or cross-tenant */
    public function execute(?int $actorUserId, int $id): void;
}
