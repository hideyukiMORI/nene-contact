<?php

declare(strict_types=1);

namespace NeneContact\Tag;

interface ListTagsUseCaseInterface
{
    public function execute(int $limit, int $offset): ListTagsResult;
}
