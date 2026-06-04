<?php

declare(strict_types=1);

namespace NeneContact\Api;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;

/**
 * Presents a ContactForm for the agent read surface: structural metadata only (no secrets,
 * no submitted PII). Channel configuration and other tenant secrets are never exposed here.
 */
final readonly class ApiFormResponse
{
    /** @return array<string, mixed> */
    public static function toArray(ContactForm $form): array
    {
        return [
            'id' => $form->id,
            'name' => $form->name,
            'public_form_key' => $form->publicFormKey,
            'default_locale' => $form->defaultLocale,
            'locales' => $form->locales,
            'status' => $form->status,
            'consent_required' => $form->consentRequired,
            'retention_days' => $form->retentionDays,
            'fields' => array_map(
                static fn (FormField $field): array => [
                    'name' => $field->name,
                    'field_type' => $field->fieldType,
                    'required' => $field->required,
                    'label' => $field->label,
                ],
                $form->fields,
            ),
        ];
    }
}
