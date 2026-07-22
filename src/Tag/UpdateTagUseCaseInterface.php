<?php

declare(strict_types=1);

namespace NeneContact\Tag;

interface UpdateTagUseCaseInterface
{
    /**
     * @param int|null $actorUserId authenticated operator
     *
     * @throws TagNotFoundException      when no matching non-deleted tag exists in the org
     * @throws TagLabelConflictException when the new label collides with another tag
     */
    public function execute(?int $actorUserId, int $id, UpdateTagInput $input): Tag;
}
