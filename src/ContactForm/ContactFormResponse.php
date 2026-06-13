<?php

declare(strict_types=1);

namespace NeneContact\ContactForm;

/**
 * Presents a ContactForm as the public API/JSON shape. Reused by handlers and as the
 * sanitized audit snapshot (forms carry no secrets/PII).
 */
final readonly class ContactFormResponse
{
    /** @return array<string, mixed> */
    public static function toArray(ContactForm $form): array
    {
        return [
            'id' => $form->id,
            'name' => $form->name,
            'description' => $form->description,
            'public_form_key' => $form->publicFormKey,
            'default_locale' => $form->defaultLocale,
            'locales' => $form->locales,
            'allowed_origins' => $form->allowedOrigins,
            'status' => $form->status,
            'consent_required' => $form->consentRequired,
            'consent_label' => $form->consentLabel,
            'retention_days' => $form->retentionDays,
            'appearance' => ($form->appearance ?? Appearance::defaults())->toArray(),
            'fields' => array_map(
                static fn (FormField $f): array => [
                    'id' => $f->id,
                    'field_type' => $f->fieldType,
                    'name' => $f->name,
                    'label' => $f->label,
                    'placeholder' => $f->placeholder,
                    'description' => $f->description,
                    'required' => $f->required,
                    'options' => $f->options,
                    'config' => $f->config,
                    'sort_order' => $f->sortOrder,
                ],
                $form->fields,
            ),
            'created_at' => $form->createdAt,
            'updated_at' => $form->updatedAt,
        ];
    }
}
