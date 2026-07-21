<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use LogicException;
use Nene2\Validation\ValidationException;
use NeneContact\Audit\AuditRecorderInterface;

final readonly class UpdateNotificationChannelUseCase implements UpdateNotificationChannelUseCaseInterface
{
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id, UpdateNotificationChannelInput $input): NotificationChannel
    {
        // findById is org-scoped and excludes soft-deleted rows (no cross-tenant existence leak).
        $before = $this->channels->findById($id);
        if ($before === null) {
            throw new NotificationChannelNotFoundException($id);
        }

        // Merge the patch over the stored config: provided non-empty values overwrite; omitted or
        // blank keys keep the stored value, so an operator can toggle the channel or fix the
        // room_id without re-entering the secret token (secrets are never returned to echo back).
        // channel_type and contact_form_id are identity and stay fixed.
        $effectiveConfig = $before->config;
        if ($input->config !== null) {
            foreach (ChannelConfigValidator::normalize($before->channelType, $input->config) as $key => $value) {
                if (is_string($value) && $value === '') {
                    continue;
                }
                $effectiveConfig[$key] = $value;
            }
        }

        $errors = ChannelConfigValidator::validate($before->channelType, $effectiveConfig);
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $this->channels->update(new NotificationChannel(
            organizationId: $before->organizationId,
            contactFormId: $before->contactFormId,
            channelType: $before->channelType,
            config: $effectiveConfig,
            isEnabled: $input->isEnabled ?? $before->isEnabled,
            id: $id,
            createdAt: $before->createdAt,
        ));

        $after = $this->channels->findById($id);
        if ($after === null) {
            throw new LogicException('Notification channel disappeared immediately after update.');
        }

        // Redacted: NotificationChannelResponse never carries the config, so no secret lands in
        // the trail (ADR 0013).
        $this->audit->record(
            $actorUserId,
            $before->organizationId,
            'notification_channel.updated',
            'notification_channel',
            $id,
            NotificationChannelResponse::toArray($before),
            NotificationChannelResponse::toArray($after),
        );

        return $after;
    }
}
