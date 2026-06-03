<?php

declare(strict_types=1);

namespace NeneContact\Organization;

interface GetOrganizationByIdUseCaseInterface
{
    public function execute(GetOrganizationByIdInput $input): GetOrganizationByIdOutput;
}
