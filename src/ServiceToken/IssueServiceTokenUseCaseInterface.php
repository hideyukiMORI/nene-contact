<?php

declare(strict_types=1);

namespace NeneContact\ServiceToken;

interface IssueServiceTokenUseCaseInterface
{
    /**
     * @param int|null $actorUserId authenticated operator (null for a server-side issuer)
     */
    public function execute(?int $actorUserId, IssueServiceTokenInput $input): IssueServiceTokenResult;
}
