<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\EmailSubmissionNotifier;
use NeneContact\Notification\NotificationChannel;
use NeneContact\Notification\NotificationChannelRepositoryInterface;
use NeneContact\Submission\Submission;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;

final class EmailSubmissionNotifierTest extends TestCase
{
    public function test_sends_one_email_per_enabled_email_channel(): void
    {
        $channels = new class () implements NotificationChannelRepositoryInterface {
            public function create(NotificationChannel $channel): int
            {
                return 1;
            }

            /** @return list<NotificationChannel> */
            public function listByContactForm(int $contactFormId): array
            {
                return [];
            }

            /** @return list<NotificationChannel> */
            public function findEnabledByContactForm(int $contactFormId, int $organizationId): array
            {
                return [
                    new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'email', config: ['recipient' => 'ops@example.com'], isEnabled: true, id: 1),
                    new NotificationChannel(organizationId: 7, contactFormId: 3, channelType: 'slack', config: ['webhook' => 'https://hooks/x'], isEnabled: true, id: 2),
                ];
            }
        };

        $mailer = new class () implements MailerInterface {
            /** @var list<RawMessage> */
            public array $sent = [];

            public function send(RawMessage $message, ?Envelope $envelope = null): void
            {
                $this->sent[] = $message;
            }
        };

        $form = new ContactForm(
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
        $submission = new Submission(organizationId: 7, contactFormId: 3, fieldValues: ['email' => 'visitor@example.com'], status: 'open', id: 11);

        (new EmailSubmissionNotifier($channels, $mailer, 'noreply@nene-contact.local'))->notify($form, $submission);

        // Only the email channel is dispatched (slack is stored but not yet sent).
        self::assertCount(1, $mailer->sent);
        $email = $mailer->sent[0];
        self::assertInstanceOf(Email::class, $email);
        self::assertSame('ops@example.com', $email->getTo()[0]->getAddress());
        self::assertStringContainsString('visitor@example.com', (string) $email->getTextBody());
    }
}
