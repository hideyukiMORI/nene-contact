<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use Nene2\Middleware\RateLimitStorageInterface;
use NeneContact\Audit\AuditRecorderInterface;
use NeneContact\ContactForm\AutoReply;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\SenderAutoReply;
use NeneContact\Submission\Submission;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\RawMessage;

final class SenderAutoReplyTest extends TestCase
{
    public function test_sends_one_reply_and_audits_when_enabled(): void
    {
        $mailer = new RecordingMailer();
        $audit = new RecordingAudit();
        $service = new SenderAutoReply($mailer, 'noreply@ayane.co.jp', new CountingCooldown(), $audit);

        $service->send($this->form(), $this->submission(['email' => 'visitor@example.com'], 'ja'));

        self::assertCount(1, $mailer->sent);
        $email = $mailer->sent[0];
        self::assertSame('visitor@example.com', $email->getTo()[0]->getAddress());
        self::assertSame('noreply@ayane.co.jp', $email->getFrom()[0]->getAddress());
        self::assertSame('お問い合わせありがとうございます', $email->getSubject());
        self::assertSame("下記の資料をご覧ください。\nhttps://ayane.co.jp/docs", $email->getTextBody());

        self::assertCount(1, $audit->events);
        self::assertSame('autoreply.sent', $audit->events[0]['action']);
        self::assertSame('autoreply', $audit->events[0]['entityType']);
        // Recipient is masked in the trail — no raw PII.
        self::assertStringNotContainsString('visitor@example.com', json_encode($audit->events[0]['after'], JSON_THROW_ON_ERROR));
    }

    public function test_does_not_echo_submission_values_into_the_body(): void
    {
        $mailer = new RecordingMailer();
        $service = new SenderAutoReply($mailer, 'noreply@ayane.co.jp', new CountingCooldown(), new RecordingAudit());

        $service->send(
            $this->form(),
            $this->submission(['email' => 'visitor@example.com', 'message' => '<script>evil()</script>NASTY'], 'ja'),
        );

        // Fixed template: the body is exactly the operator copy, never the submitted message.
        self::assertStringNotContainsString('NASTY', (string) $mailer->sent[0]->getTextBody());
        self::assertStringNotContainsString('visitor@example.com', (string) $mailer->sent[0]->getTextBody());
    }

    public function test_disabled_form_sends_nothing(): void
    {
        $mailer = new RecordingMailer();
        $audit = new RecordingAudit();
        $service = new SenderAutoReply($mailer, 'noreply@ayane.co.jp', new CountingCooldown(), $audit);

        $service->send($this->form(enabled: false), $this->submission(['email' => 'visitor@example.com'], 'ja'));

        self::assertCount(0, $mailer->sent);
        self::assertCount(0, $audit->events);
    }

    public function test_no_email_field_value_sends_nothing(): void
    {
        $mailer = new RecordingMailer();
        $service = new SenderAutoReply($mailer, 'noreply@ayane.co.jp', new CountingCooldown(), new RecordingAudit());

        $service->send($this->form(), $this->submission(['email' => 'not-an-email'], 'ja'));

        self::assertCount(0, $mailer->sent);
    }

    public function test_cooldown_suppresses_a_repeat_to_the_same_recipient(): void
    {
        $mailer = new RecordingMailer();
        $audit = new RecordingAudit();
        $cooldown = new CountingCooldown();
        $service = new SenderAutoReply($mailer, 'noreply@ayane.co.jp', $cooldown, $audit);

        $service->send($this->form(), $this->submission(['email' => 'visitor@example.com'], 'ja'));
        $service->send($this->form(), $this->submission(['email' => 'VISITOR@example.com'], 'ja'));

        // Only the first is delivered; the second (same address, case-insensitive) is suppressed.
        self::assertCount(1, $mailer->sent);
        self::assertSame('autoreply.sent', $audit->events[0]['action']);
        self::assertSame('autoreply.suppressed', $audit->events[1]['action']);
    }

