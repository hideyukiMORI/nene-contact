<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FieldType;
use NeneContact\Submission\Submission;

/**
 * Renders the admin-notification email subject/body (email-wording wave c). The recipient is the
 * operator (trusted), so submission values are interpolated — unlike the sender auto-reply, which
 * stays non-interpolated for backscatter safety. A form may override the subject/body; when unset,
 * the Japanese defaults are used (replacing the old English "New submission: …" — board #108).
 *
 * Variables: {form_name} {submitted_at} {email} {name} {message}. An unknown {token} is left
 * literal; missing data resolves to an empty string. Honeypot fields never appear ({message}
 * excludes them via {@see SubmissionSummary}).
 */
final class AdminNotificationTemplate
{
    public const DEFAULT_SUBJECT = '新しいお問い合わせ: {form_name}';

    public const DEFAULT_BODY = "「{form_name}」に新しいお問い合わせが届きました。\n\n{message}";

    public static function subject(ContactForm $form, Submission $submission): string
    {
        return self::render($form->adminNotificationSubject ?? self::DEFAULT_SUBJECT, $form, $submission);
    }

    public static function body(ContactForm $form, Submission $submission): string
    {
        return self::render($form->adminNotificationBody ?? self::DEFAULT_BODY, $form, $submission);
    }

    private static function render(string $template, ContactForm $form, Submission $submission): string
    {
        $variables = self::variables($form, $submission);

        return preg_replace_callback(
            '/\{([a-z_]+)\}/',
            static fn (array $m): string => array_key_exists($m[1], $variables) ? $variables[$m[1]] : $m[0],
            $template,
        ) ?? $template;
    }

    /** @return array<string, string> */
    private static function variables(ContactForm $form, Submission $submission): array
    {
        return [
            'form_name' => $form->name,
            'submitted_at' => $submission->submittedAt ?? '',
            'email' => self::firstOfType($form, $submission, FieldType::Email->value),
            'name' => self::name($form, $submission),
            'message' => SubmissionSummary::fields($form, $submission),
        ];
    }

    /** The value of the first field named `name`, else the first text field — case A. */
    private static function name(ContactForm $form, Submission $submission): string
    {
        foreach ($form->fields as $field) {
            if ($field->name === 'name') {
                $value = $submission->fieldValues['name'] ?? null;

                return is_string($value) ? trim($value) : '';
            }
        }

        return self::firstOfType($form, $submission, FieldType::Text->value);
    }

    private static function firstOfType(ContactForm $form, Submission $submission, string $type): string
    {
        foreach ($form->fields as $field) {
            if ($field->fieldType !== $type) {
                continue;
            }

            $value = $submission->fieldValues[$field->name] ?? null;
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return '';
    }
}
