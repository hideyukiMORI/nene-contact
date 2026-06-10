<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;

/**
 * Validates and normalizes a contact-form request body (create or update) into a
 * {@see CreateContactFormInput}. Shared so create and update enforce identical rules:
 * locale subset {ja, en} (ADR 0011), consent label for the default locale when required
 * (charter §3), positive retention (charter §5), and the prohibited/allowed field types
 * (charter §8).
 */
final readonly class ContactFormBodyValidator
{
    /** @var list<string> */
    private const SUPPORTED_LOCALES = ['ja', 'en'];

    /**
     * @param array<string, mixed> $body
     *
     * @throws ValidationException
     */
    public static function parse(array $body): CreateContactFormInput
    {
        $errors = [];

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        $defaultLocale = (string) ($body['default_locale'] ?? 'ja');
        if (!in_array($defaultLocale, self::SUPPORTED_LOCALES, true)) {
            $errors[] = new ValidationError('default_locale', 'Locale must be ja or en.', 'invalid');
        }

        $locales = self::stringList($body['locales'] ?? []);
        if ($locales === []) {
            $errors[] = new ValidationError('locales', 'At least one locale is required.', 'required');
        } elseif (array_diff($locales, self::SUPPORTED_LOCALES) !== []) {
            $errors[] = new ValidationError('locales', 'Locales must be a subset of {ja, en}.', 'invalid');
        } elseif (!in_array($defaultLocale, $locales, true)) {
            $errors[] = new ValidationError('default_locale', 'Default locale must be one of the form locales.', 'invalid');
        }

        $allowedOrigins = self::stringList($body['allowed_origins'] ?? []);

        // Consent (charter §3): when required, a per-locale label for the default locale is
        // mandatory, and labels are restricted to {ja, en} (ADR 0011).
        $consentRequired = (bool) ($body['consent_required'] ?? false);
        /** @var array<string, string> $consentLabel */
        $consentLabel = is_array($body['consent_label'] ?? null)
            ? array_map(static fn ($v): string => (string) $v, $body['consent_label'])
            : [];

        if ($consentLabel !== [] && array_diff(array_keys($consentLabel), self::SUPPORTED_LOCALES) !== []) {
            $errors[] = new ValidationError('consent_label', 'Consent label locales must be a subset of {ja, en}.', 'invalid');
        }

        if ($consentRequired && (!isset($consentLabel[$defaultLocale]) || trim($consentLabel[$defaultLocale]) === '')) {
            $errors[] = new ValidationError('consent_label', "A consent label for the default locale ({$defaultLocale}) is required when consent is required.", 'required');
        }

        // Retention (charter §5): optional per-form override; null falls back to the
        // documented default. Must be a positive number of days when provided.
        $retentionDays = null;
        if (array_key_exists('retention_days', $body) && $body['retention_days'] !== null) {
            $retentionDays = (int) $body['retention_days'];
            if ($retentionDays < 1) {
                $errors[] = new ValidationError('retention_days', 'Retention days must be a positive integer.', 'invalid');
            }
        }

        $rawFields = is_array($body['fields'] ?? null) ? $body['fields'] : [];
        $fields = [];
        $sort = 0;

        foreach (array_values($rawFields) as $i => $raw) {
            if (!is_array($raw)) {
                $errors[] = new ValidationError("fields.{$i}", 'Field must be an object.', 'invalid');
                continue;
            }

            $fieldType = (string) ($raw['field_type'] ?? '');
            $fieldName = trim((string) ($raw['name'] ?? ''));
            /** @var array<string, string> $label */
            $label = is_array($raw['label'] ?? null) ? array_map(static fn ($v): string => (string) $v, $raw['label']) : [];
            $required = (bool) ($raw['required'] ?? false);
            /** @var list<array<string, mixed>>|null $options */
            $options = is_array($raw['options'] ?? null) ? array_values(array_filter($raw['options'], 'is_array')) : null;

            if (FieldType::isProhibited($fieldType)) {
                $errors[] = new ValidationError("fields.{$i}.field_type", "Field type '{$fieldType}' is prohibited (APPI compliance, charter §8).", 'prohibited');
            } elseif (!FieldType::isAllowed($fieldType)) {
                $errors[] = new ValidationError("fields.{$i}.field_type", 'Unsupported field type.', 'invalid');
            }

            if ($fieldName === '') {
                $errors[] = new ValidationError("fields.{$i}.name", 'Field name is required.', 'required');
            }

            if (!isset($label[$defaultLocale]) || $label[$defaultLocale] === '') {
                $errors[] = new ValidationError("fields.{$i}.label", "Label for the default locale ({$defaultLocale}) is required.", 'required');
            }

            if ($fieldType === FieldType::Select->value && ($options === null || $options === [])) {
                $errors[] = new ValidationError("fields.{$i}.options", 'Select fields require options.', 'required');
            }

            $fields[] = new FormField(
                fieldType: $fieldType,
                name: $fieldName,
                label: $label,
                required: $required,
                sortOrder: $sort++,
                options: $options,
            );
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        return new CreateContactFormInput(
            name: $name,
            defaultLocale: $defaultLocale,
            locales: $locales,
            allowedOrigins: $allowedOrigins,
            fields: $fields,
            consentRequired: $consentRequired,
            consentLabel: $consentLabel === [] ? null : $consentLabel,
            retentionDays: $retentionDays,
        );
    }

    /**
     * @return list<string>
     */
    private static function stringList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            }
        }

        return $out;
    }
}
