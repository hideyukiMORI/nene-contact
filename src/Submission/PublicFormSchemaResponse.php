<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;

/**
 * Public, unauthenticated schema for rendering a form in the embed widget. Exposes only
 * what the widget needs (no organization_id, no internal ids beyond field identity).
 */
final readonly class PublicFormSchemaResponse
{
    /** @return array<string, mixed> */
    public static function toArray(ContactForm $form): array
    {
        return [
            'public_form_key' => $form->publicFormKey,
            'name' => $form->name,
            'default_locale' => $form->defaultLocale,
            'locales' => $form->locales,
            'fields' => array_map(
                static fn (FormField $f): array => [
                    'field_type' => $f->fieldType,
                    'name' => $f->name,
                    'label' => $f->label,
                    'required' => $f->required,
                    'options' => $f->options,
                    'sort_order' => $f->sortOrder,
                ],
                $form->fields,
            ),
        ];
    }
}
