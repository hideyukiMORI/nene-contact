<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

interface ListServiceTokensUseCaseInterface
{
    public function execute(int $limit, int $offset): ListServiceTokensResult;
}
