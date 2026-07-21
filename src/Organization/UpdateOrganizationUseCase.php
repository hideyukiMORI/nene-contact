<?php

declare(strict_types=1);

namespace NeneContact\Organization;

use LogicException;
use NeneContact\Audit\AuditRecorderInterface;

/**
 * Updates the caller's own organization settings (email-wording wave a: sender_display_name).
 * Served from the self-scoped /admin/settings/organization surface — the caller's org comes from
 * their token (org_id claim), never a path id, so it can only ever edit their own tenant. This is
 * a "settings" concern (ManageSettings), distinct from superadmin org management
 * (/admin/organizations). Identity (slug, plan, is_active, external id, custom domain) is preserved.
 */
final readonly class UpdateOrganizationUseCase implements UpdateOrganizationUseCaseInterface
{
    public function __construct(
        private OrganizationRepositoryInterface $organizations,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, ?int $callerOrgId, UpdateOrganizationInput $input): Organization
    {
        if ($callerOrgId === null) {
            throw new OrganizationNotFoundException(0);
        }

        $before = $this->organizations->findById($callerOrgId);
        if ($before === null) {
            throw new OrganizationNotFoundException($callerOrgId);
        }

        $this->organizations->update(new Organization(
            name: $before->name,
            slug: $before->slug,
            plan: $before->plan,
            isActive: $before->isActive,
            id: $before->id,
            externalId: $before->externalId,
            customDomain: $before->customDomain,
            senderDisplayName: $input->senderDisplayName,
            emailSignature: $input->emailSignature,
            createdAt: $before->createdAt,
        ));

        $after = $this->organizations->findById($callerOrgId);
        if ($after === null) {
            throw new LogicException('Organization disappeared immediately after update.');
        }

        // Organizations hold no secrets; the trail carries the org name (context) + the changed
        // setting (ADR 0013).
        $this->audit->record(
            $actorUserId,
            $callerOrgId,
            'organization.updated',
            'organization',
            $callerOrgId,
            [
                'name' => $before->name,
                'sender_display_name' => $before->senderDisplayName,
                'email_signature' => $before->emailSignature,
            ],
            [
                'name' => $after->name,
                'sender_display_name' => $after->senderDisplayName,
                'email_signature' => $after->emailSignature,
            ],
        );

        return $after;
    }
}
