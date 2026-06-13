<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use NeneContact\ContactForm\Appearance;
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
            'description' => $form->description,
            'default_locale' => $form->defaultLocale,
            'locales' => $form->locales,
            // The embed renders an explicit, unchecked consent checkbox when required (charter §3).
            'consent_required' => $form->consentRequired,
            'consent_label' => $form->consentLabel,
            // Embed theme + chrome (builder spec — appearance v1); defaults when unset.
            'appearance' => ($form->appearance ?? Appearance::defaults())->toArray(),
            // Submit experience (builder フォーム設定): button label + after-submit behaviour.
            'submit_label' => $form->submitLabel,
            'post_submit' => $form->postSubmit,
            'success_message' => $form->successMessage,
            'redirect_url' => $form->redirectUrl,
            'fields' => array_map(
                static fn (FormField $f): array => [
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
        ];
    }
}
