<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;
use NeneContact\ContactForm\Appearance;
use NeneContact\ContactForm\AutoReply;
use NeneContact\ContactForm\ContactForm;
use NeneContact\ContactForm\FormField;

final readonly class PdoPublicFormReader implements PublicFormReaderInterface
{
    public function __construct(
        private DatabaseQueryExecutorInterface $query,
    ) {
    }

    public function findByPublicFormKey(string $publicFormKey): ?ContactForm
    {
        $row = $this->query->fetchOne(
            'SELECT id, organization_id, name, description, public_form_key, default_locale, locales_json, allowed_origins_json, status, consent_required, consent_label_json, appearance_json, autoreply_json, submit_label_json, post_submit, success_message_json, redirect_url, created_at, updated_at
             FROM contact_forms WHERE public_form_key = ?',
            [$publicFormKey],
        );

        if ($row === null) {
            return null;
        }

        $fieldRows = $this->query->fetchAll(
            // deleted_at IS NULL: editing a form soft-deletes the old field rows and inserts a
            // new set (ADR 0016), so the public schema must show only the live fields — matching
            // the admin repository — or it renders stale/duplicate fields.
            'SELECT id, contact_form_id, field_type, name, placeholder, description, label_json, required, options_json, config_json, sort_order
             FROM form_fields WHERE contact_form_id = ? AND deleted_at IS NULL ORDER BY sort_order ASC, id ASC',
            [(int) $row['id']],
        );

        $fields = array_map(static function (array $f): FormField {
            /** @var array<string, string> $label */
            $label = (array) json_decode((string) $f['label_json'], true, 512, JSON_THROW_ON_ERROR);
            /** @var list<array<string, mixed>>|null $options */
            $options = isset($f['options_json'])
                ? (array) json_decode((string) $f['options_json'], true, 512, JSON_THROW_ON_ERROR)
                : null;
            /** @var array<string, mixed>|null $config */
            $config = isset($f['config_json'])
                ? (array) json_decode((string) $f['config_json'], true, 512, JSON_THROW_ON_ERROR)
                : null;

            return new FormField(
                fieldType: (string) $f['field_type'],
                name: (string) $f['name'],
                label: $label,
                required: (bool) $f['required'],
                sortOrder: (int) $f['sort_order'],
                options: $options,
                placeholder: isset($f['placeholder']) ? (string) $f['placeholder'] : null,
                id: (int) $f['id'],
                contactFormId: (int) $f['contact_form_id'],
                config: $config,
                description: isset($f['description']) ? (string) $f['description'] : null,
            );
        }, $fieldRows);

        /** @var list<string> $locales */
        $locales = (array) json_decode((string) $row['locales_json'], true, 512, JSON_THROW_ON_ERROR);
        /** @var list<string> $allowedOrigins */
        $allowedOrigins = (array) json_decode((string) $row['allowed_origins_json'], true, 512, JSON_THROW_ON_ERROR);
        /** @var array<string, string>|null $consentLabel */
        $consentLabel = isset($row['consent_label_json'])
            ? (array) json_decode((string) $row['consent_label_json'], true, 512, JSON_THROW_ON_ERROR)
            : null;
        /** @var array<string, mixed>|null $appearance */
        $appearance = isset($row['appearance_json'])
            ? (array) json_decode((string) $row['appearance_json'], true, 512, JSON_THROW_ON_ERROR)
            : null;
        // Auto-reply drives the submit-path SenderAutoReply (#360). Kept out of the public
        // schema response — it is operator-internal config, not visitor-facing.
        /** @var array<string, mixed>|null $autoReply */
        $autoReply = isset($row['autoreply_json'])
            ? (array) json_decode((string) $row['autoreply_json'], true, 512, JSON_THROW_ON_ERROR)
            : null;
        /** @var array<string, string>|null $submitLabel */
        $submitLabel = isset($row['submit_label_json'])
            ? (array) json_decode((string) $row['submit_label_json'], true, 512, JSON_THROW_ON_ERROR)
            : null;
        /** @var array<string, string>|null $successMessage */
        $successMessage = isset($row['success_message_json'])
            ? (array) json_decode((string) $row['success_message_json'], true, 512, JSON_THROW_ON_ERROR)
            : null;

        return new ContactForm(
            organizationId: (int) $row['organization_id'],
            name: (string) $row['name'],
            description: isset($row['description']) ? (string) $row['description'] : null,
            publicFormKey: (string) $row['public_form_key'],
            defaultLocale: (string) $row['default_locale'],
            locales: $locales,
            allowedOrigins: $allowedOrigins,
            fields: $fields,
            status: (string) $row['status'],
            consentRequired: (bool) $row['consent_required'],
            consentLabel: $consentLabel,
            appearance: Appearance::fromStored($appearance),
            submitLabel: $submitLabel,
            postSubmit: isset($row['post_submit']) ? (string) $row['post_submit'] : 'message',
            successMessage: $successMessage,
            redirectUrl: isset($row['redirect_url']) ? (string) $row['redirect_url'] : null,
            autoReply: AutoReply::fromStored($autoReply),
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
