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
 * Variables are dynamic: every non-honeypot field is usable by its `name` (e.g. a `company` field
 * → `{company}`), plus the reserved `{form_name}` `{submitted_at}` `{message}` (the field summary).
 * Reserved names win over a same-named field. An unknown `{token}` is left literal; missing data
 * resolves to an empty string.
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
            '/\{([A-Za-z0-9_]+)\}/',
            static fn (array $m): string => array_key_exists($m[1], $variables) ? $variables[$m[1]] : $m[0],
            $template,
        ) ?? $template;
    }

    /** @return array<string, string> */
    private static function variables(ContactForm $form, Submission $submission): array
    {
        $variables = [];

        // Each non-honeypot field is usable by its name.
        foreach ($form->fields as $field) {
            if ($field->fieldType === FieldType::Honeypot->value) {
                continue;
            }
            $variables[$field->name] = self::stringify($submission->fieldValues[$field->name] ?? null);
        }

        // Reserved variables win over any field with the same name.
        $variables['form_name'] = $form->name;
        $variables['submitted_at'] = $submission->submittedAt ?? '';
        $variables['message'] = SubmissionSummary::fields($form, $submission);

        return $variables;
    }

    private static function stringify(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return is_scalar($value) ? (string) $value : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
}
