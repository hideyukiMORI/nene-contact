<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use Nene2\Http\RequestScopedHolder;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormNotFoundException;
use NeneContact\ContactForm\ContactFormRepositoryInterface;

final readonly class CreateNotificationChannelUseCase implements CreateNotificationChannelUseCaseInterface
{
    /**
     * @param RequestScopedHolder<int> $orgId
     */
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
        private ContactFormRepositoryInterface $forms,
        private AuditRecorderInterface $audit,
        private RequestScopedHolder $orgId,
    ) {
    }

    public function execute(?int $actorUserId, CreateNotificationChannelInput $input): NotificationChannel
    {
        // Form must exist in the resolved organization (org-scoped read).
        if ($this->forms->findById($input->contactFormId) === null) {
            throw new ContactFormNotFoundException($input->contactFormId);
        }

        $organizationId = $this->orgId->get();

        $id = $this->channels->create(new NotificationChannel(
            organizationId: $organizationId,
            contactFormId: $input->contactFormId,
            channelType: $input->channelType,
            config: $input->config,
            isEnabled: $input->isEnabled,
        ));

        // Redacted: config (which may hold secrets) is not copied into the trail.
        $this->audit->record(
            $actorUserId,
            $organizationId,
            'notification_channel.created',
            'notification_channel',
            $id,
            null,
            ['id' => $id, 'contact_form_id' => $input->contactFormId, 'channel_type' => $input->channelType],
        );

        return new NotificationChannel(
            organizationId: $organizationId,
            contactFormId: $input->contactFormId,
            channelType: $input->channelType,
            config: $input->config,
            isEnabled: $input->isEnabled,
            id: $id,
        );
    }
}
