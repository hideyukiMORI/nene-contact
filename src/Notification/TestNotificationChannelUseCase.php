<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\Submission\Submission;
use Throwable;

/**
 * Sends a sample notification through a channel's real sender so the operator can confirm the
 * channel works — or discover that it silently fails. Unlike the submit path
 * ({@see CompositeSubmissionNotifier}), a sender failure here is surfaced to the caller instead
 * of being swallowed. The outcome is audited (notification_channel.tested) either way.
 */
final readonly class TestNotificationChannelUseCase implements TestNotificationChannelUseCaseInterface
{
    /**
     * @param list<ChannelSenderInterface> $senders
     */
    public function __construct(
        private NotificationChannelRepositoryInterface $channels,
        private ContactFormRepositoryInterface $forms,
        private array $senders,
        private AuditRecorderInterface $audit,
    ) {
    }

    public function execute(?int $actorUserId, int $id): TestNotificationChannelResult
    {
        // Org-scoped, excludes soft-deleted (no cross-tenant existence leak).
        $channel = $this->channels->findById($id);
        if ($channel === null) {
            throw new NotificationChannelNotFoundException($id);
        }

        $form = $this->forms->findById($channel->contactFormId);
        if ($form === null) {
            // The owning form was removed; nothing to test against.
            throw new NotificationChannelNotFoundException($id);
        }

        $sample = new Submission(
            organizationId: $channel->organizationId,
            contactFormId: $channel->contactFormId,
            fieldValues: ['test' => 'This is a test notification from NeNe Contact. / NeNe Contact のテスト送信です。'],
            id: 0,
        );

        $result = new TestNotificationChannelResult(true);
        foreach ($this->senders as $sender) {
            if (!$sender->supports($channel->channelType)) {
                continue;
            }

            try {
                $sender->send($channel, $form, $sample);
            } catch (Throwable $e) {
                // Surfaced (not swallowed): the operator needs to see why the channel failed.
                // Sender messages carry only a status/reason — never the config secret.
                $result = new TestNotificationChannelResult(false, $e->getMessage());
            }

            break;
        }

        // Redacted: channel_type + outcome only, no config/secret (ADR 0013).
        $this->audit->record(
            $actorUserId,
            $channel->organizationId,
            'notification_channel.tested',
            'notification_channel',
            $id,
            null,
            ['channel_type' => $channel->channelType, 'ok' => $result->ok, 'error' => $result->error],
        );

        return $result;
    }
}
