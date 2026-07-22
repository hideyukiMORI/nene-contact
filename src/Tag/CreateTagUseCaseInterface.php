<?php

declare(strict_types=1);

namespace NeneContact\Tag;

interface CreateTagUseCaseInterface
{
    /**
     * @param int|null $actorUserId authenticated operator
     *
     * @throws TagLabelConflictException when a non-deleted tag with the same label exists
     */
    public function execute(?int $actorUserId, CreateTagInput $input): Tag;
}
