<?php

declare(strict_types=1);

namespace NeneContact\Notification;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FieldType;
use NeneContact\ContactForm\FormField;
use NeneContact\Submission\Submission;

/**
 * Builds the transactional field summary (labels + values) shared by every channel sender.
 * Honeypot fields are excluded; no secrets or attachment bytes are included (charter §7).
 */
final class SubmissionSummary
{
    public static function text(ContactForm $form, Submission $submission): string
    {
        $labels = [];
        foreach ($form->fields as $field) {
            if ($field->fieldType === FieldType::Honeypot->value) {
                continue;
            }
            $labels[$field->name] = self::label($field, $form->defaultLocale);
        }

        $lines = ['New submission for "' . $form->name . '":', ''];
        foreach ($submission->fieldValues as $name => $value) {
            $label = $labels[$name] ?? $name;
            $lines[] = $label . ': ' . (is_scalar($value) ? (string) $value : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        }

        return implode("\n", $lines) . "\n";
    }

    private static function label(FormField $field, string $locale): string
    {
        if (isset($field->label[$locale]) && $field->label[$locale] !== '') {
            return $field->label[$locale];
        }

        return $field->name;
    }
}
