<?php

declare(strict_types=1);

namespace NeneContact\Organization;

interface UpdateOrganizationUseCaseInterface
{
    /**
     * Updates the caller's own organization settings (the caller's org is taken from their token's
     * org_id claim — this settings surface is always self-scoped, never another tenant).
     *
     * @param ?int $callerOrgId the authenticated caller's organization id (token org_id claim).
     * @throws OrganizationNotFoundException when the caller has no organization scope.
     */
    public function execute(?int $actorUserId, ?int $callerOrgId, UpdateOrganizationInput $input): Organization;
}
