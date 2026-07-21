<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\Audit\AuditRecorder;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\ContactFormRepositoryInterface;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\ChannelSenderInterface;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelNotFoundException;
use NeneContact\Notification\TestNotificationChannelUseCase;
use NeneContact\Submission\Submission;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class TestNotificationChannelUseCaseTest extends TestCase
{
    private function forms(): ContactFormRepositoryInterface
    {
        $repo = new class () implements ContactFormRepositoryInterface {
            public function save(ContactForm $form): int
            {
                return 0;
            }

            public function update(ContactForm $form): void
            {
            }

            public function softDelete(int $id): void
            {
            }

            public function findById(int $id): ?ContactForm
            {
                if ($id !== 3) {
                    return null;
                }

                return new ContactForm(
                    organizationId: 7,
                    name: 'Contact us',
                    publicFormKey: 'k',
                    defaultLocale: 'ja',
                    locales: ['ja'],
                    allowedOrigins: [],
                    fields: [new FormField(fieldType: 'text', name: 'name', label: ['ja' => '氏名'], required: false, sortOrder: 0)],
                    status: 'active',
                    id: $id,
                );
            }

            public function publicFormKeyExists(string $publicFormKey): bool
            {
                return false;
            }

            public function findByPublicFormKey(string $publicFormKey): ?ContactForm
            {
                return null;
            }

            /** @return list<ContactForm> */
            public function findAll(int $limit, int $offset): array
            {
                return [];
            }

            public function count(): int
            {
                return 0;
            }
        };

        return $repo;
    }

    private function seededChannels(): InMemoryNotificationChannelRepository
    {
        $repo = new InMemoryNotificationChannelRepository();
        $repo->seed(new NotificationChannel(
            organizationId: 7,
            contactFormId: 3,
            channelType: 'chatwork',
            config: ['api_token' => 'tok', 'room_id' => '123'],
            isEnabled: true,
            id: 1,
        ));

        return $repo;
    }

    public function test_successful_send_reports_ok_and_audits(): void
    {
        $channels = $this->seededChannels();
        $sender = new RecordingChannelSender('chatwork');
        $audit = new RecordingAuditEventRepository();

        $useCase = new TestNotificationChannelUseCase($channels, $this->forms(), [$sender], new AuditRecorder($audit));
        $result = $useCase->execute(5, 1);

        self::assertTrue($result->ok);
        self::assertNull($result->error);
        self::assertSame(1, $sender->sent);

        self::assertCount(1, $audit->events);
        self::assertSame('notification_channel.tested', $audit->events[0]->action);
        self::assertSame('chatwork', $audit->events[0]->after['channel_type'] ?? null);
        self::assertTrue($audit->events[0]->after['ok'] ?? null);
    }

    public function test_dispatch_failure_is_surfaced_not_swallowed(): void
    {
        $channels = $this->seededChannels();
        $failing = new class () implements ChannelSenderInterface {
            public function supports(string $channelType): bool
            {
                return $channelType === 'chatwork';
            }

            public function send(NotificationChannel $channel, ContactForm $form, Submission $submission): void
            {
                throw new RuntimeException('Chatwork dispatch failed with status 404.');
            }
        };
        $audit = new RecordingAuditEventRepository();

        $useCase = new TestNotificationChannelUseCase($channels, $this->forms(), [$failing], new AuditRecorder($audit));
        $result = $useCase->execute(5, 1);

        self::assertFalse($result->ok);
        self::assertSame('Chatwork dispatch failed with status 404.', $result->error);
        self::assertFalse($audit->events[0]->after['ok'] ?? null);
    }

    public function test_missing_channel_throws_not_found(): void
    {
        $useCase = new TestNotificationChannelUseCase(new InMemoryNotificationChannelRepository(), $this->forms(), [], new AuditRecorder(new RecordingAuditEventRepository()));

        $this->expectException(NotificationChannelNotFoundException::class);
        $useCase->execute(5, 99);
    }
}
