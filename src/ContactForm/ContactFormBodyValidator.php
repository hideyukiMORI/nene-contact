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

        // Optional form description (builder spec v1.0): blank collapses to null, capped so the
        // embed intro stays bounded.
        $description = is_string($body['description'] ?? null) ? trim((string) $body['description']) : '';
        $description = $description === '' ? null : mb_substr($description, 0, 2000);

        // Optional custom public key (slug). Lowercased; only a-z0-9 and hyphens, 2-64 chars, no
        // leading/trailing hyphen. Uniqueness is enforced in the use case (needs the repository).
        $publicFormKey = null;
        if (is_string($body['public_form_key'] ?? null) && trim((string) $body['public_form_key']) !== '') {
            $publicFormKey = strtolower(trim((string) $body['public_form_key']));
            if (preg_match('/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/', $publicFormKey) !== 1) {
                $errors[] = new ValidationError('public_form_key', 'Public key may use only lowercase letters, digits and hyphens (2-64 chars, no leading/trailing hyphen).', 'invalid');
            }
        }

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

        // Optional embed appearance (builder spec — appearance v1). Missing/partial fills from
        // defaults; invalid colours/mode/font/radius surface as field errors.
        [$appearance, $appearanceErrors] = Appearance::parse($body['appearance'] ?? null);
        foreach ($appearanceErrors as $appearanceError) {
            $errors[] = $appearanceError;
        }

        // Submit experience (builder フォーム設定「送信ボタン・送信後」): a per-locale submit label,
        // and what happens after a successful submit (a completion message or a redirect).
        $submitLabel = self::localeMap($body['submit_label'] ?? null);
        if ($submitLabel !== [] && array_diff(array_keys($submitLabel), self::SUPPORTED_LOCALES) !== []) {
            $errors[] = new ValidationError('submit_label', 'Submit label locales must be a subset of {ja, en}.', 'invalid');
        }
        $successMessage = self::localeMap($body['success_message'] ?? null);
        if ($successMessage !== [] && array_diff(array_keys($successMessage), self::SUPPORTED_LOCALES) !== []) {
            $errors[] = new ValidationError('success_message', 'Success message locales must be a subset of {ja, en}.', 'invalid');
        }

        // Sender auto-reply (#360): optional per-form config. Subject/body are per-locale operator
        // copy; when enabled, the default locale must carry both (mirrors the consent-label rule).
        [$autoReply, $autoReplyErrors] = AutoReply::parse($body['autoreply'] ?? null);
        foreach ($autoReplyErrors as $autoReplyError) {
            $errors[] = $autoReplyError;
        }
        if ($autoReply->isEnabled() && !$autoReply->isDeliverable($defaultLocale)) {
            $errors[] = new ValidationError('autoreply', "A subject and body for the default locale ({$defaultLocale}) are required when the auto-reply is enabled.", 'required');
        }

        // Admin-notification template (email-wording wave c): optional per-form subject/body with
        // {variables}. Null resolves to the default at send time.
        $adminSubject = self::optionalCappedString($body['admin_notification_subject'] ?? null);
        if ($adminSubject !== null && mb_strlen($adminSubject) > 255) {
            $errors[] = new ValidationError('admin_notification_subject', 'admin_notification_subject must be at most 255 characters.', 'too_long');
        }
        $adminBody = self::optionalCappedString($body['admin_notification_body'] ?? null);
        if ($adminBody !== null && mb_strlen($adminBody) > 5000) {
            $errors[] = new ValidationError('admin_notification_body', 'admin_notification_body must be at most 5000 characters.', 'too_long');
        }

        $postSubmit = is_string($body['post_submit'] ?? null) ? (string) $body['post_submit'] : 'message';
        if (!in_array($postSubmit, ['message', 'redirect'], true)) {
            $errors[] = new ValidationError('post_submit', 'Post-submit action must be "message" or "redirect".', 'invalid');
            $postSubmit = 'message';
        }

        $redirectUrl = null;
        if (is_string($body['redirect_url'] ?? null) && trim((string) $body['redirect_url']) !== '') {
            $redirectUrl = mb_substr(trim((string) $body['redirect_url']), 0, 2048);
            if (!preg_match('#^https?://#i', $redirectUrl)) {
                $errors[] = new ValidationError('redirect_url', 'Redirect URL must start with http:// or https://.', 'invalid');
            }
        }
        if ($postSubmit === 'redirect' && $redirectUrl === null) {
            $errors[] = new ValidationError('redirect_url', 'A redirect URL is required when the post-submit action is redirect.', 'required');
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
            $options = self::normalizeOptions($raw['options'] ?? null);
            // Optional placeholder (hint text); blank collapses to null, capped to the column width.
            $placeholder = is_string($raw['placeholder'] ?? null) ? trim((string) $raw['placeholder']) : '';
            $placeholder = $placeholder === '' ? null : mb_substr($placeholder, 0, 255);
            // Optional per-field description (hint under the label); blank collapses to null.
            // Note: distinct from the form-level $description above — do not shadow it.
            $fieldDescription = is_string($raw['description'] ?? null) ? trim((string) $raw['description']) : '';
            $fieldDescription = $fieldDescription === '' ? null : mb_substr($fieldDescription, 0, 2000);

            if (FieldType::isProhibited($fieldType)) {
                $errors[] = new ValidationError("fields.{$i}.field_type", "Field type '{$fieldType}' is prohibited (APPI compliance, charter §8).", 'prohibited');
            } elseif (!FieldType::isAllowed($fieldType)) {
                $errors[] = new ValidationError("fields.{$i}.field_type", 'Unsupported field type.', 'invalid');
            }

            if ($fieldName === '') {
                $errors[] = new ValidationError("fields.{$i}.name", 'Field name is required.', 'required');
            }

            // A honeypot is hidden from visitors (ADR 0010), so it carries no visible label —
            // exempt it from the default-locale label requirement.
            if ($fieldType !== FieldType::Honeypot->value
                && (!isset($label[$defaultLocale]) || $label[$defaultLocale] === '')) {
                $errors[] = new ValidationError("fields.{$i}.label", "Label for the default locale ({$defaultLocale}) is required.", 'required');
            }

            // Choice (select) fields carry a declarative display config (choice-field
            // management UI, builder spec v2.0). The style governs the selection logic.
            $config = null;
            if ($fieldType === FieldType::Select->value) {
                if ($options === null || $options === []) {
                    $errors[] = new ValidationError("fields.{$i}.options", 'Select fields require options.', 'required');
                }

                $rawConfig = is_array($raw['config'] ?? null) ? $raw['config'] : [];
                $styleValue = is_string($rawConfig['style'] ?? null) && $rawConfig['style'] !== ''
                    ? (string) $rawConfig['style']
                    : ChoiceStyle::Radio->value;

                if (!ChoiceStyle::isAllowed($styleValue)) {
                    $errors[] = new ValidationError("fields.{$i}.config.style", "Unsupported choice style '{$styleValue}'.", 'invalid');
                } else {
                    $optionValues = array_map(static fn (array $o): string => (string) $o['value'], $options ?? []);
                    $config = ChoiceFieldConfig::normalize($rawConfig, ChoiceStyle::from($styleValue), $optionValues);
                }
            } elseif (FieldType::isAllowed($fieldType)) {
                // Non-choice types carry a declarative per-type config (text/email/phone/textarea/
                // date/file — field-config UI). checkbox/honeypot normalize to null.
                $rawConfig = is_array($raw['config'] ?? null) ? $raw['config'] : [];
                $config = FieldTypeConfig::normalize($fieldType, $rawConfig);
            }

            $fields[] = new FormField(
                fieldType: $fieldType,
                name: $fieldName,
                label: $label,
                required: $required,
                sortOrder: $sort++,
                options: $options,
                placeholder: $placeholder,
                config: $config,
                description: $fieldDescription,
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
            description: $description,
            publicFormKey: $publicFormKey,
            consentRequired: $consentRequired,
            consentLabel: $consentLabel === [] ? null : $consentLabel,
            retentionDays: $retentionDays,
            appearance: $appearance,
            submitLabel: $submitLabel === [] ? null : $submitLabel,
            postSubmit: $postSubmit,
            successMessage: $successMessage === [] ? null : $successMessage,
            redirectUrl: $redirectUrl,
            autoReply: $autoReply,
            adminNotificationSubject: $adminSubject,
            adminNotificationBody: $adminBody,
        );
    }

    /** Trim a value to a nullable string; blank becomes null. */
    private static function optionalCappedString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * Normalize a per-locale label map (ja/en); blank values dropped, each capped.
     *
     * @return array<string, string>
     */
    private static function localeMap(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $locale => $text) {
            if (is_string($locale) && is_string($text) && trim($text) !== '') {
                $out[$locale] = mb_substr(trim($text), 0, 500);
            }
        }

        return $out;
    }

    /**
     * Normalize choice-field options into the bounded, snake_case shape persisted in
     * options_json: a non-empty string `value` (the stable id `defaults` reference),
     * per-locale `label`, and the optional per-option `description` (per-locale) + `image`
     * flag used by picture choice (builder spec v2.0). Options without a value are dropped.
     *
     * @return list<array<string, mixed>>|null
     */
    private static function normalizeOptions(mixed $raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }

        $out = [];
        foreach ($raw as $option) {
            if (!is_array($option)) {
                continue;
            }

            $value = is_string($option['value'] ?? null) ? trim((string) $option['value']) : '';
            if ($value === '') {
                continue;
            }

            /** @var array<string, string> $label */
            $label = is_array($option['label'] ?? null)
                ? array_map(static fn ($v): string => (string) $v, $option['label'])
                : [];

            $normalized = ['value' => mb_substr($value, 0, 255), 'label' => $label];

            if (is_array($option['description'] ?? null)) {
                $description = array_filter(
                    array_map(static fn ($v): string => (string) $v, $option['description']),
                    static fn (string $v): bool => trim($v) !== '',
                );
                if ($description !== []) {
                    $normalized['description'] = $description;
                }
            }

            if (($option['image'] ?? false) === true) {
                $normalized['image'] = true;
            }

            $out[] = $normalized;
        }

        return $out;
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
