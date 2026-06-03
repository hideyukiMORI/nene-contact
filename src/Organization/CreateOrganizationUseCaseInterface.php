<?php

declare(strict_types=1);

namespace NeneContact\Organization;

interface CreateOrganizationUseCaseInterface
{
    public function execute(CreateOrganizationInput $input): CreateOrganizationOutput;
}
