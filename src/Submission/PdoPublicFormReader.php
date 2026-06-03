<?php

declare(strict_types=1);

namespace NeneContact\Submission;

use Nene2\Database\DatabaseQueryExecutorInterface;
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
            'SELECT id, organization_id, name, public_form_key, default_locale, locales_json, allowed_origins_json, status, created_at, updated_at
             FROM contact_forms WHERE public_form_key = ?',
            [$publicFormKey],
        );

        if ($row === null) {
            return null;
        }

        $fieldRows = $this->query->fetchAll(
            'SELECT id, contact_form_id, field_type, name, label_json, required, options_json, sort_order
             FROM form_fields WHERE contact_form_id = ? ORDER BY sort_order ASC, id ASC',
            [(int) $row['id']],
        );

        $fields = array_map(static function (array $f): FormField {
            /** @var array<string, string> $label */
            $label = (array) json_decode((string) $f['label_json'], true, 512, JSON_THROW_ON_ERROR);
            /** @var list<array<string, mixed>>|null $options */
            $options = isset($f['options_json'])
                ? (array) json_decode((string) $f['options_json'], true, 512, JSON_THROW_ON_ERROR)
                : null;

            return new FormField(
                fieldType: (string) $f['field_type'],
                name: (string) $f['name'],
                label: $label,
                required: (bool) $f['required'],
                sortOrder: (int) $f['sort_order'],
                options: $options,
                id: (int) $f['id'],
                contactFormId: (int) $f['contact_form_id'],
            );
        }, $fieldRows);

        /** @var list<string> $locales */
        $locales = (array) json_decode((string) $row['locales_json'], true, 512, JSON_THROW_ON_ERROR);
        /** @var list<string> $allowedOrigins */
        $allowedOrigins = (array) json_decode((string) $row['allowed_origins_json'], true, 512, JSON_THROW_ON_ERROR);

        return new ContactForm(
            organizationId: (int) $row['organization_id'],
            name: (string) $row['name'],
            publicFormKey: (string) $row['public_form_key'],
            defaultLocale: (string) $row['default_locale'],
            locales: $locales,
            allowedOrigins: $allowedOrigins,
            fields: $fields,
            status: (string) $row['status'],
            id: (int) $row['id'],
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
        );
    }
}
