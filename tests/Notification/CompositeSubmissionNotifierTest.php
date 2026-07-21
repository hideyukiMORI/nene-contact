<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\ChannelSenderInterface;
use NeneContact\Notification\CompositeSubmissionNotifier;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelRepositoryInterface;
use NeneContact\Submission\Submission;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class CompositeSubmissionNotifierTest extends TestCase
{
    /** @param list<NotificationChannel> $enabled */
    private function channels(array $enabled): NotificationChannelRepositoryInterface
    {
        return new class ($enabled) implements NotificationChannelRepositoryInterface {
            /** @param list<NotificationChannel> $enabled */
            public function __construct(private array $enabled)
            {
            }

            public function create(NotificationChannel $channel): int
            {
                return 1;
            }

            public function findById(int $id): ?NotificationChannel
            {
                return $this->enabled[0] ?? null;
            }

            public function update(NotificationChannel $channel): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            /** @return list<NotificationChannel> */
            public function listByContactForm(int $contactFormId): array
            {
                return $this->enabled;
            }

            /** @return list<NotificationChannel> */
            public function findEnabledByContactForm(int $contactFormId, int $organizationId): array
            {
                return $this->enabled;
            }
        };
    }

    private function form(): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact us',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 0)],
            status: 'active',
            id: 3,
        );
    }

    public function test_routes_each_channel_to_its_supporting_sender(): void
    {
        $emailSender = new RecordingChannelSender('email');
        $slackSender = new RecordingChannelSender('slack');

        $notifier = new CompositeSubmissionNotifier(
            $this->channels([
                new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'email', config: ['recipient' => 'a@x'], isEnabled: true, id: 1),
                new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'slack', config: ['webhook_url' => 'https://h/x'], isEnabled: true, id: 2),
            ]),
            [$emailSender, $slackSender],
        );

        $notifier->notify($this->form(), new Submission(organizationId: 7, contactFormId: 3, fieldValues: ['email' => 'v@x'], status: 'open', id: 9));

        self::assertSame(1, $emailSender->sent);
        self::assertSame(1, $slackSender->sent);
    }

    public function test_isolates_a_failing_channel(): void
    {
        $failing = new class () implements ChannelSenderInterface {
            public function supports(string $channelType): bool
            {
                return $channelType === 'slack';
            }

            public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
            {
                throw new RuntimeException('boom');
            }
        };
        $email = new RecordingChannelSender('email');

        $notifier = new CompositeSubmissionNotifier(
            $this->channels([
                new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'slack', config: [], isEnabled: true, id: 1),
                new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'email', config: ['recipient' => 'a@x'], isEnabled: true, id: 2),
            ]),
            [$failing, $email],
        );

        // Must not throw; the email channel still dispatches despite slack failing.
        $notifier->notify($this->form(), new Submission(organizationId: 7, contactFormId: 3, fieldValues: ['email' => 'v@x'], status: 'open', id: 9));

        self::assertSame(1, $email->sent);
    }
}
