<?php

declare(strict_types=1);

namespace NeneContact\Tests\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;
use NeneContact\Notification\AdminNotificationTemplate;
use NeneContact\Submission\Submission;
use PHPUnit\Framework\TestCase;

final class AdminNotificationTemplateTest extends TestCase
{
    /**
     * @param array<string, mixed> $values
     * @return array{0: ContactForm, 1: Submission}
     */
    private function context(array $values, ?string $subject = null, ?string $body = null): array
    {
        $form = new ContactForm(
            organizationId: 7,
            name: 'AYANE お問い合わせ',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [
                new FormField(fieldType: 'text', name: 'name', label: ['ja' => '氏名'], required: false, sortOrder: 0),
                new FormField(fieldType: 'email', name: 'email', label: ['ja' => 'メール'], required: false, sortOrder: 1),
                new FormField(fieldType: 'textarea', name: 'message', label: ['ja' => '本文'], required: false, sortOrder: 2),
            ],
            status: 'active',
            adminNotificationSubject: $subject,
            adminNotificationBody: $body,
            id: 3,
        );

        $submission = new Submission(
            organizationId: 7,
            contactFormId: 3,
            fieldValues: $values,
            id: 9,
            submittedAt: '2026-07-21 10:00:00',
        );

        return [$form, $submission];
    }

    public function test_default_subject_is_japanese_with_form_name(): void
    {
        [$form, $submission] = $this->context(['name' => '山田']);

        self::assertSame('新しいお問い合わせ: AYANE お問い合わせ', AdminNotificationTemplate::subject($form, $submission));
    }

    public function test_interpolates_variables(): void
    {
        [$form, $submission] = $this->context(
            ['name' => '山田太郎', 'email' => 'yamada@example.com', 'message' => 'こんにちは'],
            '{name} 様より ({email})',
            '{form_name} / {submitted_at} / {name}',
        );

        self::assertSame('山田太郎 様より (yamada@example.com)', AdminNotificationTemplate::subject($form, $submission));
        self::assertSame('AYANE お問い合わせ / 2026-07-21 10:00:00 / 山田太郎', AdminNotificationTemplate::body($form, $submission));
    }

    public function test_name_falls_back_to_first_text_field_when_no_name_field(): void
    {
        // A form whose first text field is not literally "name" (case A fallback).
        $form = new ContactForm(
            organizationId: 7,
            name: 'F',
            publicFormKey: 'k',
            defaultLocale: 'ja',
            locales: ['ja'],
            allowedOrigins: [],
            fields: [new FormField(fieldType: 'text', name: 'full_name', label: ['ja' => '氏名'], required: false, sortOrder: 0)],
            status: 'active',
            adminNotificationSubject: '{name}',
            id: 3,
        );
        $submission = new Submission(organizationId: 7, contactFormId: 3, fieldValues: ['full_name' => '花子'], id: 9);

        self::assertSame('花子', AdminNotificationTemplate::subject($form, $submission));
    }

    public function test_unknown_variable_is_left_literal(): void
    {
        [$form, $submission] = $this->context(['name' => 'x'], '{unknown} {form_name}');

        self::assertSame('{unknown} AYANE お問い合わせ', AdminNotificationTemplate::subject($form, $submission));
    }

    public function test_missing_data_resolves_to_empty(): void
    {
        [$form, $submission] = $this->context([], '[{email}]');

        self::assertSame('[]', AdminNotificationTemplate::subject($form, $submission));
    }
}
