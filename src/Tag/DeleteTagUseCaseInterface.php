<?php

declare(strict_types=1);

namespace NeneContact\Tag;

interface DeleteTagUseCaseInterface
{
    /**
     * @param int|null $actorUserId authenticated operator
     *
     * @throws TagNotFoundException when no matching tag exists in the org
     */
    public function execute(?int $actorUserId, int $id): void;
}