    public function test_delivery_failure_is_best_effort_and_audited(): void
    {
        $audit = new RecordingAudit();
        $service = new SenderAutoReply(new ThrowingMailer(), 'noreply@ayane.co.jp', new CountingCooldown(), $audit);

        // Must not throw.
        $service->send($this->form(), $this->submission(['email' => 'visitor@example.com'], 'ja'));

        self::assertCount(1, $audit->events);
        self::assertSame('autoreply.failed', $audit->events[0]['action']);
    }

    public function test_uses_submission_locale_then_falls_back_to_default(): void
    {
        $mailer = new RecordingMailer();
        $service = new SenderAutoReply($mailer, 'noreply@ayane.co.jp', new CountingCooldown(), new RecordingAudit());

        // en submission → en copy.
        $service->send($this->form(), $this->submission(['email' => 'a@example.com'], 'en'));
        self::assertSame('Thank you for your inquiry', $mailer->sent[0]->getSubject());

        // null locale → default locale (ja).
        $service->send($this->form(), $this->submission(['email' => 'b@example.com'], null));
        self::assertSame('お問い合わせありがとうございます', $mailer->sent[1]->getSubject());
    }

    // ---- fixtures ----

    private function form(bool $enabled = true): ContactForm
    {
        return new ContactForm(
            organizationId: 7,
            name: 'Contact',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja', 'en'],
            allowedOrigins: [],
            fields: [
                new FormField(fieldType: 'text', name: 'name', label: ['ja' => 'お名前'], required: true, sortOrder: 0),
                new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: true, sortOrder: 1),
                new FormField(fieldType: 'textarea', name: 'message', label: ['ja' => 'ご相談内容'], required: true, sortOrder: 2),
            ],
            status: 'active',
            autoReply: AutoReply::fromStored([
                'enabled' => $enabled,
                'subject' => ['ja' => 'お問い合わせありがとうございます', 'en' => 'Thank you for your inquiry'],
                'body' => ['ja' => "下記の資料をご覧ください。\nhttps://ayane.co.jp/docs", 'en' => 'See our docs'],
            ]),
            id: 3,
        );
    }

    /** @param array<string, mixed> $values */
    private function submission(array $values, ?string $locale): Submission
    {
        return new Submission(
            organizationId: 7,
            contactFormId: 3,
            fieldValues: $values,
            locale: $locale,
            id: 42,
        );
    }
}

/** Captures every Email the service sends. */
final class RecordingMailer implements MailerInterface
{
    /** @var list<Email> */
    public array $sent = [];

    public function send(RawMessage $message, ?Envelope $envelope = null): void
    {
        if ($message instanceof Email) {
            $this->sent[] = $message;
        }
    }
}

/** A mailer whose delivery always fails, to exercise the best-effort path. */
final class ThrowingMailer implements MailerInterface
{
    public function send(RawMessage $message, ?Envelope $envelope = null): void
    {
        throw new RuntimeException('smtp down');
    }
}

/** Captures the audit calls the service makes. */
final class RecordingAudit implements AuditRecorderInterface
{
    /** @var list<array{action: string, entityType: string, after: array<string, mixed>|null}> */
    public array $events = [];

    public function record(?int $actorUserId, ?int $organizationId, string $action, string $entityType, ?int $entityId, ?array $before, ?array $after): void
    {
        $this->events[] = ['action' => $action, 'entityType' => $entityType, 'after' => $after];
    }
}

/** A per-key fixed-window counter — count 1 on first hit, incrementing thereafter. */
final class CountingCooldown implements RateLimitStorageInterface
{
    /** @var array<string, int> */
    private array $hits = [];

    public function hit(string $key, int $windowSeconds): array
    {
        $this->hits[$key] = ($this->hits[$key] ?? 0) + 1;

        return ['count' => $this->hits[$key], 'reset_at' => 0];
    }
}
